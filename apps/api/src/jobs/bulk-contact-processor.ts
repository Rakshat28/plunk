/**
 * Background Job: Bulk Contact Action Processor
 * Processes bulk subscribe, unsubscribe, and delete operations
 */

import type {BulkContactActionJobData} from '@plunk/types';
import {type Job, Worker} from 'bullmq';
import signale from 'signale';

import {ContactService} from '../services/ContactService.js';
import {bulkContactQueue} from '../services/QueueService.js';

const BATCH_SIZE = 100; // Process contacts in batches of 100

interface BulkActionResult {
  operation: 'subscribe' | 'unsubscribe' | 'delete';
  totalRequested: number;
  successCount: number;
  failureCount: number;
  errors: {contactId: string; email: string; error: string}[];
}

export function createBulkContactWorker() {
  const worker = new Worker<BulkContactActionJobData>(
    bulkContactQueue.name,
    async (job: Job<BulkContactActionJobData>) => {
      const {projectId, contactIds, operation} = job.data;

      signale.info(
        `[BULK-CONTACT-PROCESSOR] Processing ${operation} for ${contactIds.length} contacts in project ${projectId}`,
      );

      const result: BulkActionResult = {
        operation,
        totalRequested: contactIds.length,
        successCount: 0,
        failureCount: 0,
        errors: [],
      };

      try {
        // Process contacts in batches
        for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
          const batchIds = contactIds.slice(i, Math.min(i + BATCH_SIZE, contactIds.length));

          try {
            let batchResult: {updated?: number; deleted?: number};

            switch (operation) {
              case 'subscribe':
                batchResult = await ContactService.bulkSubscribe(projectId, batchIds);
                result.successCount += batchResult.updated || 0;
                break;
              case 'unsubscribe':
                batchResult = await ContactService.bulkUnsubscribe(projectId, batchIds);
                result.successCount += batchResult.updated || 0;
                break;
              case 'delete':
                batchResult = await ContactService.bulkDelete(projectId, batchIds);
                result.successCount += batchResult.deleted || 0;
                break;
            }

            // If some contacts in batch weren't processed, track them as failures
            const processedCount = batchResult.updated || batchResult.deleted || 0;
            const failedCount = batchIds.length - processedCount;
            if (failedCount > 0) {
              result.failureCount += failedCount;
              // Note: We don't have individual contact details for batch failures
            }
          } catch (error) {
            signale.error(`[BULK-CONTACT-PROCESSOR] Batch failed:`, error);
            result.failureCount += batchIds.length;
            result.errors.push({
              contactId: 'batch',
              email: '',
              error: error instanceof Error ? error.message : 'Batch processing failed',
            });
          }

          // Update progress
          const progress = Math.round(((i + batchIds.length) / contactIds.length) * 100);
          await job.updateProgress(progress);
        }

        signale.info(
          `[BULK-CONTACT-PROCESSOR] ${operation} completed: ${result.successCount} succeeded, ${result.failureCount} failed`,
        );

        return result;
      } catch (error) {
        signale.error(`[BULK-CONTACT-PROCESSOR] Failed to process ${operation}:`, error);
        throw error;
      }
    },
    {
      connection: bulkContactQueue.opts.connection,
      concurrency: 3, // Process max 3 bulk operations concurrently
    },
  );

  worker.on('completed', job => {
    signale.info(`[BULK-CONTACT-PROCESSOR] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    signale.error(`[BULK-CONTACT-PROCESSOR] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', err => {
    signale.error('[BULK-CONTACT-PROCESSOR] Worker error:', err);
  });

  return worker;
}
