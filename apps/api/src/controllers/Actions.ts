import {Controller, Middleware, Post} from '@overnightjs/core';
import {ActionSchemas} from '@plunk/shared';
import type {NextFunction, Request, Response} from 'express';

import type {AuthResponse} from '../middleware/auth.js';
import {requirePublicKey, requireSecretKey} from '../middleware/auth.js';
import {prisma} from '../database/prisma.js';
import {ContactService} from '../services/ContactService.js';
import {DomainService} from '../services/DomainService.js';
import {EmailService} from '../services/EmailService.js';
import {EventService} from '../services/EventService.js';
import {NotFound} from '../exceptions/index.js';
import {CatchAsync} from '../utils/asyncHandler.js';

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
  @CatchAsync
  public async track(req: Request, res: Response, next: NextFunction) {
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
   * - to: string | object | array (required) - Recipient email(s)
   *   - String: "user@example.com"
   *   - Object: {name: "Jane Doe", email: "user@example.com"}
   *   - Array: ["user1@example.com", {name: "Jane", email: "user2@example.com"}]
   * - subject: string (required) - Email subject
   * - body: string (required) - Email HTML body
   * - subscribed: boolean (optional, default: false) - Contact subscription status
   * - name: string (optional) - Sender name (alternative to from.name)
   * - from: string | object (optional) - Sender email or {name, email} object (must be from verified domain)
   * - reply: string (optional) - Reply-to email
   * - headers: object (optional) - Additional email headers
   * - data: object (optional) - Contact data and template variables
   *   - Simple values are saved to contact (persistent)
   *   - {value: any, persistent: false} are only used for this email (non-persistent)
   * - attachments: array (optional) - Email attachments (max 10, 10MB total)
   *   - filename: string (required) - Attachment filename
   *   - content: string (required) - Base64 encoded file content
   *   - contentType: string (required) - MIME type (e.g., "application/pdf")
   *
   * Response:
   * - success: boolean
   * - data: object with emails array and timestamp
   *
   * Examples:
   *
   * Simple format (backward compatible):
   * {
   *   to: "user@example.com",
   *   subject: "Password Reset",
   *   body: "<p>Reset code: {{resetCode}}</p><p>Hello {{firstName}}!</p>",
   *   from: "noreply@example.com",
   *   name: "My App",
   *   data: {
   *     firstName: "John",                              // Persistent - saved to contact
   *     resetCode: {value: "ABC123", persistent: false} // Non-persistent - this email only
   *   }
   * }
   *
   * Object format (recommended):
   * {
   *   to: {
   *     name: "Jane Doe",
   *     email: "user@example.com"
   *   },
   *   subject: "Password Reset",
   *   body: "<p>Reset code: {{resetCode}}</p>",
   *   from: {
   *     name: "My App",
   *     email: "noreply@example.com"
   *   }
   * }
   *
   * Multiple recipients with names:
   * {
   *   to: [
   *     {name: "Jane Doe", email: "jane@example.com"},
   *     {name: "John Smith", email: "john@example.com"}
   *   ],
   *   subject: "Newsletter",
   *   body: "<p>Hello {{name}}!</p>",
   *   from: {name: "Newsletter", email: "news@example.com"}
   * }
   */
  @Post('send')
  @Middleware([requireSecretKey])
  @CatchAsync
  public async send(req: Request, res: Response, next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;

    // Zod validation - errors automatically handled by global error handler
    const {to, subject, body, subscribed, name, from, reply, headers, data, template, attachments} =
      ActionSchemas.send.parse(req.body);

    // Normalize recipients to array and parse email/name
    type Recipient = {email: string; name?: string};
    const recipients: Recipient[] = (Array.isArray(to) ? to : [to]).map(recipient => {
      if (typeof recipient === 'string') {
        return {email: recipient};
      } else {
        return {email: recipient.email, name: recipient.name};
      }
    });

    // Parse 'from' field - can be string or object {name, email}
    let emailFrom: string | undefined;
    let emailFromName: string | undefined;

    if (typeof from === 'string') {
      // Backward compatible: from is just an email string
      emailFrom = from;
      emailFromName = name; // Use separate 'name' field if provided
    } else if (from && typeof from === 'object') {
      // New format: from is an object with {name, email}
      emailFrom = from.email;
      emailFromName = from.name || name; // Prefer from.name, fallback to separate 'name' field
    } else {
      // No 'from' provided
      emailFromName = name;
    }

    // Fetch template if provided
    let emailSubject = subject;
    let emailBody = body;
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

      // Handle from field - if not already set and template has a from, use it
      if (!emailFrom && templateRecord.from) {
        emailFrom = templateRecord.from;
      }
      if (!emailFromName && templateRecord.fromName) {
        emailFromName = templateRecord.fromName;
      }

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
    for (const recipient of recipients) {
      // Merge recipient name with data if provided
      const recipientData = recipient.name
        ? {...(data as Record<string, unknown> | undefined), name: recipient.name}
        : (data as Record<string, unknown> | undefined);

      // Create or update contact with metadata
      const contact = await ContactService.upsert(
        auth.projectId,
        recipient.email,
        recipientData,
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
        toName: recipient.name,
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
