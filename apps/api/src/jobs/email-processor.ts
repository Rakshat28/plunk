/**
 * Background Job: Email Processor
 * Processes individual emails from the queue (for all sources: transactional, campaign, workflow)
 */

import {EmailSourceType, EmailStatus} from '@plunk/db';
import {type Job, Worker} from 'bullmq';

import {prisma} from '../database/prisma.js';
import {EmailService} from '../services/EmailService.js';
import {EventService} from '../services/EventService.js';
import {MeterService} from '../services/MeterService.js';
import {emailQueue, type SendEmailJobData} from '../services/QueueService.js';
import {sendRawEmail} from '../services/SESService.js';
import {DASHBOARD_URI} from '../app/constants.js';

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
            data: contactData,
            unsubscribeUrl: `${DASHBOARD_URI}/unsubscribe/${email.contact.id}`,
            subscribeUrl: `${DASHBOARD_URI}/subscribe/${email.contact.id}`,
            manageUrl: `${DASHBOARD_URI}/manage/${email.contact.id}`,
          },
        });

        // Compile HTML with unsubscribe footer and badge
        const compiledHtml = EmailService.compile({
          content: formattedEmail.body,
          contact: email.contact,
          project: email.project,
          includeUnsubscribe: email.sourceType !== EmailSourceType.TRANSACTIONAL, // Don't add unsubscribe to transactional emails
        });

        // Use fromName from database if available, otherwise fall back to project name
        // The 'from' field in the database is just the email address
        const fromName = email.fromName || email.project.name;
        const fromEmail = email.from;

        // Build recipient with name if available
        const recipient: {name?: string; email: string} | string = email.toName
          ? {name: email.toName, email: email.contact.email}
          : email.contact.email;

        // Send via AWS SES
        const result = await sendRawEmail({
          from: {
            name: fromName,
            email: fromEmail,
          },
          to: typeof recipient === 'string' ? [recipient] : [{name: recipient.name, email: recipient.email}],
          content: {
            subject: formattedEmail.subject,
            html: compiledHtml,
          },
          reply: email.replyTo || undefined,
          tracking: email.project.trackingEnabled, // Use project's tracking preference
          attachments: email.attachments as {filename: string; content: string; contentType: string}[] | null,
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

        // Track event (this will trigger workflows)
        await EventService.trackEvent(email.projectId, 'email.sent', email.contactId, email.id, {
          subject: formattedEmail.subject,
          from: email.from,
          fromName: email.fromName,
          messageId: result.messageId,
          templateId: email.templateId,
          campaignId: email.campaignId,
          sourceType: email.sourceType,
          sentAt: new Date().toISOString(),
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
        max: 25, // Max 25 emails per second
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
