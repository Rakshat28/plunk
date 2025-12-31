/**
 * Background Job: Domain Verification Checker
 * Checks domain verification status with AWS SES
 *
 * This is processed by BullMQ workers (see domain-verification-processor.ts)
 * Scheduled to run every 5 minutes via repeatable jobs
 */

import React from 'react';
import signale from 'signale';
import {DomainVerifiedEmail, DomainUnverifiedEmail, sendPlatformEmail} from '@plunk/email';

import {DASHBOARD_URI, LANDING_URI} from '../constants.js';
import {prisma} from '../database/prisma.js';
import {redis} from '../database/redis.js';
import {disableFeedbackForwarding, getIdentities, verifyDomain} from '../services/SESService.js';
import {Keys} from '../services/keys.js';

/**
 * Check verification status for all domains in the database
 */
export async function checkDomainVerifications() {
  signale.info('[DOMAIN-VERIFICATION] Starting domain verification check...');

  try {
    const count = await prisma.domain.count();
    signale.info(`[DOMAIN-VERIFICATION] Found ${count} domains to check`);

    // Process domains in batches of 99 (AWS SES limit is 100)
    for (let i = 0; i < count; i += 99) {
      const domains = await prisma.domain.findMany({
        select: {
          id: true,
          domain: true,
          projectId: true,
          verified: true,
          project: {
            select: {name: true},
          },
        },
        skip: i,
        take: 99,
      });

      if (domains.length === 0) {
        continue;
      }

      // Get verification status from AWS SES
      const sesIdentities = await getIdentities(domains.map(d => d.domain));

      // Update each domain based on SES status
      for (const sesIdentity of sesIdentities) {
        const dbDomain = domains.find(d => d.domain === sesIdentity.domain);

        if (!dbDomain) {
          continue;
        }

        const isVerified = sesIdentity.status === 'Success';

        // If domain failed verification, retry
        if (sesIdentity.status === 'Failed') {
          signale.warn(`[DOMAIN-VERIFICATION] Restarting verification for ${sesIdentity.domain}`);

          let attempt = 0;
          const maxAttempts = 5;
          let success = false;
          let delay = 5000;

          while (attempt < maxAttempts && !success) {
            try {
              await verifyDomain(sesIdentity.domain);
              success = true;
              signale.success(`[DOMAIN-VERIFICATION] Restarted verification for ${sesIdentity.domain}`);
            } catch (e: unknown) {
              const error = e as {Code?: string; name?: string; message?: string};
              if (error?.Code === 'Throttling' || error?.name === 'Throttling' || error?.message?.includes('Throttling')) {
                signale.warn(
                  `[DOMAIN-VERIFICATION] Throttling detected, waiting ${delay / 1000} seconds (attempt ${attempt + 1})`,
                );
                await new Promise(r => setTimeout(r, delay));
                delay *= 2; // Exponential backoff
                attempt++;
              } else {
                signale.error(`[DOMAIN-VERIFICATION] Error restarting verification: ${error?.message || 'Unknown error'}`);
                throw e;
              }
            }
          }

          if (!success) {
            signale.error(
              `[DOMAIN-VERIFICATION] Failed to verify ${sesIdentity.domain} after ${maxAttempts} attempts due to throttling`,
            );
          }
        }

        // Update verification status in database
        await prisma.domain.update({
          where: {id: dbDomain.id},
          data: {verified: isVerified},
        });

        // If domain was just verified, disable feedback forwarding
        if (!dbDomain.verified && isVerified) {
          signale.success(`[DOMAIN-VERIFICATION] Domain ${sesIdentity.domain} is now verified!`);

          try {
            await disableFeedbackForwarding(sesIdentity.domain);
            signale.info(`[DOMAIN-VERIFICATION] Disabled feedback forwarding for ${sesIdentity.domain}`);
          } catch (error) {
            signale.error(`[DOMAIN-VERIFICATION] Error disabling feedback forwarding: ${error}`);
          }

          // Send email notification about domain verified
          try {
            const cacheKey = Keys.Domain.verifiedEmail(dbDomain.id);
            const alreadySent = await redis.get(cacheKey);
            if (alreadySent !== '1') {
              const members = await prisma.membership.findMany({
                where: {projectId: dbDomain.projectId},
                include: {user: {select: {email: true}}},
              });
              const emails = members.map((m) => m.user.email);
              if (emails.length > 0) {
                const template = React.createElement(DomainVerifiedEmail, {
                  projectName: dbDomain.project.name,
                  projectId: dbDomain.projectId,
                  domain: sesIdentity.domain,
                  dashboardUrl: DASHBOARD_URI,
                  landingUrl: LANDING_URI,
                });
                await Promise.all(
                  emails.map((email) => sendPlatformEmail(email, 'Domain Verified Successfully', template)),
                );
                await redis.setex(cacheKey, 604800, '1'); // 7 days
              }
            }
          } catch (error) {
            signale.error(`[DOMAIN-VERIFICATION] Error sending verified email: ${error}`);
          }

          // Invalidate cache
          await redis.del(Keys.Domain.id(dbDomain.id));
          await redis.del(Keys.Domain.project(dbDomain.projectId));
        }

        // If domain was unverified, invalidate cache
        if (dbDomain.verified && !isVerified) {
          signale.warn(`[DOMAIN-VERIFICATION] Domain ${sesIdentity.domain} is no longer verified`);

          // Send email notification about domain verification failed
          try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const cacheKey = Keys.Domain.unverifiedEmail(dbDomain.id, year, month);
            const alreadySent = await redis.get(cacheKey);
            if (alreadySent !== '1') {
              const members = await prisma.membership.findMany({
                where: {projectId: dbDomain.projectId},
                include: {user: {select: {email: true}}},
              });
              const emails = members.map((m) => m.user.email);
              if (emails.length > 0) {
                const template = React.createElement(DomainUnverifiedEmail, {
                  projectName: dbDomain.project.name,
                  projectId: dbDomain.projectId,
                  domain: sesIdentity.domain,
                  dashboardUrl: DASHBOARD_URI,
                  landingUrl: LANDING_URI,
                });
                await Promise.all(
                  emails.map((email) => sendPlatformEmail(email, 'Domain Verification Failed', template)),
                );
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const ttl = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
                await redis.setex(cacheKey, ttl, '1');
              }
            }
          } catch (error) {
            signale.error(`[DOMAIN-VERIFICATION] Error sending unverified email: ${error}`);
          }

          await redis.del(Keys.Domain.id(dbDomain.id));
          await redis.del(Keys.Domain.project(dbDomain.projectId));
        }
      }
    }

    signale.success('[DOMAIN-VERIFICATION] Domain verification check completed');
  } catch (error) {
    signale.error('[DOMAIN-VERIFICATION] Error checking domain verifications:', error);
    throw error;
  }
}

/**
 * Main processor function
 * Call this from your scheduler/cron
 */
export async function runDomainVerificationJob() {
  await checkDomainVerifications();
}

// If running this file directly (for testing or manual execution)
if (import.meta.url === `file://${process.argv[1]}`) {
  signale.info('[DOMAIN-VERIFICATION] Running domain verification job manually...');
  runDomainVerificationJob()
    .then(() => {
      signale.success('[DOMAIN-VERIFICATION] Completed successfully');
      process.exit(0);
    })
    .catch(error => {
      signale.error('[DOMAIN-VERIFICATION] Fatal error:', error);
      process.exit(1);
    });
}
