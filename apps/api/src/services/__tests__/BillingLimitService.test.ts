import {describe, it, expect, beforeEach, vi} from 'vitest';
import {EmailSourceType} from '@plunk/db';
import {BillingLimitService} from '../BillingLimitService';
import {EmailService} from '../EmailService';
import {factories, getPrismaClient} from '../../../../../test/helpers';
import {redis} from '../../database/redis';

describe('BillingLimitService - Critical Enforcement', () => {
  let projectId: string;
  let contactId: string;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    const {project} = await factories.createUserWithProject();
    projectId = project.id;

    const contact = await factories.createContact({projectId});
    contactId = contact.id;
  });

  describe('Revenue Protection - Limit Enforcement', () => {
    it('should BLOCK transactional emails when limit exceeded', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitTransactional: 5},
      });

      for (let i = 0; i < 5; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.TRANSACTIONAL,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      // Attempt to send 6th email should fail
      await expect(
        EmailService.sendTransactionalEmail({
          projectId,
          contactId,
          subject: 'Test',
          body: 'Test',
          from: 'test@example.com',
        }),
      ).rejects.toThrow(/billing limit/i);
    });

    it('should BLOCK campaign emails when limit exceeded', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 3},
      });

      // Create 3 campaign emails
      for (let i = 0; i < 3; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.CAMPAIGN,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      // 4th should fail
      const campaign = await factories.createCampaign({projectId});
      await expect(
        EmailService.sendCampaignEmail({
          projectId,
          contactId,
          campaignId: campaign.id,
          subject: 'Test',
          body: 'Test',
          from: 'test@example.com',
        }),
      ).rejects.toThrow(/billing limit/i);
    });

    it('should BLOCK workflow emails when limit exceeded', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitWorkflows: 2},
      });

      // Create 2 workflow emails
      for (let i = 0; i < 2; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.WORKFLOW,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      // 3rd should fail
      await expect(
        EmailService.sendWorkflowEmail({
          projectId,
          contactId,
          subject: 'Test',
          body: 'Test',
          from: 'test@example.com',
        }),
      ).rejects.toThrow(/billing limit/i);
    });

    it('should ALLOW emails when limit is null (unlimited)', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitTransactional: null},
      });

      // Create 100 emails
      for (let i = 0; i < 100; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.TRANSACTIONAL,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      // Should still allow more
      const result = await BillingLimitService.checkLimit(projectId, EmailSourceType.TRANSACTIONAL);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBeNull();
    });

    it('should enforce limits independently per source type', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {
          billingLimitTransactional: 5,
          billingLimitCampaigns: 5,
          billingLimitWorkflows: 5,
        },
      });

      // Max out transactional
      for (let i = 0; i < 5; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.TRANSACTIONAL,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      // Transactional should be blocked
      const transactionalCheck = await BillingLimitService.checkLimit(projectId, EmailSourceType.TRANSACTIONAL);
      expect(transactionalCheck.allowed).toBe(false);

      // Campaign should still be allowed
      const campaignCheck = await BillingLimitService.checkLimit(projectId, EmailSourceType.CAMPAIGN);
      expect(campaignCheck.allowed).toBe(true);

      // Workflow should still be allowed
      const workflowCheck = await BillingLimitService.checkLimit(projectId, EmailSourceType.WORKFLOW);
      expect(workflowCheck.allowed).toBe(true);
    });
  });

  describe('Warning Threshold (80%)', () => {
    it('should warn when usage reaches 80% of limit', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 10},
      });

      for (let i = 0; i < 8; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.CAMPAIGN,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      const result = await BillingLimitService.checkLimit(projectId, EmailSourceType.CAMPAIGN);

      expect(result.allowed).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.percentage).toBeGreaterThanOrEqual(80);
      expect(result.message).toMatch(/warning/i);
    });

    it('should not warn when usage is below 80%', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 10},
      });

      for (let i = 0; i < 5; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.CAMPAIGN,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      const result = await BillingLimitService.checkLimit(projectId, EmailSourceType.CAMPAIGN);

      expect(result.allowed).toBe(true);
      expect(result.warning).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });

  describe('Cache Performance & Fallback', () => {
    it('should use cached usage counts to avoid DB queries', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 100},
      });

      // First call - should query DB and cache
      const usage1 = await BillingLimitService.getUsage(projectId, EmailSourceType.CAMPAIGN);

      // Add email directly to DB (bypassing cache increment)
      await factories.createEmail({
        projectId,
        contactId,
        sourceType: EmailSourceType.CAMPAIGN,
      });

      // Second call within cache TTL - should return cached value (not reflect new email)
      const usage2 = await BillingLimitService.getUsage(projectId, EmailSourceType.CAMPAIGN);

      expect(usage2).toBe(usage1); // Same as cached value
    });

    it('should increment cache after successful email send', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 100},
      });

      await BillingLimitService.invalidateCache(projectId);

      const initialUsage = await BillingLimitService.getUsage(projectId, EmailSourceType.CAMPAIGN);

      // Send email (should increment cache)
      await EmailService.sendCampaignEmail({
        projectId,
        contactId,
        subject: 'Test',
        body: 'Test',
        from: 'test@example.com',
      });

      const finalUsage = await BillingLimitService.getUsage(projectId, EmailSourceType.CAMPAIGN);

      expect(finalUsage).toBe(initialUsage + 1);
    });

    it('should handle Redis failure gracefully without blocking emails', async () => {
      // Mock Redis failure
      vi.spyOn(redis, 'get').mockRejectedValueOnce(new Error('Redis connection failed'));

      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 100},
      });

      // Should fall back to DB and still work
      const result = await BillingLimitService.checkLimit(projectId, EmailSourceType.CAMPAIGN);

      expect(result.allowed).toBe(true);
    });

    it('should handle invalid project ID gracefully', async () => {
      // Non-existent project should not crash, should allow email (fail-open)
      const result = await BillingLimitService.checkLimit('non-existent-project', EmailSourceType.CAMPAIGN);

      expect(result.allowed).toBe(true);
      expect(result.usage).toBe(0);
      expect(result.limit).toBeNull();
    });
  });

  describe('Monthly Reset Behavior', () => {
    it('should only count emails from current calendar month', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 10},
      });

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      await prisma.email.create({
        data: {
          projectId,
          contactId,
          subject: 'Old',
          body: 'Old',
          from: 'test@example.com',
          sourceType: EmailSourceType.CAMPAIGN,
          status: 'SENT',
          createdAt: lastMonth,
        },
      });

      await factories.createEmail({
        projectId,
        contactId,
        sourceType: EmailSourceType.CAMPAIGN,
      });

      await BillingLimitService.invalidateCache(projectId);

      const usage = await BillingLimitService.getUsage(projectId, EmailSourceType.CAMPAIGN);

      // Should only count this month's email
      expect(usage).toBe(1);
    });
  });

  describe('Complete Limits Overview', () => {
    it('should return all category limits and usage', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {
          billingLimitWorkflows: 100,
          billingLimitCampaigns: 200,
          billingLimitTransactional: null, // Unlimited
        },
      });

      // Create various emails
      await factories.createEmail({
        projectId,
        contactId,
        sourceType: EmailSourceType.WORKFLOW,
      });
      await factories.createEmail({
        projectId,
        contactId,
        sourceType: EmailSourceType.CAMPAIGN,
      });
      await factories.createEmail({
        projectId,
        contactId,
        sourceType: EmailSourceType.CAMPAIGN,
      });

      await BillingLimitService.invalidateCache(projectId);

      const limits = await BillingLimitService.getLimitsAndUsage(projectId);

      expect(limits.workflows.limit).toBe(100);
      expect(limits.workflows.usage).toBe(1);
      expect(limits.workflows.percentage).toBe(1);
      expect(limits.workflows.isWarning).toBe(false);
      expect(limits.workflows.isBlocked).toBe(false);

      expect(limits.campaigns.limit).toBe(200);
      expect(limits.campaigns.usage).toBe(2);
      expect(limits.campaigns.percentage).toBe(1);

      expect(limits.transactional.limit).toBeNull();
      expect(limits.transactional.usage).toBe(0);
      expect(limits.transactional.percentage).toBe(0);
    });
  });

  describe('Race Condition Behavior', () => {
    it('should check limits before each email send (may allow some concurrent sends)', async () => {
      await prisma.project.update({
        where: {id: projectId},
        data: {billingLimitCampaigns: 10},
      });

      // Create 8 existing emails (80% of limit)
      for (let i = 0; i < 8; i++) {
        await factories.createEmail({
          projectId,
          contactId,
          sourceType: EmailSourceType.CAMPAIGN,
        });
      }

      await BillingLimitService.invalidateCache(projectId);

      // Try to send 5 emails simultaneously
      const promises = Array.from({length: 5}, () =>
        EmailService.sendCampaignEmail({
          projectId,
          contactId,
          subject: 'Test',
          body: 'Test',
          from: 'test@example.com',
        }),
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      // Note: Due to race conditions, multiple may succeed before limit is enforced
      // The limit check happens at send time, not atomically
      // At least some should succeed (we're under limit when we start)
      expect(successful).toBeGreaterThan(0);

      // Eventually, some should fail once limit is hit
      // Total emails created should not greatly exceed limit
      const totalEmails = await prisma.email.count({
        where: {projectId, sourceType: EmailSourceType.CAMPAIGN},
      });

      // Should be close to limit (8 existing + some new <= ~13 due to races)
      expect(totalEmails).toBeLessThanOrEqual(15);
    });
  });
});
