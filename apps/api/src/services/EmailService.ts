import type {Contact, Email, Prisma, Project} from '@plunk/db';
import {EmailSourceType, EmailStatus, TrackingMode} from '@plunk/db';
import signale from 'signale';

import {DASHBOARD_URI, LANDING_URI, STRIPE_ENABLED} from '../app/constants.js';
import {prisma} from '../database/prisma.js';
import {HttpException} from '../exceptions/index.js';
import {renderTemplate, createTranslatorSync} from '@plunk/shared';

import {BillingLimitService} from './BillingLimitService.js';
import {DomainService} from './DomainService.js';
import {EventService} from './EventService.js';
import {QueueService} from './QueueService.js';
import {sendRawEmail} from './SESService.js';

interface Attachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
}

interface SendEmailParams {
  projectId: string;
  contactId: string;
  subject: string;
  body: string;
  from: string;
  fromName?: string;
  toName?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: Attachment[];
  templateId?: string;
  campaignId?: string;
  workflowExecutionId?: string;
  workflowStepExecutionId?: string;
}

/**
 * Email Service
 * Handles sending emails and tracking delivery
 */
export class EmailService {
  /**
   * Send a transactional email via API
   */
  public static async sendTransactionalEmail(params: SendEmailParams): Promise<Email> {
    // Check if a template is used and if it's a marketing template
    // Marketing templates should not be sent to unsubscribed contacts even via the transactional API
    if (params.templateId) {
      const template = await prisma.template.findUnique({
        where: {id: params.templateId},
        select: {type: true},
      });

      // If using a marketing template, check subscription status
      if (template?.type === 'MARKETING') {
        const contact = await prisma.contact.findUnique({
          where: {id: params.contactId},
          select: {subscribed: true, email: true},
        });

        if (!contact?.subscribed) {
          throw new HttpException(
            400,
            `Cannot send marketing template to unsubscribed contact ${contact?.email || params.contactId}. Use a transactional template or send without a template.`,
          );
        }
      }
    }

    // Check billing limit before sending
    const limitCheck = await BillingLimitService.checkLimit(params.projectId, EmailSourceType.TRANSACTIONAL);

    if (!limitCheck.allowed) {
      throw new HttpException(429, limitCheck.message || 'Billing limit exceeded for transactional emails');
    }

    // Log warning if approaching limit (80%)
    if (limitCheck.warning) {
      signale.warn(`[BILLING_LIMIT] ${limitCheck.message}`);
    }

    const email = await prisma.email.create({
      data: {
        projectId: params.projectId,
        contactId: params.contactId,
        subject: params.subject,
        body: params.body,
        from: params.from,
        fromName: params.fromName,
        toName: params.toName,
        replyTo: params.replyTo,
        headers: params.headers ? (params.headers as Prisma.InputJsonValue) : undefined,
        attachments: params.attachments ? (params.attachments as unknown as Prisma.InputJsonValue) : undefined,
        sourceType: EmailSourceType.TRANSACTIONAL,
        templateId: params.templateId,
        status: EmailStatus.PENDING,
      },
    });

    // Increment usage counter in cache
    await BillingLimitService.incrementUsage(params.projectId, EmailSourceType.TRANSACTIONAL);

    // Queue email for sending
    await this.queueEmail(email.id);

    return email;
  }

  /**
   * Send a campaign email
   */
  public static async sendCampaignEmail(params: SendEmailParams): Promise<Email> {
    // Check if template is transactional to determine source type
    let sourceType: EmailSourceType = EmailSourceType.CAMPAIGN;

    if (params.templateId) {
      const template = await prisma.template.findUnique({
        where: {id: params.templateId},
        select: {type: true},
      });

      // If template is marked as TRANSACTIONAL, use TRANSACTIONAL sourceType
      // This ensures unsubscribe footer is not added to transactional emails
      if (template?.type === 'TRANSACTIONAL') {
        sourceType = EmailSourceType.TRANSACTIONAL;
      }
    }

    // Check billing limit before sending
    const limitCheck = await BillingLimitService.checkLimit(params.projectId, sourceType);

    if (!limitCheck.allowed) {
      throw new HttpException(
        429,
        limitCheck.message || `Billing limit exceeded for ${sourceType.toLowerCase()} emails`,
      );
    }

    // Log warning if approaching limit (80%)
    if (limitCheck.warning) {
      signale.warn(`[BILLING_LIMIT] ${limitCheck.message}`);
    }

    const email = await prisma.email.create({
      data: {
        projectId: params.projectId,
        contactId: params.contactId,
        subject: params.subject,
        body: params.body,
        from: params.from,
        fromName: params.fromName,
        replyTo: params.replyTo,
        headers: params.headers ? (params.headers as Prisma.InputJsonValue) : undefined,
        attachments: params.attachments ? (params.attachments as unknown as Prisma.InputJsonValue) : undefined,
        sourceType,
        templateId: params.templateId,
        campaignId: params.campaignId,
        status: EmailStatus.PENDING,
      },
    });

    // Increment usage counter in cache
    await BillingLimitService.incrementUsage(params.projectId, sourceType);

    // Queue email for sending
    await this.queueEmail(email.id);

    return email;
  }

  /**
   * Send a workflow email
   */
  public static async sendWorkflowEmail(params: SendEmailParams): Promise<Email> {
    // Check if template is transactional to determine source type
    let sourceType: EmailSourceType = EmailSourceType.WORKFLOW;

    if (params.templateId) {
      const template = await prisma.template.findUnique({
        where: {id: params.templateId},
        select: {type: true},
      });

      // If template is marked as TRANSACTIONAL, use TRANSACTIONAL sourceType
      // This ensures unsubscribe footer is not added to transactional emails
      if (template?.type === 'TRANSACTIONAL') {
        sourceType = EmailSourceType.TRANSACTIONAL;
      }
    }

    // Check subscription status for marketing emails
    // Transactional emails should always be sent regardless of subscription status
    if (sourceType !== EmailSourceType.TRANSACTIONAL) {
      const contact = await prisma.contact.findUnique({
        where: {id: params.contactId},
        select: {subscribed: true},
      });

      if (!contact?.subscribed) {
        signale.info(
          `[WORKFLOW] Skipping marketing email to unsubscribed contact ${params.contactId} in workflow execution ${params.workflowExecutionId}`,
        );
        // For workflows, we silently skip sending to unsubscribed contacts for marketing emails
        // Return a placeholder email record that won't be sent
        return await prisma.email.create({
          data: {
            projectId: params.projectId,
            contactId: params.contactId,
            subject: params.subject,
            body: params.body,
            from: params.from,
            fromName: params.fromName,
            replyTo: params.replyTo,
            headers: params.headers ? (params.headers as Prisma.InputJsonValue) : undefined,
            attachments: params.attachments ? (params.attachments as unknown as Prisma.InputJsonValue) : undefined,
            sourceType,
            templateId: params.templateId,
            workflowExecutionId: params.workflowExecutionId,
            workflowStepExecutionId: params.workflowStepExecutionId,
            status: EmailStatus.FAILED,
            error: 'Contact is unsubscribed from marketing emails',
          },
        });
      }
    }

    // Check billing limit before sending
    const limitCheck = await BillingLimitService.checkLimit(params.projectId, sourceType);

    if (!limitCheck.allowed) {
      throw new HttpException(
        429,
        limitCheck.message || `Billing limit exceeded for ${sourceType.toLowerCase()} emails`,
      );
    }

    // Log warning if approaching limit (80%)
    if (limitCheck.warning) {
      signale.warn(`[BILLING_LIMIT] ${limitCheck.message}`);
    }

    const email = await prisma.email.create({
      data: {
        projectId: params.projectId,
        contactId: params.contactId,
        subject: params.subject,
        body: params.body,
        from: params.from,
        fromName: params.fromName,
        replyTo: params.replyTo,
        headers: params.headers ? (params.headers as Prisma.InputJsonValue) : undefined,
        attachments: params.attachments ? (params.attachments as unknown as Prisma.InputJsonValue) : undefined,
        sourceType,
        templateId: params.templateId,
        workflowExecutionId: params.workflowExecutionId,
        workflowStepExecutionId: params.workflowStepExecutionId,
        status: EmailStatus.PENDING,
      },
    });

    // Increment usage counter in cache
    await BillingLimitService.incrementUsage(params.projectId, sourceType);

    // Queue email for sending
    await this.queueEmail(email.id);

    return email;
  }

  /**
   * Actually send the email via AWS SES
   * This is called by the email processor worker
   */
  public static async sendEmail(emailId: string): Promise<void> {
    const email = await prisma.email.findUnique({
      where: {id: emailId},
      include: {
        contact: true,
        project: true,
        template: {
          select: {type: true},
        },
      },
    });

    if (!email) {
      throw new HttpException(404, 'Email not found');
    }

    if (email.status !== EmailStatus.PENDING) {
      return; // Already processed
    }

    // Final validation: Check subscription status before sending
    // Only transactional emails should be sent to unsubscribed contacts
    if (!email.contact.subscribed) {
      const isTransactional =
        email.sourceType === EmailSourceType.TRANSACTIONAL || email.template?.type === 'TRANSACTIONAL';

      if (!isTransactional) {
        signale.warn(`[EMAIL] Skipping marketing email ${emailId} to unsubscribed contact ${email.contact.email}`);
        await prisma.email.update({
          where: {id: emailId},
          data: {
            status: EmailStatus.FAILED,
            error: 'Contact is unsubscribed from marketing emails',
          },
        });
        return;
      }
    }

    try {
      // Verify domain is registered and verified before sending
      // This ensures all emails (transactional, campaign, workflow) use verified domains
      await DomainService.verifyEmailDomain(email.from, email.projectId);

      // Update status to sending
      await prisma.email.update({
        where: {id: emailId},
        data: {status: EmailStatus.SENDING},
      });

      // Format template variables in subject and body
      const contactData =
        email.contact.data && typeof email.contact.data === 'object' && !Array.isArray(email.contact.data)
          ? email.contact.data
          : {};
      const formattedEmail = this.format({
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
      const compiledHtml = this.compile({
        content: formattedEmail.body,
        contact: email.contact,
        project: email.project,
        includeUnsubscribe: email.sourceType !== EmailSourceType.TRANSACTIONAL, // Don't add unsubscribe to transactional emails
      });

      // Use explicit fromName if provided, otherwise fall back to project name
      const fromName = email.fromName || email.project.name;
      const fromEmail = email.from;

      // Parse custom headers from JSON
      const customHeaders =
        email.headers && typeof email.headers === 'object' && !Array.isArray(email.headers)
          ? (email.headers as Record<string, string>)
          : undefined;

      // Parse attachments from JSON
      const attachments =
        email.attachments && Array.isArray(email.attachments)
          ? (email.attachments as Array<{filename: string; content: string; contentType: string}>)
          : undefined;

      // Determine tracking based on project settings and email type
      const shouldTrack = this.shouldTrackEmail(email.project.tracking, email.sourceType);

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
        headers: customHeaders,
        attachments: attachments,
        tracking: shouldTrack,
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
      signale.error(`[EMAIL] Failed to send email ${emailId}:`, error);

      // Mark as failed
      await prisma.email.update({
        where: {id: emailId},
        data: {
          status: EmailStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Process email webhook events (opens, clicks, bounces, etc.)
   * This would be called by webhook endpoints from your email provider
   */
  public static async handleWebhookEvent(
    emailId: string,
    eventType: 'opened' | 'clicked' | 'bounced' | 'complained' | 'delivered',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const email = await prisma.email.findUnique({
      where: {id: emailId},
    });

    if (!email) {
      throw new HttpException(404, 'Email not found');
    }

    const now = new Date();
    const updateData: Prisma.EmailUpdateInput = {};

    switch (eventType) {
      case 'delivered':
        updateData.status = EmailStatus.DELIVERED;
        updateData.deliveredAt = now;
        break;

      case 'opened':
        if (!email.openedAt) {
          updateData.openedAt = now;
        }
        updateData.opens = (email.opens || 0) + 1;
        updateData.status = EmailStatus.OPENED;
        break;

      case 'clicked':
        if (!email.clickedAt) {
          updateData.clickedAt = now;
        }
        updateData.clicks = (email.clicks || 0) + 1;
        updateData.status = EmailStatus.CLICKED;
        break;

      case 'bounced':
        updateData.status = EmailStatus.BOUNCED;
        updateData.bouncedAt = now;
        // Unsubscribe contact on bounce and track event
        if (email.contactId) {
          await prisma.contact.update({
            where: {id: email.contactId},
            data: {subscribed: false},
          });
          // Track unsubscription event
          await EventService.trackEvent(email.projectId, 'contact.unsubscribed', email.contactId, email.id, {
            reason: 'bounce',
          });
        }
        break;

      case 'complained':
        updateData.status = EmailStatus.COMPLAINED;
        updateData.complainedAt = now;
        // Unsubscribe contact and track event
        if (email.contactId) {
          await prisma.contact.update({
            where: {id: email.contactId},
            data: {subscribed: false},
          });
          // Track unsubscription event
          await EventService.trackEvent(email.projectId, 'contact.unsubscribed', email.contactId, email.id, {
            reason: 'complaint',
          });
        }
        break;
    }

    await prisma.email.update({
      where: {id: emailId},
      data: updateData,
    });

    // Track event
    await prisma.event.create({
      data: {
        projectId: email.projectId,
        contactId: email.contactId,
        emailId: email.id,
        name: `email.${eventType}`,
        data: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  /**
   * Get email statistics for a project
   */
  public static async getStats(projectId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.EmailWhereInput = {
      projectId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? {gte: startDate} : {}),
              ...(endDate ? {lte: endDate} : {}),
            },
          }
        : {}),
    };

    const [total, sent, delivered, opened, clicked, bounced, failed] = await Promise.all([
      prisma.email.count({where}),
      prisma.email.count({where: {...where, status: EmailStatus.SENT}}),
      prisma.email.count({where: {...where, status: EmailStatus.DELIVERED}}),
      prisma.email.count({where: {...where, status: EmailStatus.OPENED}}),
      prisma.email.count({where: {...where, status: EmailStatus.CLICKED}}),
      prisma.email.count({where: {...where, status: EmailStatus.BOUNCED}}),
      prisma.email.count({where: {...where, status: EmailStatus.FAILED}}),
    ]);

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
    };
  }

  /**
   * Format email template by replacing variables in subject and body
   * Uses shared template rendering from @plunk/shared
   */
  public static format({subject, body, data}: {subject: string; body: string; data: Record<string, unknown>}): {
    subject: string;
    body: string;
  } {
    return {
      subject: renderTemplate(subject, data),
      body: renderTemplate(body, data),
    };
  }

  /**
   * Determine if an email should be tracked based on project tracking mode and email source type
   */
  public static shouldTrackEmail(trackingMode: TrackingMode, sourceType: EmailSourceType): boolean {
    switch (trackingMode) {
      case TrackingMode.ENABLED:
        return true;
      case TrackingMode.DISABLED:
        return false;
      case TrackingMode.MARKETING_ONLY:
        // Track only campaigns and workflows (marketing), not transactional emails
        return sourceType !== EmailSourceType.TRANSACTIONAL;
      default:
        return true;
    }
  }

  /**
   * Compile HTML email with optional unsubscribe footer and badge
   * Adds unsubscribe link and Plunk badge for free tier users (only when billing is enabled)
   */
  public static compile({
    content,
    contact,
    project,
    includeUnsubscribe = true,
  }: {
    content: string;
    contact: Contact;
    project: Project;
    includeUnsubscribe?: boolean;
  }): string {
    let html = content;

    const unsubscribeHtml = includeUnsubscribe
      ? (() => {
          // Get translator for project's language
          const translator = createTranslatorSync(project.language || 'en');
          const unsubscribeText = translator.t('email.footer.unsubscribeText', {
            projectName: project.name,
          });
          const updatePreferencesText = translator.t('email.footer.updatePreferences');

          return `<table align="center" width="100%" style="max-width: 480px; width: 100%; margin-left: auto; margin-right: auto; font-family: Inter, ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; border: 0; cellpadding: 0; cellspacing: 0;" role="presentation">
          <tbody>
            <tr>
              <td>
                <hr style="border: none; border-top: 1px solid #eaeaea; width: 100%; margin-top: 12px; margin-bottom: 12px;">
                <p style="font-size: 12px; line-height: 24px; margin: 16px 0; text-align: center; color: rgb(64, 64, 64);">
                  ${unsubscribeText}
                  <a href="${DASHBOARD_URI}/unsubscribe/${contact.id}">${updatePreferencesText}</a>.
                </p>
              </td>
            </tr>
          </tbody>
        </table>`;
        })()
      : '';

    // Add Plunk badge if billing is enabled and project has no subscription (free tier)
    const badgeHtml =
      STRIPE_ENABLED && project.subscription === null
        ? `<table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                    <tbody>
                      <tr>
                        <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                            <tbody>
                              <tr>
                                <td style="width:180px;">
                                  <a href="${LANDING_URI}?ref=badge" target="_blank">
                                    <img height="auto" src="https://cdn.useplunk.com/badge.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="180" />
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>`
        : '';

    // Combine footer and badge
    const footerHtml = `${unsubscribeHtml}${badgeHtml}`;

    // Insert before closing body tag if it exists, otherwise append
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${footerHtml}</body>`);
    } else {
      html = `${html}${footerHtml}`;
    }

    return html;
  }

  /**
   * Queue an email for sending
   * Adds email to the BullMQ queue for processing by workers
   */
  private static async queueEmail(emailId: string, delay?: number): Promise<void> {
    await QueueService.queueEmail(emailId, delay);
  }
}
