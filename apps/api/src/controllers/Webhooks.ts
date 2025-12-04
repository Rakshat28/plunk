import {Controller, Post} from '@overnightjs/core';
import type {Prisma} from '@plunk/db';
import {EmailStatus} from '@plunk/db';
import type {Request, Response} from 'express';
import signale from 'signale';
import type Stripe from 'stripe';

import {STRIPE_ENABLED, STRIPE_WEBHOOK_SECRET} from '../app/constants.js';
import {stripe} from '../app/stripe.js';
import {prisma} from '../database/prisma.js';
import {EventService} from '../services/EventService.js';
import {NtfyService} from '../services/NtfyService.js';
import {SecurityService} from '../services/SecurityService.js';
import {CatchAsync} from '../utils/asyncHandler.js';

/**
 * Webhooks Controller
 * Handles incoming webhooks from external services (AWS SNS/SES)
 */
@Controller('webhooks')
export class Webhooks {
  /**
   * Receive SNS webhook notifications from AWS SES
   * Handles email events: delivery, open, click, bounce, complaint
   */
  @Post('sns')
  @CatchAsync
  public async receiveSNSWebhook(req: Request, res: Response) {
    try {
      // Handle SNS subscription confirmation FIRST (before parsing Message field)
      if (req.body.Type === 'SubscriptionConfirmation') {
        signale.info('SNS Subscription Confirmation received');
        signale.info('Subscribe URL:', req.body.SubscribeURL);

        // Automatically confirm the subscription
        try {
          const confirmResponse = await fetch(req.body.SubscribeURL);
          if (confirmResponse.ok) {
            signale.success('SNS subscription confirmed successfully');
            return res.status(200).json({
              success: true,
              message: 'Subscription confirmed',
            });
          } else {
            signale.error('Failed to confirm SNS subscription:', confirmResponse.statusText);
            return res.status(200).json({
              success: false,
              message: 'Failed to confirm subscription',
              subscribeURL: req.body.SubscribeURL,
            });
          }
        } catch (confirmError) {
          signale.error('Error confirming SNS subscription:', confirmError);
          return res.status(200).json({
            success: false,
            message: 'Error confirming subscription',
            subscribeURL: req.body.SubscribeURL,
          });
        }
      }

      // Handle SNS notification messages - parse the Message field
      if (req.body.Type !== 'Notification') {
        signale.warn('[WEBHOOK] Unknown SNS message type:', req.body.Type);
        return res.status(200).json({success: false, message: 'Unknown message type'});
      }

      // Parse the nested SES event from the Message field
      const body = JSON.parse(req.body.Message);
      const eventType = body.eventType as 'Bounce' | 'Delivery' | 'Open' | 'Complaint' | 'Click';
      const messageId = body.mail?.messageId;

      if (!messageId) {
        signale.warn('[WEBHOOK] No messageId found in SNS notification');
        return res.status(400).json({success: false, error: 'No messageId found'});
      }

      // Look up email by SES messageId
      const email = await prisma.email.findUnique({
        where: {messageId},
        include: {
          contact: true,
          project: true,
        },
      });

      if (!email) {
        signale.warn(`[WEBHOOK] Email not found for messageId: ${messageId}`);
        return res.status(404).json({success: false, error: 'Email not found'});
      }

      const now = new Date();
      const updateData: Prisma.EmailUpdateInput = {};
      const eventName = `email.${eventType.toLowerCase()}`;

      // Base event data with email metadata
      const baseEventData = {
        subject: email.subject,
        from: email.from,
        fromName: email.fromName,
        messageId: email.messageId,
        templateId: email.templateId,
        campaignId: email.campaignId,
        sourceType: email.sourceType,
      };
      let eventData: Record<string, unknown> = baseEventData;

      // Process event based on type
      switch (eventType) {
        case 'Delivery':
          signale.success(`[WEBHOOK] Delivery confirmed for ${email.contact.email} from ${email.project.name}`);
          updateData.status = EmailStatus.DELIVERED;
          updateData.deliveredAt = now;
          eventData = {
            ...baseEventData,
            deliveredAt: now.toISOString(),
          };
          break;

        case 'Open':
          signale.success(`[WEBHOOK] Open received for ${email.contact.email} from ${email.project.name}`);
          // Only set openedAt on first open
          if (!email.openedAt) {
            updateData.openedAt = now;
          }
          updateData.opens = (email.opens || 0) + 1;
          updateData.status = EmailStatus.OPENED;
          eventData = {
            ...baseEventData,
            openedAt: email.openedAt?.toISOString() || now.toISOString(),
            opens: (email.opens || 0) + 1,
            isFirstOpen: !email.openedAt,
          };
          break;

        case 'Click': {
          signale.success(`[WEBHOOK] Click received for ${email.contact.email} from ${email.project.name}`);
          const clickedLink = body.click?.link;
          // Only set clickedAt on first click
          if (!email.clickedAt) {
            updateData.clickedAt = now;
          }
          updateData.clicks = (email.clicks || 0) + 1;
          updateData.status = EmailStatus.CLICKED;
          eventData = {
            ...baseEventData,
            link: clickedLink,
            clickedAt: email.clickedAt?.toISOString() || now.toISOString(),
            clicks: (email.clicks || 0) + 1,
            isFirstClick: !email.clickedAt,
          };
          break;
        }

        case 'Bounce':
          signale.warn(`[WEBHOOK] Bounce received for ${email.contact.email} from ${email.project.name}`);
          updateData.status = EmailStatus.BOUNCED;
          updateData.bouncedAt = now;
          // Unsubscribe contact on bounce
          await prisma.contact.update({
            where: {id: email.contactId},
            data: {subscribed: false},
          });
          eventData = {
            ...baseEventData,
            bounceType: body.bounce?.bounceType,
            bouncedAt: now.toISOString(),
          };

          // Send notification about bounce
          await NtfyService.notifyEmailBounce(
            email.project.name,
            email.projectId,
            email.contact.email,
            body.bounce?.bounceType,
          );
          break;

        case 'Complaint':
          signale.warn(`[WEBHOOK] Complaint received for ${email.contact.email} from ${email.project.name}`);
          updateData.status = EmailStatus.COMPLAINED;
          updateData.complainedAt = now;
          // Unsubscribe contact on complaint
          await prisma.contact.update({
            where: {id: email.contactId},
            data: {subscribed: false},
          });
          eventData = {
            ...baseEventData,
            complainedAt: now.toISOString(),
          };

          // Send notification about complaint
          await NtfyService.notifyEmailComplaint(email.project.name, email.projectId, email.contact.email);
          break;

        default:
          signale.warn(`[WEBHOOK] Unknown event type: ${eventType}`);
          return res.status(200).json({success: true});
      }

      // Update email with new status and timestamps
      await prisma.email.update({
        where: {id: email.id},
        data: updateData,
      });

      // Track event (this will trigger workflows)
      await EventService.trackEvent(email.projectId, eventName, email.contactId, email.id, eventData);

      // Check security limits for bounce and complaint events
      if (eventType === 'Bounce' || eventType === 'Complaint') {
        await SecurityService.checkAndEnforceSecurityLimits(email.projectId);
      }

      signale.success(`[WEBHOOK] Processed ${eventType} event for email ${email.id}`);
      return res.status(200).json({success: true});
    } catch (error) {
      signale.error('[WEBHOOK] Error processing SNS webhook:', error);
      // Always return 200 to prevent SNS from retrying
      return res.status(200).json({success: true});
    }
  }

  /**
   * Receive Stripe webhook notifications
   * Handles subscription and payment events: checkout.session.completed, invoice.paid, etc.
   */
  @Post('incoming/stripe')
  @CatchAsync
  public async receiveStripeWebhook(req: Request, res: Response) {
    // Return 404 if billing is disabled
    if (!STRIPE_ENABLED || !stripe) {
      signale.warn('[WEBHOOK] Stripe webhook received but billing is disabled');
      return res.status(404).json({success: false, error: 'Billing is disabled'});
    }

    try {
      const sig = req.headers['stripe-signature'];

      if (!sig) {
        signale.warn('[WEBHOOK] Missing Stripe signature header');
        return res.status(400).json({success: false, error: 'Missing signature'});
      }

      // Verify webhook signature using raw body
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        signale.error('[WEBHOOK] Stripe signature verification failed:', err);
        return res.status(400).json({success: false, error: 'Invalid signature'});
      }

      signale.info(`[WEBHOOK] Received Stripe event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const projectId = session.client_reference_id; // Assuming project ID is passed as reference

          if (!projectId) {
            signale.warn('[WEBHOOK] No client_reference_id in checkout session');
            break;
          }

          // Update project with customer and subscription IDs
          const updatedProject = await prisma.project.update({
            where: {id: projectId},
            data: {
              customer: customerId,
              subscription: subscriptionId,
            },
          });

          signale.success(`[WEBHOOK] Checkout completed for project ${projectId}`);

          // Send notification about subscription started
          await NtfyService.notifySubscriptionStarted(updatedProject.name, projectId, subscriptionId);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object;
          const customerId = invoice.customer as string;

          // Find project by customer ID
          const project = await prisma.project.findUnique({
            where: {customer: customerId},
          });

          if (!project) {
            signale.warn(`[WEBHOOK] No project found for customer ${customerId}`);
            break;
          }

          signale.success(`[WEBHOOK] Invoice paid for project ${project.name} (${project.id})`);

          // Send notification about invoice payment
          await NtfyService.notifyInvoicePaid(project.name, project.id);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const customerId = invoice.customer as string;

          // Find project by customer ID
          const project = await prisma.project.findUnique({
            where: {customer: customerId},
          });

          if (!project) {
            signale.warn(`[WEBHOOK] No project found for customer ${customerId}`);
            break;
          }

          signale.warn(`[WEBHOOK] Payment failed for project ${project.name} (${project.id})`);

          // Send notification about payment failure
          await NtfyService.notifyPaymentFailed(project.name, project.id);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const subscriptionId = subscription.id;

          // Find project by subscription ID
          const project = await prisma.project.findUnique({
            where: {subscription: subscriptionId},
          });

          if (!project) {
            signale.warn(`[WEBHOOK] No project found for subscription ${subscriptionId}`);
            break;
          }

          // Clear subscription from project
          await prisma.project.update({
            where: {id: project.id},
            data: {
              subscription: null,
            },
          });

          signale.warn(`[WEBHOOK] Subscription deleted for project ${project.name} (${project.id})`);

          // Send notification about subscription cancellation
          await NtfyService.notifySubscriptionCancelled(project.name, project.id, subscriptionId);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const subscriptionId = subscription.id;

          // Find project by subscription ID
          const project = await prisma.project.findUnique({
            where: {subscription: subscriptionId},
          });

          if (!project) {
            signale.warn(`[WEBHOOK] No project found for subscription ${subscriptionId}`);
            break;
          }

          signale.info(`[WEBHOOK] Subscription updated for project ${project.name} (${project.id})`);
          signale.info(
            `[WEBHOOK] Status: ${subscription.status}, Cancel at period end: ${subscription.cancel_at_period_end}`,
          );

          // Send notification about subscription update
          await NtfyService.notifySubscriptionUpdated(project.name, project.id);
          break;
        }

        // Unhandled events
        default:
          signale.info(`[WEBHOOK] Unhandled Stripe event type: ${event.type}`);
          break;
      }

      return res.status(200).json({success: true, received: true});
    } catch (error) {
      signale.error('[WEBHOOK] Error processing Stripe webhook:', error);
      return res.status(400).json({success: false, error: 'Webhook processing failed'});
    }
  }
}
