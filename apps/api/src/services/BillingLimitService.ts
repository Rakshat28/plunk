import {EmailSourceType} from '@plunk/db';
import signale from 'signale';

import {prisma} from '../database/prisma.js';
import {redis} from '../database/redis.js';
import {NtfyService} from './NtfyService.js';

/**
 * Usage information for a specific email category
 */
export interface CategoryUsage {
  limit: number | null; // null = unlimited
  usage: number;
  percentage: number; // 0-100
  isWarning: boolean; // true if >= 80%
  isBlocked: boolean; // true if >= 100%
}

/**
 * Complete billing limits and usage for a project
 */
export interface BillingLimitsResponse {
  workflows: CategoryUsage;
  campaigns: CategoryUsage;
  transactional: CategoryUsage;
}

/**
 * Result of limit check
 */
export interface LimitCheckResult {
  allowed: boolean;
  warning: boolean; // true if >= 80% but < 100%
  usage: number;
  limit: number | null;
  percentage: number;
  message?: string;
}

/**
 * Billing Limit Service
 * Handles usage tracking and enforcement of billing limits per email category
 *
 * FREE TIER LIMITS:
 * - Free tier projects (billing enabled, no subscription) have a total limit of 1000 emails/month
 * - This limit is shared across all email types (workflows + campaigns + transactional)
 * - Paid tier projects (with subscription) can have custom per-category limits or unlimited
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Operates at scale with 1M+ contacts/month (potentially millions of emails)
 * - Uses Redis caching (5-min TTL) to avoid expensive DB queries on every email send
 * - Composite index on (projectId, sourceType, createdAt) enables fast filtered counts
 * - Graceful degradation: cache misses fall back to DB without blocking
 * - Non-blocking: errors are logged but don't prevent email sending
 */
export class BillingLimitService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly WARNING_THRESHOLD = 0.8; // 80%
  private static readonly FREE_TIER_TOTAL_LIMIT = 1000; // Total emails per month for free tier projects

  /**
   * Get total usage count across all email categories
   * Used for free tier total limit enforcement
   *
   * @param projectId - Project ID
   * @returns Total email count for the calendar month (all types combined)
   */
  public static async getTotalUsage(projectId: string): Promise<number> {
    const {start, end} = this.getCurrentMonthRange();

    try {
      const count = await prisma.email.count({
        where: {
          projectId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });

      return count;
    } catch (error) {
      signale.error(`[BILLING_LIMIT] Failed to query total usage for ${projectId}:`, error);
      return 0; // Return 0 on error to avoid blocking
    }
  }

  /**
   * Get current usage count for a specific email category
   * Uses Redis cache with 5-minute TTL to minimize DB queries
   *
   * @param projectId - Project ID
   * @param sourceType - Email category (TRANSACTIONAL, CAMPAIGN, WORKFLOW)
   * @returns Current usage count for the calendar month
   */
  public static async getUsage(projectId: string, sourceType: EmailSourceType): Promise<number> {
    const cacheKey = this.getCacheKey(projectId, sourceType);

    try {
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return parseInt(cached, 10);
      }
    } catch (error) {
      signale.warn(`[BILLING_LIMIT] Cache read failed for ${cacheKey}:`, error);
      // Continue to DB query on cache failure
    }

    // Cache miss - query database
    const {start, end} = this.getCurrentMonthRange();

    try {
      const count = await prisma.email.count({
        where: {
          projectId,
          sourceType,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });

      // Cache the result
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, count.toString());
      } catch (error) {
        signale.warn(`[BILLING_LIMIT] Failed to cache usage for ${cacheKey}:`, error);
      }

      return count;
    } catch (error) {
      signale.error(`[BILLING_LIMIT] Failed to query usage for ${projectId}/${sourceType}:`, error);
      return 0; // Return 0 on error to avoid blocking
    }
  }

  /**
   * Increment usage counter in cache (called after successful email send)
   * This keeps the cache accurate without requiring frequent DB queries
   *
   * @param projectId - Project ID
   * @param sourceType - Email category
   */
  public static async incrementUsage(projectId: string, sourceType: EmailSourceType): Promise<void> {
    const cacheKey = this.getCacheKey(projectId, sourceType);

    try {
      const exists = await redis.exists(cacheKey);
      if (exists) {
        // Only increment if key exists (was previously cached)
        await redis.incr(cacheKey);
      }
      // If not cached, next getUsage call will fetch from DB
    } catch (error) {
      signale.warn(`[BILLING_LIMIT] Failed to increment usage cache for ${cacheKey}:`, error);
      // Non-blocking: continue even if cache increment fails
    }
  }

  /**
   * Check if sending an email would exceed the billing limit
   * Returns detailed result including warning status
   *
   * For free tier projects (no subscription): checks total usage across all categories against 1000/month limit
   * For paid tier projects (with subscription): checks per-category limits if set
   *
   * @param projectId - Project ID
   * @param sourceType - Email category
   * @returns LimitCheckResult with allowed/warning status
   */
  public static async checkLimit(projectId: string, sourceType: EmailSourceType): Promise<LimitCheckResult> {
    try {
      // Get project billing info
      const project = await prisma.project.findUnique({
        where: {id: projectId},
        select: {
          name: true,
          subscription: true,
          billingLimitWorkflows: true,
          billingLimitCampaigns: true,
          billingLimitTransactional: true,
        },
      });

      if (!project) {
        signale.warn(`[BILLING_LIMIT] Project ${projectId} not found`);
        return {
          allowed: true,
          warning: false,
          usage: 0,
          limit: null,
          percentage: 0,
        };
      }

      // Free tier projects (no subscription): enforce total 1000 email/month limit
      if (!project.subscription) {
        const totalUsage = await this.getTotalUsage(projectId);
        const limit = this.FREE_TIER_TOTAL_LIMIT;
        const percentage = (totalUsage / limit) * 100;

        // Check if blocked (at or over limit)
        if (totalUsage >= limit) {
          await NtfyService.notifyBillingLimitExceeded(
            project.name,
            projectId,
            totalUsage,
            limit,
            EmailSourceType.TRANSACTIONAL, // Use generic type for notification
          );

          return {
            allowed: false,
            warning: false,
            usage: totalUsage,
            limit,
            percentage,
            message: `Free tier limit reached. You've sent ${totalUsage}/${limit} emails this month. Upgrade to continue sending.`,
          };
        }

        // Check if warning (80% or more)
        const isWarning = percentage >= this.WARNING_THRESHOLD * 100;
        if (isWarning) {
          await NtfyService.notifyBillingLimitApproaching(
            project.name,
            projectId,
            totalUsage,
            limit,
            percentage,
            EmailSourceType.TRANSACTIONAL, // Use generic type for notification
          );
        }

        return {
          allowed: true,
          warning: isWarning,
          usage: totalUsage,
          limit,
          percentage,
          message: isWarning
            ? `Warning: You've used ${Math.round(percentage)}% of your free tier limit (${totalUsage}/${limit} emails)`
            : undefined,
        };
      }

      // Paid tier projects (with subscription): check per-category limits if set
      let limit: number | null;
      switch (sourceType) {
        case EmailSourceType.WORKFLOW:
          limit = project.billingLimitWorkflows;
          break;
        case EmailSourceType.CAMPAIGN:
          limit = project.billingLimitCampaigns;
          break;
        case EmailSourceType.TRANSACTIONAL:
          limit = project.billingLimitTransactional;
          break;
        default:
          limit = null;
      }

      // If no limit set for paid tier, allow unlimited
      if (limit === null) {
        return {
          allowed: true,
          warning: false,
          usage: 0,
          limit: null,
          percentage: 0,
        };
      }

      // Get current usage
      const usage = await this.getUsage(projectId, sourceType);
      const percentage = limit > 0 ? (usage / limit) * 100 : 0;

      // Check if blocked (at or over limit)
      if (usage >= limit) {
        // Get project name for notification
        const project = await prisma.project.findUnique({
          where: {id: projectId},
          select: {name: true},
        });

        if (project) {
          // Send notification about limit exceeded
          await NtfyService.notifyBillingLimitExceeded(project.name, projectId, usage, limit, sourceType);
        }

        return {
          allowed: false,
          warning: false,
          usage,
          limit,
          percentage,
          message: `Billing limit reached for ${sourceType.toLowerCase()} emails. Current usage: ${usage}/${limit} (${Math.round(percentage)}%)`,
        };
      }

      // Check if warning (80% or more)
      const isWarning = percentage >= this.WARNING_THRESHOLD * 100;

      // Send notification for warning threshold
      if (isWarning) {
        const project = await prisma.project.findUnique({
          where: {id: projectId},
          select: {name: true},
        });

        if (project) {
          await NtfyService.notifyBillingLimitApproaching(project.name, projectId, usage, limit, percentage, sourceType);
        }
      }

      return {
        allowed: true,
        warning: isWarning,
        usage,
        limit,
        percentage,
        message: isWarning
          ? `Warning: ${sourceType.toLowerCase()} emails at ${Math.round(percentage)}% of limit (${usage}/${limit})`
          : undefined,
      };
    } catch (error) {
      signale.error(`[BILLING_LIMIT] Error checking limit for ${projectId}/${sourceType}:`, error);
      // On error, allow the email to prevent service disruption
      return {
        allowed: true,
        warning: false,
        usage: 0,
        limit: null,
        percentage: 0,
      };
    }
  }

  /**
   * Get complete billing limits and usage for all categories
   * Used for displaying limits in UI
   *
   * For free tier projects: shows total usage across all categories with 1000/month limit
   * For paid tier projects: shows per-category usage with custom limits
   *
   * @param projectId - Project ID
   * @returns Complete billing limits and usage information
   */
  public static async getLimitsAndUsage(projectId: string): Promise<BillingLimitsResponse> {
    try {
      // Get project info
      const project = await prisma.project.findUnique({
        where: {id: projectId},
        select: {
          subscription: true,
          billingLimitWorkflows: true,
          billingLimitCampaigns: true,
          billingLimitTransactional: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get usage for all categories in parallel
      const [workflowUsage, campaignUsage, transactionalUsage] = await Promise.all([
        this.getUsage(projectId, EmailSourceType.WORKFLOW),
        this.getUsage(projectId, EmailSourceType.CAMPAIGN),
        this.getUsage(projectId, EmailSourceType.TRANSACTIONAL),
      ]);

      // Helper to calculate category usage
      const calculateCategoryUsage = (usage: number, limit: number | null): CategoryUsage => {
        const percentage = limit !== null && limit > 0 ? (usage / limit) * 100 : 0;
        return {
          limit,
          usage,
          percentage,
          isWarning: limit !== null && percentage >= this.WARNING_THRESHOLD * 100,
          isBlocked: limit !== null && usage >= limit,
        };
      };

      // Free tier projects: show total usage with shared limit
      if (!project.subscription) {
        const totalUsage = workflowUsage + campaignUsage + transactionalUsage;
        const limit = this.FREE_TIER_TOTAL_LIMIT;
        const percentage = (totalUsage / limit) * 100;
        const isWarning = percentage >= this.WARNING_THRESHOLD * 100;
        const isBlocked = totalUsage >= limit;

        // For free tier, show the same limit and total usage for all three categories
        // This makes it clear in the UI that it's a shared limit
        const sharedUsageInfo: CategoryUsage = {
          limit,
          usage: totalUsage,
          percentage,
          isWarning,
          isBlocked,
        };

        return {
          workflows: sharedUsageInfo,
          campaigns: sharedUsageInfo,
          transactional: sharedUsageInfo,
        };
      }

      // Paid tier projects: show per-category limits
      return {
        workflows: calculateCategoryUsage(workflowUsage, project.billingLimitWorkflows),
        campaigns: calculateCategoryUsage(campaignUsage, project.billingLimitCampaigns),
        transactional: calculateCategoryUsage(transactionalUsage, project.billingLimitTransactional),
      };
    } catch (error) {
      signale.error(`[BILLING_LIMIT] Error getting limits and usage for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate usage cache for a project
   * Call this when billing period resets or limits are changed
   *
   * @param projectId - Project ID
   */
  public static async invalidateCache(projectId: string): Promise<void> {
    try {
      const keys = [
        this.getCacheKey(projectId, EmailSourceType.WORKFLOW),
        this.getCacheKey(projectId, EmailSourceType.CAMPAIGN),
        this.getCacheKey(projectId, EmailSourceType.TRANSACTIONAL),
      ];

      await Promise.all(keys.map(key => redis.del(key)));
      signale.debug(`[BILLING_LIMIT] Invalidated cache for project ${projectId}`);
    } catch (error) {
      signale.warn(`[BILLING_LIMIT] Failed to invalidate cache for ${projectId}:`, error);
    }
  }

  /**
   * Get Redis cache key for usage count
   */
  private static getCacheKey(projectId: string, sourceType: EmailSourceType): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `billing:usage:${projectId}:${sourceType}:${year}-${month}`;
  }

  /**
   * Get start and end dates for current calendar month
   */
  private static getCurrentMonthRange(): {start: Date; end: Date} {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {start, end};
  }
}
