import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from '@plunk/ui';
import {AlertCircle, AlertTriangle, CheckCircle, Shield} from 'lucide-react';
import type {ProjectSecurityMetrics} from '@plunk/types';

interface SecuritySettingsProps {
  metrics: ProjectSecurityMetrics;
  isLoading: boolean;
}

export function SecuritySettings({metrics, isLoading}: SecuritySettingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
          <CardDescription>Monitor your project&apos;s email health and reputation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">Loading security metrics...</p>
        </CardContent>
      </Card>
    );
  }

  const {status, thresholds, isDisabled} = metrics;

  // Helper to get status color and icon
  const getStatusIndicator = (rate: number, warningThreshold: number, criticalThreshold: number) => {
    if (rate >= criticalThreshold) {
      return {color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-600', label: 'Critical'};
    }
    if (rate >= warningThreshold) {
      return {color: 'text-orange-600', icon: AlertTriangle, bg: 'bg-orange-500', label: 'Warning'};
    }
    return {color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-600', label: 'Healthy'};
  };

  const sevenDayBounceStatus = getStatusIndicator(
    status.sevenDay.bounceRate,
    thresholds.BOUNCE_7DAY_WARNING,
    thresholds.BOUNCE_7DAY_CRITICAL,
  );

  const allTimeBounceStatus = getStatusIndicator(
    status.allTime.bounceRate,
    thresholds.BOUNCE_ALLTIME_WARNING,
    thresholds.BOUNCE_ALLTIME_CRITICAL,
  );

  const sevenDayComplaintStatus = getStatusIndicator(
    status.sevenDay.complaintRate,
    thresholds.COMPLAINT_7DAY_WARNING,
    thresholds.COMPLAINT_7DAY_CRITICAL,
  );

  const allTimeComplaintStatus = getStatusIndicator(
    status.allTime.complaintRate,
    thresholds.COMPLAINT_ALLTIME_WARNING,
    thresholds.COMPLAINT_ALLTIME_CRITICAL,
  );

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
              <Shield className={`h-5 w-5 ${status.isHealthy ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <CardTitle>Security Overview</CardTitle>
              <CardDescription>
                {status.isHealthy ? 'Your project is in good standing' : 'Action required to maintain project health'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Project Disabled Alert */}
          {isDisabled && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Project Disabled</AlertTitle>
              <AlertDescription>
                This project has been disabled due to critical security violations. Contact support to resolve.
              </AlertDescription>
            </Alert>
          )}

          {/* Violations */}
          {status.violations.length > 0 && !isDisabled && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Critical Violations ({status.violations.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  {status.violations.map((violation, idx) => (
                    <li key={idx}>{violation}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {status.warnings.length > 0 && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Security Warnings ({status.warnings.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  {status.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Healthy Status */}
          {status.isHealthy && !isDisabled && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                All security metrics are within acceptable thresholds. Keep up the good work!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bounce Rate Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Bounce Rate Metrics</CardTitle>
          <CardDescription>Hard bounces indicate invalid or non-existent email addresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 7-Day Bounce Rate */}
          <MetricDisplay
            label="7-Day Bounce Rate"
            rate={status.sevenDay.bounceRate}
            count={status.sevenDay.bounces}
            total={status.sevenDay.total}
            warningThreshold={thresholds.BOUNCE_7DAY_WARNING}
            criticalThreshold={thresholds.BOUNCE_7DAY_CRITICAL}
            status={sevenDayBounceStatus}
          />

          {/* All-Time Bounce Rate */}
          <MetricDisplay
            label="All-Time Bounce Rate"
            rate={status.allTime.bounceRate}
            count={status.allTime.bounces}
            total={status.allTime.total}
            warningThreshold={thresholds.BOUNCE_ALLTIME_WARNING}
            criticalThreshold={thresholds.BOUNCE_ALLTIME_CRITICAL}
            status={allTimeBounceStatus}
          />
        </CardContent>
      </Card>

      {/* Complaint Rate Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Rate Metrics</CardTitle>
          <CardDescription>Complaints occur when recipients mark emails as spam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 7-Day Complaint Rate */}
          <MetricDisplay
            label="7-Day Complaint Rate"
            rate={status.sevenDay.complaintRate}
            count={status.sevenDay.complaints}
            total={status.sevenDay.total}
            warningThreshold={thresholds.COMPLAINT_7DAY_WARNING}
            criticalThreshold={thresholds.COMPLAINT_7DAY_CRITICAL}
            status={sevenDayComplaintStatus}
            isComplaintRate
          />

          {/* All-Time Complaint Rate */}
          <MetricDisplay
            label="All-Time Complaint Rate"
            rate={status.allTime.complaintRate}
            count={status.allTime.complaints}
            total={status.allTime.total}
            warningThreshold={thresholds.COMPLAINT_ALLTIME_WARNING}
            criticalThreshold={thresholds.COMPLAINT_ALLTIME_CRITICAL}
            status={allTimeComplaintStatus}
            isComplaintRate
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricDisplayProps {
  label: string;
  rate: number;
  count: number;
  total: number;
  warningThreshold: number;
  criticalThreshold: number;
  status: {
    color: string;
    icon: React.ComponentType<{className?: string}>;
    bg: string;
    label: string;
  };
  isComplaintRate?: boolean;
}

function MetricDisplay({
  label,
  rate,
  count,
  total,
  warningThreshold,
  criticalThreshold,
  status,
  isComplaintRate = false,
}: MetricDisplayProps) {
  const Icon = status.icon;
  const progressValue = Math.min((rate / criticalThreshold) * 100, 100);
  const decimals = isComplaintRate ? 3 : 2;

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-neutral-900">{label}</h3>
          <p className="text-sm text-neutral-600 mt-1">
            {count.toLocaleString()} / {total.toLocaleString()} emails
            <span className="text-neutral-400 mx-2">•</span>
            <strong>{rate.toFixed(decimals)}%</strong>
          </p>
        </div>
        <div className={`flex items-center gap-2 ${status.color}`}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={progressValue} className="h-2" indicatorClassName={status.bg} />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>0%</span>
          <span>Warning: {warningThreshold}%</span>
          <span>Critical: {criticalThreshold}%</span>
        </div>
      </div>
    </div>
  );
}
