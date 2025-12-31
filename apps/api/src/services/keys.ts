export const Keys = {
  User: {
    id(id: string): string {
      return `account:id:${id}`;
    },
    email(email: string): string {
      return `account:${email}`;
    },
    emailVerificationToken(token: string): string {
      return `auth:email_verification:${token}`;
    },
    passwordResetToken(token: string): string {
      return `auth:password_reset:${token}`;
    },
    emailVerificationRateLimit(userId: string): string {
      return `auth:email_verification_rate:${userId}`;
    },
    passwordResetRateLimit(email: string): string {
      return `auth:password_reset_rate:${email}`;
    },
  },
  Domain: {
    id(id: string): string {
      return `domain:id:${id}`;
    },
    project(projectId: string): string {
      return `domain:project:${projectId}`;
    },
    verifiedEmail(domainId: string): string {
      return `domain:verified_email:${domainId}`;
    },
    unverifiedEmail(domainId: string, year: number, month: string): string {
      return `domain:unverified_email:${domainId}:${year}-${month}`;
    },
  },
  Billing: {
    usage(projectId: string, sourceType: string, year: number, month: string): string {
      return `billing:usage:${projectId}:${sourceType}:${year}-${month}`;
    },
    warningEmail(projectId: string, sourceType: string, year: number, month: string): string {
      return `billing:warning_email:${projectId}:${sourceType}:${year}-${month}`;
    },
    limitEmail(projectId: string, sourceType: string, year: number, month: string): string {
      return `billing:limit_email:${projectId}:${sourceType}:${year}-${month}`;
    },
  },
  Security: {
    rates(projectId: string): string {
      return `security:${projectId}:rates`;
    },
  },
  Activity: {
    stats(projectId: string, startTime: number | string, endTime: number | string): string {
      return `activity:stats:${projectId}:${startTime}:${endTime}`;
    },
  },
  Analytics: {
    timeseries(projectId: string, startDate: string, endDate: string): string {
      return `analytics:timeseries:${projectId}:${startDate}:${endDate}`;
    },
    campaignStats(projectId: string, startDate: string, endDate: string): string {
      return `analytics:campaignStats:${projectId}:${startDate}:${endDate}`;
    },
    topEvents(projectId: string, limit: number, startDate: string, endDate: string): string {
      return `analytics:topEvents:${projectId}:${limit}:${startDate}:${endDate}`;
    },
  },
  Workflow: {
    enabled(projectId: string): string {
      return `workflows:enabled:${projectId}`;
    },
  },
} as const;
