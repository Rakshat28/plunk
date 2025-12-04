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
   * @param projectId - Project ID
   * @param sourceType - Email category
   * @returns LimitCheckResult with allowed/warning status
   */
  public static async checkLimit(projectId: string, sourceType: EmailSourceType): Promise<LimitCheckResult> {
    try {
      // Get project billing limits
      const project = await prisma.project.findUnique({
        where: {id: projectId},
        select: {
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

      // Get the limit for this source type
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

      // If no limit set, allow unlimited
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
   * @param projectId - Project ID
   * @returns Complete billing limits and usage information
   */
  public static async getLimitsAndUsage(projectId: string): Promise<BillingLimitsResponse> {
    try {
      // Get project limits
      const project = await prisma.project.findUnique({
        where: {id: projectId},
        select: {
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
