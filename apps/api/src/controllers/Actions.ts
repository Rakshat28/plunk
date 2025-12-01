import {Controller, Middleware, Post} from '@overnightjs/core';
import {ActionSchemas} from '@plunk/shared';
import type {Request, Response} from 'express';

import type {AuthResponse} from '../middleware/auth.js';
import {requirePublicKey, requireSecretKey} from '../middleware/auth.js';
import {prisma} from '../database/prisma.js';
import {ContactService} from '../services/ContactService.js';
import {DomainService} from '../services/DomainService.js';
import {EmailService} from '../services/EmailService.js';
import {EventService} from '../services/EventService.js';
import {NotFound} from '../exceptions/index.js';

/**
 * Public API Actions Controller
 * Handles track event and transactional email endpoints
 */
@Controller('v1')
export class Actions {
  /**
   * POST /v1/track
   * Track an event for a contact (creates/updates contact and tracks event)
   *
   * Request body:
   * - event: string (required) - Event name
   * - email: string (required) - Contact email
   * - subscribed: boolean (optional, default: true) - Contact subscription status
   * - data: object (optional) - Event and contact data
   *   - Simple values are saved to contact (persistent)
   *   - {value: any, persistent: false} are only available to workflows (non-persistent)
   *
   * Response:
   * - success: boolean
   * - data: object with contact ID, event ID, and timestamp
   *
   * Example:
   * {
   *   event: "purchase",
   *   email: "user@example.com",
   *   data: {
   *     totalSpent: 1500,                          // Persistent - saved to contact
   *     plan: "pro",                                // Persistent - saved to contact
   *     orderId: {value: "12345", persistent: false},  // Non-persistent - workflows only
   *     receiptUrl: {value: "https://...", persistent: false}  // Non-persistent - workflows only
   *   }
   * }
   */
  @Post('track')
  @Middleware([requirePublicKey])
  public async track(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;

    // Zod validation - errors automatically handled by global error handler
    const {event, email, subscribed, data} = ActionSchemas.track.parse(req.body);

    // Create or update contact with persistent data only
    // ContactService.upsert will filter out non-persistent fields
    const contact = await ContactService.upsert(
      auth.projectId,
      email,
      data as Record<string, unknown> | undefined,
      subscribed,
    );

    // Track the event with ALL data (persistent + non-persistent)
    // Non-persistent data flows to workflows via execution context
    const eventRecord = await EventService.trackEvent(
      auth.projectId,
      event,
      contact.id,
      undefined,
      data as Record<string, unknown> | undefined,
    );

    return res.status(200).json({
      success: true,
      data: {
        contact: contact.id,
        event: eventRecord.id,
        timestamp: eventRecord.createdAt.toISOString(),
      },
    });
  }

  /**
   * POST /v1/send
   * Send transactional email(s)
   *
   * Request body:
   * - to: string | string[] (required) - Recipient email(s)
   * - subject: string (required) - Email subject
   * - body: string (required) - Email HTML body
   * - subscribed: boolean (optional, default: false) - Contact subscription status
   * - name: string (optional) - Sender name
   * - from: string (optional) - Sender email (must be from verified domain)
   * - reply: string (optional) - Reply-to email
   * - headers: object (optional) - Additional email headers
   * - data: object (optional) - Contact data and template variables
   *   - Simple values are saved to contact (persistent)
   *   - {value: any, persistent: false} are only used for this email (non-persistent)
   *
   * Response:
   * - success: boolean
   * - data: object with emails array and timestamp
   *
   * Example:
   * {
   *   to: "user@example.com",
   *   subject: "Password Reset",
   *   body: "<p>Reset code: {{resetCode}}</p><p>Hello {{firstName}}!</p>",
   *   data: {
   *     firstName: "John",                              // Persistent - saved to contact
   *     resetCode: {value: "ABC123", persistent: false} // Non-persistent - this email only
   *   }
   * }
   */
  @Post('send')
  @Middleware([requireSecretKey])
  public async send(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;

    // Zod validation - errors automatically handled by global error handler
    const {to, subject, body, subscribed, name, from, reply, headers, data, template, attachments} =
      ActionSchemas.send.parse(req.body);

    // Normalize recipients to array
    const recipients = Array.isArray(to) ? to : [to];
    // Fetch template if provided
    let emailSubject = subject;
    let emailBody = body;
    let emailFrom = from;
    let emailFromName = name;
    let emailReplyTo = reply;
    let templateId: string | undefined;

    if (template) {
      const templateRecord = await prisma.template.findUnique({
        where: {
          id: template,
          projectId: auth.projectId, // Ensure template belongs to this project
        },
      });

      if (!templateRecord) {
        throw new NotFound('Template', template);
      }

      // Use template values, allow overrides from request
      emailSubject = subject || templateRecord.subject;
      emailBody = body || templateRecord.body;
      emailFrom = from || templateRecord.from;
      emailFromName = name || templateRecord.fromName || undefined;
      emailReplyTo = reply || templateRecord.replyTo || undefined;
      templateId = templateRecord.id;
    }

    // Verify 'from' domain is verified if provided
    const senderEmail = emailFrom || 'noreply@useplunk.com'; // Default sender

    // Only verify custom domains (not the default noreply@useplunk.com)
    if (emailFrom && emailFrom !== 'noreply@useplunk.com') {
      await DomainService.verifyEmailDomain(emailFrom, auth.projectId);
    }

    const replyToEmail = emailReplyTo;

    const timestamp = new Date();
    const emailResults = [];

    // Process each recipient
    for (const recipientEmail of recipients) {
      // Create or update contact with metadata
      const contact = await ContactService.upsert(
        auth.projectId,
        recipientEmail,
        data as Record<string, unknown> | undefined,
        subscribed,
      );

      // Get merged data including non-persistent fields for template rendering
      const mergedData = ContactService.getMergedData(contact, data as Record<string, unknown> | undefined);

      // Render template with contact data
      // Simple template variable replacement: {{fieldname}}
      let renderedSubject = emailSubject!;
      let renderedBody = emailBody!;

      for (const [key, value] of Object.entries(mergedData)) {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        const fallbackPlaceholder = new RegExp(`\\{\\{\\s*${key}\\s*\\?\\?\\s*([^}]+)\\}\\}`, 'g');

        // Replace with value
        const stringValue = value !== null && value !== undefined ? String(value) : '';
        renderedSubject = renderedSubject!.replace(placeholder, stringValue);
        renderedBody = renderedBody!.replace(placeholder, stringValue);

        // Handle fallback syntax: {{field ?? default}}
        renderedSubject = renderedSubject!.replace(fallbackPlaceholder, stringValue || '$1');
        renderedBody = renderedBody!.replace(fallbackPlaceholder, stringValue || '$1');
      }

      // Replace any remaining placeholders with empty string or fallback value
      renderedSubject = renderedSubject!.replace(/\{\{\s*(\w+)\s*\}\}/g, '');
      renderedBody = renderedBody!.replace(/\{\{\s*(\w+)\s*\}\}/g, '');

      // Handle fallback placeholders that weren't matched
      renderedSubject = renderedSubject!.replace(/\{\{\s*\w+\s*\?\?\s*([^}]+)\}\}/g, '$1');
      renderedBody = renderedBody!.replace(/\{\{\s*\w+\s*\?\?\s*([^}]+)\}\}/g, '$1');

      const email = await EmailService.sendTransactionalEmail({
        projectId: auth.projectId,
        contactId: contact.id,
        subject: renderedSubject,
        body: renderedBody,
        from: senderEmail,
        fromName: emailFromName,
        replyTo: replyToEmail,
        headers: headers || undefined,
        attachments: attachments || undefined,
        templateId: templateId,
      });

      emailResults.push({
        contact: {
          id: contact.id,
          email: contact.email,
        },
        email: email.id,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        emails: emailResults,
        timestamp: timestamp.toISOString(),
      },
    });
  }
}
