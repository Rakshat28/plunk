/**
 * Segment Count Update Worker
 * Processes segment count update jobs from the BullMQ queue
 */

import {type Job, Worker} from 'bullmq';
import signale from 'signale';

import {prisma} from '../database/prisma.js';
import {NtfyService} from '../services/NtfyService.js';
import {type SegmentCountJobData, segmentCountQueue} from '../services/QueueService.js';
import {SegmentService} from '../services/SegmentService.js';

/**
 * Process segments for a single project
 * - For segments with trackMembership: compute full membership and trigger events
 * - For segments without trackMembership: only update counts
 */
async function processProjectSegments(projectId: string, projectName?: string): Promise<void> {
  const logPrefix = projectName ? `${projectName} (${projectId})` : projectId;

  // Get all segments for this project, separating tracked vs non-tracked
  const segments = await prisma.segment.findMany({
    where: {projectId},
    select: {id: true, name: true, trackMembership: true},
  });

  const trackedSegments = segments.filter(s => s.trackMembership);
  const nonTrackedSegments = segments.filter(s => !s.trackMembership);

  signale.info(
    `[SEGMENT-COUNT-WORKER] Project ${logPrefix}: ${trackedSegments.length} tracked, ${nonTrackedSegments.length} non-tracked segments`,
  );

  // Process tracked segments with full membership computation (creates events)
  if (trackedSegments.length > 0) {
    for (const segment of trackedSegments) {
      try {
        signale.info(
          `[SEGMENT-COUNT-WORKER] Computing membership for tracked segment "${segment.name}" (${segment.id})`,
        );
        const result = await SegmentService.computeMembership(projectId, segment.id);
        signale.success(
          `[SEGMENT-COUNT-WORKER] Segment "${segment.name}": +${result.added} entries, -${result.removed} exits, ${result.total} total members`,
        );

        // Notify about segment membership update (only for tracked segments)
        if (projectName) {
          await NtfyService.notifySegmentMembershipComputed(segment.name, projectName, projectId, result.total);
        }
      } catch (error) {
        signale.error(`[SEGMENT-COUNT-WORKER] Failed to compute membership for segment ${segment.id}:`, error);
        // Continue with other segments
      }
    }
  }

  // Process non-tracked segments with count-only update (lightweight)
  if (nonTrackedSegments.length > 0) {
    try {
      await SegmentService.refreshAllMemberCounts(projectId);
      signale.info(`[SEGMENT-COUNT-WORKER] Updated counts for ${nonTrackedSegments.length} non-tracked segments`);
    } catch (error) {
      signale.error(`[SEGMENT-COUNT-WORKER] Failed to update counts for non-tracked segments:`, error);
    }
  }
}

/**
 * Process segment count update job
 */
async function processSegmentCountUpdate(job: Job<SegmentCountJobData>): Promise<void> {
  const {projectId} = job.data;

  signale.info(`[SEGMENT-COUNT-WORKER] Starting segment count update job ${job.id}`);

  try {
    if (projectId) {
      // Process specific project
      signale.info(`[SEGMENT-COUNT-WORKER] Processing segments for project ${projectId}`);
      await processProjectSegments(projectId);
      signale.success(`[SEGMENT-COUNT-WORKER] Completed segments for project ${projectId}`);
    } else {
      // Process all active projects
      const projects = await prisma.project.findMany({
        where: {disabled: false},
        select: {id: true, name: true},
      });

      signale.info(`[SEGMENT-COUNT-WORKER] Found ${projects.length} active projects`);

      // Process projects in batches to avoid overwhelming the database
      const PROJECT_BATCH_SIZE = 10;
      for (let i = 0; i < projects.length; i += PROJECT_BATCH_SIZE) {
        const batch = projects.slice(i, i + PROJECT_BATCH_SIZE);

        await Promise.all(
          batch.map(async project => {
            try {
              signale.info(`[SEGMENT-COUNT-WORKER] Processing project ${project.name} (${project.id})`);
              await processProjectSegments(project.id, project.name);
              signale.success(`[SEGMENT-COUNT-WORKER] Completed project ${project.name}`);
            } catch (error) {
              signale.error(`[SEGMENT-COUNT-WORKER] Failed to process project ${project.id}:`, error);
              // Don't throw - continue with other projects
            }
          }),
        );

        // Small delay between project batches to avoid overwhelming the database
        if (i + PROJECT_BATCH_SIZE < projects.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      signale.success(`[SEGMENT-COUNT-WORKER] Completed all segment updates`);
    }
  } catch (error) {
    signale.error(`[SEGMENT-COUNT-WORKER] Error processing job ${job.id}:`, error);
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Create and export the segment count worker
 */
export function createSegmentCountWorker(): Worker {
  const worker = new Worker<SegmentCountJobData>(
    segmentCountQueue.name,
    async (job: Job<SegmentCountJobData>) => {
      await processSegmentCountUpdate(job);
    },
    {
      connection: segmentCountQueue.opts.connection,
      concurrency: 1, // Process one segment count job at a time to avoid database overload
      limiter: {
        max: 1, // Max 1 job per duration
        duration: 60000, // Per minute (prevents rapid-fire updates)
      },
    },
  );

  worker.on('completed', job => {
    signale.success(`[SEGMENT-COUNT-WORKER] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    signale.error(`[SEGMENT-COUNT-WORKER] Job ${job?.id} failed:`, error);
  });

  worker.on('error', error => {
    signale.error('[SEGMENT-COUNT-WORKER] Worker error:', error);
  });

  return worker;
}
