import signale from 'signale';

/**
 * Priority levels for ntfy notifications
 * Based on ntfy.sh documentation
 */
export enum NtfyPriority {
  MIN = 1, // No vibration/sound, relegated to "Other notifications"
  LOW = 2, // No vibration/sound, hidden until drawer opened
  DEFAULT = 3, // Short vibration and sound (standard)
  HIGH = 4, // Long vibration, pop-over notification
  MAX = 5, // Long vibration bursts, pop-over notification
}

/**
 * Tags for ntfy notifications (emoji shortcuts)
 */
export enum NtfyTag {
  WARNING = 'warning',
  ERROR = 'rotating_light',
  SUCCESS = 'white_check_mark',
  MONEY = 'money_with_wings',
  SHIELD = 'shield',
  ROCKET = 'rocket',
  BELL = 'bell',
  CHART = 'chart_with_upwards_trend',
  SKULL = 'skull',
  INFO = 'information_source',
}

export interface NtfyNotification {
  title: string;
  message: string;
  priority?: NtfyPriority;
  tags?: NtfyTag[];
}

/**
 * Service for sending notifications via ntfy.sh
 * Supports configurable ntfy server URL via NTFY_URL environment variable
 */
export class NtfyService {
  private static ntfyUrl: string | null = null;
  private static isConfigured = false;

  /**
   * Initialize the ntfy service with the configured URL
   */
  private static initialize(): void {
    if (this.isConfigured) {
      return;
    }

    this.ntfyUrl = process.env.NTFY_URL || null;
    this.isConfigured = true;

    if (!this.ntfyUrl) {
      signale.warn('[NTFY] NTFY_URL not configured - notifications will be skipped');
    } else {
      signale.info(`[NTFY] Initialized with URL: ${this.ntfyUrl}`);
    }
  }

  /**
   * Send a notification to ntfy
   * @param notification - The notification details
   * @returns Promise<void>
   */
  public static async send(notification: NtfyNotification): Promise<void> {
    this.initialize();

    if (!this.ntfyUrl) {
      // Silently skip if not configured
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
        Title: notification.title,
      };

      if (notification.priority) {
        headers.Priority = notification.priority.toString();
      }

      if (notification.tags && notification.tags.length > 0) {
        headers.Tags = notification.tags.join(',');
      }

      const response = await fetch(this.ntfyUrl, {
        method: 'POST',
        headers,
        body: notification.message,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      signale.success(`[NTFY] Sent notification: ${notification.title}`);
    } catch (error) {
      signale.error('[NTFY] Failed to send notification:', error);
      // Don't throw - notifications should not break the main flow
    }
  }

  /**
   * Send a high-priority notification
   */
  public static async sendHigh(title: string, message: string, tags?: NtfyTag[]): Promise<void> {
    await this.send({
      title,
      message,
      priority: NtfyPriority.HIGH,
      tags,
    });
  }

  /**
   * Send a max-priority urgent notification
   */
  public static async sendUrgent(title: string, message: string, tags?: NtfyTag[]): Promise<void> {
    await this.send({
      title,
      message,
      priority: NtfyPriority.MAX,
      tags,
    });
  }

  /**
   * Send a low-priority informational notification
   */
  public static async sendInfo(title: string, message: string, tags?: NtfyTag[]): Promise<void> {
    await this.send({
      title,
      message,
      priority: NtfyPriority.LOW,
      tags,
    });
  }

  /**
   * Send a default priority notification
   */
  public static async sendDefault(title: string, message: string, tags?: NtfyTag[]): Promise<void> {
    await this.send({
      title,
      message,
      priority: NtfyPriority.DEFAULT,
      tags,
    });
  }

  // ===== Event-specific notification helpers =====

  /**
   * Notify about a new project creation
   */
  public static async notifyProjectCreated(projectName: string, projectId: string, userId: string): Promise<void> {
    await this.sendDefault(
      'New Project Created',
      `Project "${projectName}" (${projectId}) was created by user ${userId}`,
      [NtfyTag.ROCKET, NtfyTag.SUCCESS],
    );
  }

  /**
   * Notify about subscription started
   */
  public static async notifySubscriptionStarted(
    projectName: string,
    projectId: string,
    subscriptionId: string,
  ): Promise<void> {
    await this.sendHigh(
      'Subscription Started',
      `Project "${projectName}" (${projectId}) started a paid subscription (${subscriptionId})`,
      [NtfyTag.MONEY, NtfyTag.SUCCESS],
    );
  }

  /**
   * Notify about subscription cancelled
   */
  public static async notifySubscriptionCancelled(
    projectName: string,
    projectId: string,
    subscriptionId: string,
  ): Promise<void> {
    await this.sendHigh(
      'Subscription Cancelled',
      `Project "${projectName}" (${projectId}) cancelled their subscription (${subscriptionId})`,
      [NtfyTag.WARNING, NtfyTag.MONEY],
    );
  }

  /**
   * Notify about project disabled due to security risk
   */
  public static async notifyProjectDisabledForSecurity(
    projectName: string,
    projectId: string,
    violations: string[],
  ): Promise<void> {
    const violationText = violations.join(', ');
    await this.sendUrgent(
      'Project Disabled - Security Risk',
      `Project "${projectName}" (${projectId}) was automatically disabled due to: ${violationText}`,
      [NtfyTag.SHIELD, NtfyTag.ERROR, NtfyTag.SKULL],
    );
  }

  /**
   * Notify about payment failure
   */
  public static async notifyPaymentFailed(projectName: string, projectId: string): Promise<void> {
    await this.sendHigh(
      'Payment Failed',
      `Payment failed for project "${projectName}" (${projectId})`,
      [NtfyTag.WARNING, NtfyTag.MONEY],
    );
  }

  /**
   * Notify about successful invoice payment - MIN priority (routine)
   */
  public static async notifyInvoicePaid(projectName: string, projectId: string): Promise<void> {
    await this.send({
      title: 'Invoice Paid',
      message: `Invoice paid for project "${projectName}" (${projectId})`,
      priority: NtfyPriority.MIN,
      tags: [NtfyTag.MONEY, NtfyTag.SUCCESS],
    });
  }

  /**
   * Notify about subscription update - LOW priority (minor changes)
   */
  public static async notifySubscriptionUpdated(projectName: string, projectId: string): Promise<void> {
    await this.send({
      title: 'Subscription Updated',
      message: `Subscription updated for project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.MONEY, NtfyTag.INFO],
    });
  }

  /**
   * Notify about project deletion - DEFAULT priority
   */
  public static async notifyProjectDeleted(projectName: string, projectId: string, userId: string): Promise<void> {
    await this.sendDefault(
      'Project Deleted',
      `Project "${projectName}" (${projectId}) was deleted by user ${userId}`,
      [NtfyTag.WARNING],
    );
  }

  /**
   * Notify about security warning (non-critical)
   */
  public static async notifySecurityWarning(
    projectName: string,
    projectId: string,
    warnings: string[],
  ): Promise<void> {
    const warningText = warnings.join(', ');
    await this.sendDefault(
      'Security Warning',
      `Project "${projectName}" (${projectId}) has security warnings: ${warningText}`,
      [NtfyTag.WARNING, NtfyTag.SHIELD],
    );
  }

  /**
   * Notify about email bounce - LOW priority (high volume)
   */
  public static async notifyEmailBounce(
    projectName: string,
    projectId: string,
    recipientEmail: string,
    bounceType?: string,
  ): Promise<void> {
    const bounceInfo = bounceType ? ` (${bounceType})` : '';
    await this.send({
      title: 'Email Bounced',
      message: `Email to ${recipientEmail} bounced${bounceInfo} in project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.WARNING],
    });
  }

  /**
   * Notify about email complaint - HIGH priority (reputation risk)
   */
  public static async notifyEmailComplaint(
    projectName: string,
    projectId: string,
    recipientEmail: string,
  ): Promise<void> {
    await this.sendHigh(
      'Email Complaint',
      `Email complaint received from ${recipientEmail} in project "${projectName}" (${projectId})`,
      [NtfyTag.WARNING, NtfyTag.ERROR],
    );
  }

  /**
   * Notify about new user account created via signup - LOW priority
   */
  public static async notifyUserSignup(userEmail: string, userId: string): Promise<void> {
    await this.send({
      title: 'New User Signup',
      message: `New user registered: ${userEmail} (${userId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.ROCKET, NtfyTag.SUCCESS],
    });
  }

  /**
   * Notify about new user account created via OAuth - LOW priority
   */
  public static async notifyUserOAuthSignup(
    userEmail: string,
    userId: string,
    provider: 'GitHub' | 'Google',
  ): Promise<void> {
    await this.send({
      title: `New User - ${provider} OAuth`,
      message: `New user registered via ${provider}: ${userEmail} (${userId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.ROCKET, NtfyTag.SUCCESS],
    });
  }

  // ===== Campaign event notifications =====

  /**
   * Notify about campaign created (draft) - LOW priority
   */
  public static async notifyCampaignCreated(
    campaignName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Campaign Created',
      message: `Campaign "${campaignName}" created in project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.ROCKET],
    });
  }

  /**
   * Notify about campaign scheduled - DEFAULT priority
   */
  public static async notifyCampaignScheduled(
    campaignName: string,
    projectName: string,
    projectId: string,
    scheduledFor: Date,
    recipientCount: number,
  ): Promise<void> {
    await this.sendDefault(
      'Campaign Scheduled',
      `Campaign "${campaignName}" scheduled to send to ${recipientCount} recipients at ${scheduledFor.toISOString()} in project "${projectName}" (${projectId})`,
      [NtfyTag.ROCKET, NtfyTag.INFO],
    );
  }

  /**
   * Notify about campaign sending started - LOW priority (informational)
   */
  public static async notifyCampaignSendingStarted(
    campaignName: string,
    projectName: string,
    projectId: string,
    recipientCount: number,
  ): Promise<void> {
    await this.send({
      title: 'Campaign Sending Started',
      message: `Campaign "${campaignName}" started sending to ${recipientCount} recipients in project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.ROCKET, NtfyTag.CHART],
    });
  }

  /**
   * Notify about campaign send completed - DEFAULT priority
   */
  public static async notifyCampaignSendCompleted(
    campaignName: string,
    projectName: string,
    projectId: string,
    recipientCount: number,
  ): Promise<void> {
    await this.sendDefault(
      'Campaign Send Completed',
      `Campaign "${campaignName}" successfully sent to ${recipientCount} recipients in project "${projectName}" (${projectId})`,
      [NtfyTag.ROCKET, NtfyTag.SUCCESS],
    );
  }

  /**
   * Notify about campaign cancelled - LOW priority
   */
  public static async notifyCampaignCancelled(
    campaignName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Campaign Cancelled',
      message: `Campaign "${campaignName}" was cancelled in project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.WARNING],
    });
  }

  /**
   * Notify about campaign deleted - LOW priority
   */
  public static async notifyCampaignDeleted(
    campaignName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Campaign Deleted',
      message: `Campaign "${campaignName}" was deleted from project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.INFO],
    });
  }

  // ===== Workflow event notifications =====

  /**
   * Notify about workflow created - LOW priority
   */
  public static async notifyWorkflowCreated(
    workflowName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Workflow Created',
      message: `Workflow "${workflowName}" created in project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.ROCKET],
    });
  }

  /**
   * Notify about workflow enabled
   */
  public static async notifyWorkflowEnabled(
    workflowName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.sendDefault(
      'Workflow Enabled',
      `Workflow "${workflowName}" is now active in project "${projectName}" (${projectId})`,
      [NtfyTag.SUCCESS],
    );
  }

  /**
   * Notify about workflow disabled
   */
  public static async notifyWorkflowDisabled(
    workflowName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.sendDefault(
      'Workflow Disabled',
      `Workflow "${workflowName}" has been disabled in project "${projectName}" (${projectId})`,
      [NtfyTag.WARNING],
    );
  }

  /**
   * Notify about workflow deleted - LOW priority
   */
  public static async notifyWorkflowDeleted(
    workflowName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Workflow Deleted',
      message: `Workflow "${workflowName}" was deleted from project "${projectName}" (${projectId})`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.INFO],
    });
  }

  /**
   * Notify about workflow execution failed
   */
  public static async notifyWorkflowExecutionFailed(
    workflowName: string,
    projectName: string,
    projectId: string,
    contactEmail: string,
    error: string,
  ): Promise<void> {
    await this.sendHigh(
      'Workflow Execution Failed',
      `Workflow "${workflowName}" failed for contact ${contactEmail} in project "${projectName}" (${projectId}). Error: ${error}`,
      [NtfyTag.ERROR, NtfyTag.WARNING],
    );
  }

  // ===== Domain verification notifications =====

  /**
   * Notify about domain added
   */
  public static async notifyDomainAdded(domain: string, projectName: string, projectId: string): Promise<void> {
    await this.sendDefault(
      'Domain Added',
      `Domain "${domain}" added for verification in project "${projectName}" (${projectId})`,
      [NtfyTag.INFO],
    );
  }

  /**
   * Notify about domain verified
   */
  public static async notifyDomainVerified(domain: string, projectName: string, projectId: string): Promise<void> {
    await this.sendDefault(
      'Domain Verified',
      `Domain "${domain}" is now verified and ready for use in project "${projectName}" (${projectId})`,
      [NtfyTag.SUCCESS, NtfyTag.SHIELD],
    );
  }

  /**
   * Notify about domain verification failed
   */
  public static async notifyDomainVerificationFailed(
    domain: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.sendHigh(
      'Domain Verification Failed',
      `Domain "${domain}" failed verification in project "${projectName}" (${projectId}). Email sending may be affected.`,
      [NtfyTag.WARNING, NtfyTag.SHIELD],
    );
  }

  /**
   * Notify about domain removed
   */
  public static async notifyDomainRemoved(domain: string, projectName: string, projectId: string): Promise<void> {
    await this.sendInfo(
      'Domain Removed',
      `Domain "${domain}" was removed from project "${projectName}" (${projectId})`,
      [NtfyTag.INFO],
    );
  }

  // ===== Billing and usage limit notifications =====

  /**
   * Notify about billing limit approaching (80% threshold)
   */
  public static async notifyBillingLimitApproaching(
    projectName: string,
    projectId: string,
    usage: number,
    limit: number,
    percentage: number,
    sourceType: string,
  ): Promise<void> {
    await this.sendDefault(
      'Billing Limit Warning',
      `Email usage at ${Math.round(percentage)}% (${usage}/${limit}) for ${sourceType} in project "${projectName}" (${projectId})`,
      [NtfyTag.WARNING, NtfyTag.MONEY, NtfyTag.CHART],
    );
  }

  /**
   * Notify about billing limit exceeded - MAX priority (blocks operations)
   */
  public static async notifyBillingLimitExceeded(
    projectName: string,
    projectId: string,
    usage: number,
    limit: number,
    sourceType: string,
  ): Promise<void> {
    await this.sendUrgent(
      'Billing Limit Exceeded',
      `Email usage limit reached (${usage}/${limit}) for ${sourceType} in project "${projectName}" (${projectId}). Further emails are blocked.`,
      [NtfyTag.ERROR, NtfyTag.MONEY, NtfyTag.SKULL],
    );
  }

  // ===== API key notifications =====

  /**
   * Notify about API keys regenerated
   */
  public static async notifyApiKeysRegenerated(
    projectName: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    await this.sendHigh(
      'API Keys Regenerated',
      `API keys for project "${projectName}" (${projectId}) were regenerated by user ${userId}`,
      [NtfyTag.SHIELD, NtfyTag.WARNING],
    );
  }

  // ===== Contact import notifications =====

  /**
   * Notify about contact import started - MIN priority (routine, high volume)
   */
  public static async notifyContactImportStarted(
    projectName: string,
    projectId: string,
    filename: string,
    totalRows: number,
  ): Promise<void> {
    await this.send({
      title: 'Contact Import Started',
      message: `Importing ${totalRows} contacts from "${filename}" into project "${projectName}" (${projectId})`,
      priority: NtfyPriority.MIN,
      tags: [NtfyTag.ROCKET],
    });
  }

  /**
   * Notify about contact import completed
   */
  public static async notifyContactImportCompleted(
    projectName: string,
    projectId: string,
    filename: string,
    successCount: number,
    createdCount: number,
    updatedCount: number,
    failureCount: number,
  ): Promise<void> {
    await this.sendDefault(
      'Contact Import Completed',
      `Import "${filename}" completed for project "${projectName}" (${projectId}). Success: ${successCount} (${createdCount} new, ${updatedCount} updated), Errors: ${failureCount}`,
      [NtfyTag.SUCCESS, NtfyTag.CHART],
    );
  }

  /**
   * Notify about contact import failed
   */
  public static async notifyContactImportFailed(
    projectName: string,
    projectId: string,
    filename: string,
    error: string,
  ): Promise<void> {
    await this.sendHigh(
      'Contact Import Failed',
      `Contact import "${filename}" failed for project "${projectName}" (${projectId}). Error: ${error}`,
      [NtfyTag.ERROR],
    );
  }

  // ===== Segment notifications =====

  /**
   * Notify about segment created - MIN priority
   */
  public static async notifySegmentCreated(
    segmentName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Segment Created',
      message: `Segment "${segmentName}" created in project "${projectName}" (${projectId})`,
      priority: NtfyPriority.MIN,
      tags: [NtfyTag.INFO],
    });
  }

  /**
   * Notify about segment membership computed - LOW priority
   */
  public static async notifySegmentMembershipComputed(
    segmentName: string,
    projectName: string,
    projectId: string,
    memberCount: number,
  ): Promise<void> {
    await this.send({
      title: 'Segment Membership Updated',
      message: `Segment "${segmentName}" in project "${projectName}" (${projectId}) now has ${memberCount} members`,
      priority: NtfyPriority.LOW,
      tags: [NtfyTag.CHART],
    });
  }

  /**
   * Notify about segment deleted - MIN priority
   */
  public static async notifySegmentDeleted(
    segmentName: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    await this.send({
      title: 'Segment Deleted',
      message: `Segment "${segmentName}" was deleted from project "${projectName}" (${projectId})`,
      priority: NtfyPriority.MIN,
      tags: [NtfyTag.INFO],
    });
  }
}
