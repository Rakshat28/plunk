import {Alert, AlertDescription, AlertTitle, Button} from '@plunk/ui';
import {AlertTriangle} from 'lucide-react';
import Link from 'next/link';
import type {SecurityStatus} from '@plunk/types';

interface SecurityWarningBannerProps {
  status: SecurityStatus;
}

export function SecurityWarningBanner({status}: SecurityWarningBannerProps) {
  // Don't show if no warnings or violations
  const hasCriticalViolations = status.violations.length > 0;
  const hasWarnings = status.warnings.length > 0;

  if (!hasCriticalViolations && !hasWarnings) {
    return null;
  }

  // Determine severity - critical violations take precedence
  const variant = hasCriticalViolations ? 'destructive' : 'warning';
  const title = hasCriticalViolations
    ? 'Critical Security Violations - Immediate Action Required'
    : 'Security Warning - Action Required';
  const issues = hasCriticalViolations ? status.violations : status.warnings;
  const messageColor = hasCriticalViolations ? 'text-red-800' : 'text-amber-800';

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium">Your project has exceeded the following security thresholds:</p>
          <ul className={`list-disc list-inside space-y-1 text-sm ${messageColor}`}>
            {issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
          <p className={`text-xs ${messageColor} mt-2`}>
            {hasCriticalViolations
              ? 'Your project may be suspended soon. Please review the detailed metrics immediately and take action to improve your email quality.'
              : 'High bounce or complaint rates can lead to project suspension. Review the detailed metrics and take action to improve your email quality.'}
          </p>
        </div>
        <Link href="/settings?tab=security">
          <Button size="sm" variant="outline" className="w-full sm:w-auto flex-shrink-0">
            View Details
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
