/**
 * Background Job: Email Processor
 * Processes individual emails from the queue (for all sources: transactional, campaign, workflow)
 */

import type {Prisma} from '@plunk/db';
import {EmailSourceType, EmailStatus} from '@plunk/db';
import {type Job, Worker} from 'bullmq';

import {prisma} from '../database/prisma.js';
import {EmailService} from '../services/EmailService.js';
import {MeterService} from '../services/MeterService.js';
import {emailQueue, type SendEmailJobData} from '../services/QueueService.js';
import {sendRawEmail} from '../services/SESService.js';

export function createEmailWorker() {
  const worker = new Worker<SendEmailJobData>(
    emailQueue.name,
    async (job: Job<SendEmailJobData>) => {
      const {emailId} = job.data;

      const email = await prisma.email.findUnique({
        where: {id: emailId},
        include: {
          contact: true,
          project: true,
        },
      });

      if (!email) {
        throw new Error(`Email ${emailId} not found`);
      }

      if (email.status !== EmailStatus.PENDING) {
        return;
      }

      // Check if project is disabled
      if (email.project.disabled) {
        console.warn(`[EMAIL-PROCESSOR] Project ${email.projectId} is disabled, cancelling email ${emailId}`);
        await prisma.email.update({
          where: {id: emailId},
          data: {
            status: EmailStatus.FAILED,
            error: 'Project is disabled',
          },
        });
        return;
      }

      try {
        // Update status to sending
        await prisma.email.update({
          where: {id: emailId},
          data: {status: EmailStatus.SENDING},
        });

        // Format template variables in subject and body
        const contactData = (email.contact.data as Record<string, unknown>) || {};
        const formattedEmail = EmailService.format({
          subject: email.subject,
          body: email.body,
          data: {
            email: email.contact.email,
            ...contactData,
          },
        });

        // Compile HTML with unsubscribe footer and badge
        const compiledHtml = EmailService.compile({
          content: formattedEmail.body,
          contact: email.contact,
          project: email.project,
          includeUnsubscribe: email.sourceType !== EmailSourceType.TRANSACTIONAL, // Don't add unsubscribe to transactional emails
        });

        // Parse from email (format: "Name <email@domain.com>" or just "email@domain.com")
        const fromMatch = /(.*?)<(.+?)>/.exec(email.from) || [null, email.from, email.from];
        const fromName = fromMatch[1]?.trim() || email.project.name;
        const fromEmail = fromMatch[2]?.trim() || email.from;

        // Send via AWS SES
        const result = await sendRawEmail({
          from: {
            name: fromName,
            email: fromEmail,
          },
          to: [email.contact.email],
          content: {
            subject: formattedEmail.subject,
            html: compiledHtml,
          },
          reply: email.replyTo || undefined,
          tracking: email.project.trackingEnabled, // Use project's tracking preference
        });

        // Mark as sent with SES message ID
        await prisma.email.update({
          where: {id: emailId},
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
            messageId: result.messageId,
          },
        });

        // Record usage for billing (pay-per-email)
        // Uses email ID as idempotency key to prevent double-charging on retries
        // Charge 2 emails if attachments are present
        if (email.project.customer) {
          const hasAttachments = email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0;
          const emailCount = hasAttachments ? 2 : 1;
          await MeterService.recordEmailSent(email.project.customer, emailCount, `email_${emailId}`);
        }

        // Track event
        await prisma.event.create({
          data: {
            projectId: email.projectId,
            contactId: email.contactId,
            emailId: email.id,
            name: 'email.sent',
            data: {
              subject: formattedEmail.subject,
              from: email.from,
              messageId: result.messageId,
            } as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        console.error(`[EMAIL-PROCESSOR] Failed to send email ${emailId}:`, error);

        // Mark as failed
        await prisma.email.update({
          where: {id: emailId},
          data: {
            status: EmailStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: emailQueue.opts.connection,
      concurrency: 10, // Process up to 10 emails concurrently
      limiter: {
        max: 14, // Max 14 emails per second (AWS SES limit is typically 14/sec)
        duration: 1000,
      },
    },
  );

  worker.on('completed', job => {
    console.log(`[EMAIL-PROCESSOR] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EMAIL-PROCESSOR] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', err => {
    console.error('[EMAIL-PROCESSOR] Worker error:', err);
  });

  return worker;
}
