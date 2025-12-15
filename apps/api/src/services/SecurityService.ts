import {ProjectDisabledEmail, sendPlatformEmail} from '@plunk/email';
import React from 'react';
import signale from 'signale';

import {prisma} from '../database/prisma.js';
import {redis} from '../database/redis.js';
import {Keys} from './keys.js';
import {NtfyService} from './NtfyService.js';
import {QueueService} from './QueueService.js';
import {DASHBOARD_URI, LANDING_URI} from '../app/constants.js';

/**
 * Security thresholds for bounce and complaint rates
 * These limits protect AWS SES reputation and prevent account suspension
 */
const SECURITY_THRESHOLDS = {
  // Minimum emails required before enforcing limits (prevents false positives)
  MIN_EMAILS_FOR_ENFORCEMENT: 100,

  // Bounce rate thresholds (hard bounces only)
  BOUNCE_7DAY_WARNING: 3,
  BOUNCE_7DAY_CRITICAL: 8,
  BOUNCE_ALLTIME_WARNING: 2,
  BOUNCE_ALLTIME_CRITICAL: 5,

  // Complaint rate thresholds (spam reports)
  COMPLAINT_7DAY_WARNING: 0.05,
  COMPLAINT_7DAY_CRITICAL: 0.1,
  COMPLAINT_ALLTIME_WARNING: 0.02,
  COMPLAINT_ALLTIME_CRITICAL: 0.08,
} as const;

interface RateData {
  total: number;
  bounces: number;
  complaints: number;
  bounceRate: number;
  complaintRate: number;
}

interface SecurityStatus {
  projectId: string;
  isHealthy: boolean;
  shouldDisable: boolean;
  sevenDay: RateData;
  allTime: RateData;
  violations: string[];
  warnings: string[];
}

export class SecurityService {
  private static readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get security status for a project (with caching)
   */
  public static async getSecurityStatus(projectId: string): Promise<SecurityStatus> {
    try {
      // Try to get from cache first
      const cacheKey = Keys.Security.rates(projectId);
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate fresh data
      const status = await this.calculateSecurityStatus(projectId);

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(status));

      return status;
    } catch (error) {
      signale.error('[SECURITY] Failed to get security status:', error);
      // Return safe defaults on error
      return {
        projectId,
        isHealthy: true,
        shouldDisable: false,
        sevenDay: {
          total: 0,
          bounces: 0,
          complaints: 0,
          bounceRate: 0,
          complaintRate: 0,
        },
        allTime: {
          total: 0,
          bounces: 0,
          complaints: 0,
          bounceRate: 0,
          complaintRate: 0,
        },
        violations: [],
        warnings: [],
      };
    }
  }

  /**
   * Check security status and auto-disable project if thresholds are exceeded
   * This should be called after bounce/complaint events are processed
   */
  public static async checkAndEnforceSecurityLimits(projectId: string): Promise<void> {
    try {
      // Invalidate cache to get fresh data
      await this.invalidateCache(projectId);

      // Get current security status
      const status = await this.getSecurityStatus(projectId);

      // If project should be disabled, disable it
      if (status.shouldDisable) {
        await this.disableProject(projectId, status);
      } else if (status.warnings.length > 0) {
        // Log warnings for monitoring
        signale.warn(`[SECURITY] Project ${projectId} has security warnings:`, status.warnings);

        // Get project name for notification
        const project = await prisma.project.findUnique({
          where: {id: projectId},
          select: {name: true},
        });

        if (project) {
          // Send notification about security warning
          await NtfyService.notifySecurityWarning(project.name, projectId, status.warnings);
        }
      }
    } catch (error) {
      // Log error but don't throw - we don't want security checks to break the webhook
      signale.error(`[SECURITY] Failed to check security limits for project ${projectId}:`, error);
    }
  }

  /**
   * Invalidate cached security data for a project
   * Should be called after bounce/complaint events
   */
  public static async invalidateCache(projectId: string): Promise<void> {
    try {
      const cacheKey = Keys.Security.rates(projectId);
      await redis.del(cacheKey);
    } catch (error) {
      signale.error(`[SECURITY] Failed to invalidate cache for project ${projectId}:`, error);
    }
  }

  /**
   * Check if a user is a member of any disabled project
   * Users with disabled projects cannot create new projects
   */
  public static async userHasDisabledProject(userId: string): Promise<{
    hasDisabledProject: boolean;
    disabledProjectNames: string[];
  }> {
    const disabledMemberships = await prisma.membership.findMany({
      where: {
        userId,
        project: {
          disabled: true,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      hasDisabledProject: disabledMemberships.length > 0,
      disabledProjectNames: disabledMemberships.map(m => m.project.name),
    };
  }

  /**
   * Check if a specific project is disabled
   */
  public static async isProjectDisabled(projectId: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: {id: projectId},
      select: {disabled: true},
    });

    return project?.disabled ?? false;
  }

  /**
   * Get a project's security metrics (for admin/dashboard display)
   */
  public static async getProjectSecurityMetrics(projectId: string): Promise<{
    status: SecurityStatus;
    thresholds: typeof SECURITY_THRESHOLDS;
    isDisabled: boolean;
  }> {
    const [status, project] = await Promise.all([
      this.getSecurityStatus(projectId),
      prisma.project.findUnique({
        where: {id: projectId},
        select: {disabled: true},
      }),
    ]);

    return {
      status,
      thresholds: SECURITY_THRESHOLDS,
      isDisabled: project?.disabled ?? false,
    };
  }

  /**
   * Calculate bounce and complaint rates for a project
   */
  private static async calculateRates(projectId: string, startDate?: Date): Promise<RateData> {
    const where = {
      projectId,
      ...(startDate && {
        createdAt: {
          gte: startDate,
        },
      }),
    };

    // Get counts in parallel for performance
    const [total, bounces, complaints] = await Promise.all([
      prisma.email.count({where}),
      prisma.email.count({
        where: {
          ...where,
          bouncedAt: {not: null},
        },
      }),
      prisma.email.count({
        where: {
          ...where,
          complainedAt: {not: null},
        },
      }),
    ]);

    const bounceRate = total > 0 ? (bounces / total) * 100 : 0;
    const complaintRate = total > 0 ? (complaints / total) * 100 : 0;

    return {
      total,
      bounces,
      complaints,
      bounceRate,
      complaintRate,
    };
  }

  /**
   * Calculate security status without caching
   */
  private static async calculateSecurityStatus(projectId: string): Promise<SecurityStatus> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get 7-day and all-time rates in parallel
    const [sevenDay, allTime] = await Promise.all([
      this.calculateRates(projectId, sevenDaysAgo),
      this.calculateRates(projectId),
    ]);

    const violations: string[] = [];
    const warnings: string[] = [];

    // Only enforce if minimum emails threshold is met
    const hasMinimumVolume = allTime.total >= SECURITY_THRESHOLDS.MIN_EMAILS_FOR_ENFORCEMENT;

    if (hasMinimumVolume) {
      // Check 7-day bounce rate
      if (sevenDay.bounceRate >= SECURITY_THRESHOLDS.BOUNCE_7DAY_CRITICAL) {
        violations.push(
          `7-day bounce rate (${sevenDay.bounceRate.toFixed(2)}%) exceeds critical threshold (${SECURITY_THRESHOLDS.BOUNCE_7DAY_CRITICAL}%)`,
        );
      } else if (sevenDay.bounceRate >= SECURITY_THRESHOLDS.BOUNCE_7DAY_WARNING) {
        warnings.push(
          `7-day bounce rate (${sevenDay.bounceRate.toFixed(2)}%) exceeds warning threshold (${SECURITY_THRESHOLDS.BOUNCE_7DAY_WARNING}%)`,
        );
      }

      // Check all-time bounce rate
      if (allTime.bounceRate >= SECURITY_THRESHOLDS.BOUNCE_ALLTIME_CRITICAL) {
        violations.push(
          `All-time bounce rate (${allTime.bounceRate.toFixed(2)}%) exceeds critical threshold (${SECURITY_THRESHOLDS.BOUNCE_ALLTIME_CRITICAL}%)`,
        );
      } else if (allTime.bounceRate >= SECURITY_THRESHOLDS.BOUNCE_ALLTIME_WARNING) {
        warnings.push(
          `All-time bounce rate (${allTime.bounceRate.toFixed(2)}%) exceeds warning threshold (${SECURITY_THRESHOLDS.BOUNCE_ALLTIME_WARNING}%)`,
        );
      }

      // Check 7-day complaint rate
      if (sevenDay.complaintRate >= SECURITY_THRESHOLDS.COMPLAINT_7DAY_CRITICAL) {
        violations.push(
          `7-day complaint rate (${sevenDay.complaintRate.toFixed(3)}%) exceeds critical threshold (${SECURITY_THRESHOLDS.COMPLAINT_7DAY_CRITICAL}%)`,
        );
      } else if (sevenDay.complaintRate >= SECURITY_THRESHOLDS.COMPLAINT_7DAY_WARNING) {
        warnings.push(
          `7-day complaint rate (${sevenDay.complaintRate.toFixed(3)}%) exceeds warning threshold (${SECURITY_THRESHOLDS.COMPLAINT_7DAY_WARNING}%)`,
        );
      }

      // Check all-time complaint rate
      if (allTime.complaintRate >= SECURITY_THRESHOLDS.COMPLAINT_ALLTIME_CRITICAL) {
        violations.push(
          `All-time complaint rate (${allTime.complaintRate.toFixed(3)}%) exceeds critical threshold (${SECURITY_THRESHOLDS.COMPLAINT_ALLTIME_CRITICAL}%)`,
        );
      } else if (allTime.complaintRate >= SECURITY_THRESHOLDS.COMPLAINT_ALLTIME_WARNING) {
        warnings.push(
          `All-time complaint rate (${allTime.complaintRate.toFixed(3)}%) exceeds warning threshold (${SECURITY_THRESHOLDS.COMPLAINT_ALLTIME_WARNING}%)`,
        );
      }
    }

    return {
      projectId,
      isHealthy: violations.length === 0,
      shouldDisable: violations.length > 0,
      sevenDay,
      allTime,
      violations,
      warnings,
    };
  }

  /**
   * Disable a project due to security violations
   */
  private static async disableProject(projectId: string, status: SecurityStatus): Promise<void> {
    try {
      // Check if already disabled to avoid duplicate logs
      const project = await prisma.project.findUnique({
        where: {id: projectId},
        select: {id: true, disabled: true, name: true},
      });

      if (!project) {
        signale.error(`[SECURITY] Project ${projectId} not found`);
        return;
      }

      if (project.disabled) {
        // Already disabled, just log the current violations
        signale.warn(
          `[SECURITY] Project ${projectId} (${project.name}) already disabled. Current violations:`,
          status.violations,
        );
        return;
      }

      // Disable the project
      await prisma.project.update({
        where: {id: projectId},
        data: {disabled: true},
      });

      // Log critical security event
      signale.error(
        `[SECURITY] Project ${projectId} (${project.name}) has been automatically disabled due to security violations:`,
        status.violations,
      );
      signale.info(
        `[SECURITY] 7-day stats: ${status.sevenDay.bounces} bounces, ${status.sevenDay.complaints} complaints out of ${status.sevenDay.total} emails`,
      );
      signale.info(
        `[SECURITY] All-time stats: ${status.allTime.bounces} bounces, ${status.allTime.complaints} complaints out of ${status.allTime.total} emails`,
      );

      // Cancel all pending jobs for this project
      try {
        await QueueService.cancelAllProjectJobs(projectId);
        signale.info(`[SECURITY] Cancelled all pending jobs for project ${projectId}`);
      } catch (error) {
        signale.error(`[SECURITY] Failed to cancel pending jobs for project ${projectId}:`, error);
      }

      // Send urgent notification about project suspension
      await NtfyService.notifyProjectDisabledForSecurity(project.name, projectId, status.violations);

      // Send email notification to project members
      try {
        const members = await prisma.membership.findMany({
          where: {projectId},
          include: {user: {select: {email: true}}},
        });
        const emails = members.map(m => m.user.email);
        if (emails.length > 0) {
          const template = React.createElement(ProjectDisabledEmail, {
            projectName: project.name,
            projectId,
            violations: status.violations,
            dashboardUrl: DASHBOARD_URI,
            landingUrl: LANDING_URI,
          });
          await Promise.all(
            emails.map(email => sendPlatformEmail(email, 'Project Disabled - Security Risk', template)),
          );
        }
      } catch (emailError) {
        signale.error(`[SECURITY] Failed to send project disabled email:`, emailError);
      }
    } catch (error) {
      signale.error(`[SECURITY] Failed to disable project ${projectId}:`, error);
    }
  }
}
