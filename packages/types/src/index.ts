// Segment filter types
export type SegmentFilterOperator =
  // Standard operators (for contact fields)
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'exists'
  | 'notExists'
  | 'within'
  // Event-based operators
  | 'triggered'        // Event/email activity occurred (any time)
  | 'triggeredWithin'  // Event/email activity occurred within timeframe
  | 'notTriggered';    // Event/email activity never occurred

export type SegmentFilterLogic = 'AND' | 'OR';

export interface SegmentFilter {
  field: string;
  operator: SegmentFilterOperator;
  value?: any;
  unit?: 'days' | 'hours' | 'minutes';
}

export interface FilterGroup {
  filters: SegmentFilter[];
  conditions?: FilterCondition;
}

export interface FilterCondition {
  logic: SegmentFilterLogic;
  groups: FilterGroup[];
}

export interface CreateSegmentData {
  name: string;
  description?: string;
  condition: FilterCondition;
  trackMembership?: boolean;
}

export interface UpdateSegmentData {
  name?: string;
  description?: string;
  condition?: FilterCondition;
  trackMembership?: boolean;
}

export interface SegmentMembershipComputeResult {
  added: number;
  removed: number;
  total: number;
}

// Security status types
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
