/**
 * Security and project health types
 */

export interface SecurityRateData {
  total: number;
  bounces: number;
  complaints: number;
  bounceRate: number;
  complaintRate: number;
}

export interface SecurityStatus {
  projectId: string;
  isHealthy: boolean;
  shouldDisable: boolean;
  sevenDay: SecurityRateData;
  allTime: SecurityRateData;
  violations: string[];
  warnings: string[];
}

export interface SecurityThresholds {
  MIN_EMAILS_FOR_ENFORCEMENT: number;
  BOUNCE_7DAY_WARNING: number;
  BOUNCE_7DAY_CRITICAL: number;
  BOUNCE_ALLTIME_WARNING: number;
  BOUNCE_ALLTIME_CRITICAL: number;
  COMPLAINT_7DAY_WARNING: number;
  COMPLAINT_7DAY_CRITICAL: number;
  COMPLAINT_ALLTIME_WARNING: number;
  COMPLAINT_ALLTIME_CRITICAL: number;
}

export interface ProjectSecurityMetrics {
  status: SecurityStatus;
  thresholds: SecurityThresholds;
  isDisabled: boolean;
}
