import {Alert, AlertDescription, AlertTitle, Button} from '@plunk/ui';
import {AlertTriangle} from 'lucide-react';
import Link from 'next/link';
import type {SecurityStatus} from '@plunk/types';

interface SecurityWarningBannerProps {
  status: SecurityStatus;
}

export function SecurityWarningBanner({status}: SecurityWarningBannerProps) {
  // Don't show if no warnings or already disabled
  if (status.warnings.length === 0 || status.shouldDisable) {
    return null;
  }

  const sevenDayBounceRate = status.sevenDay.bounceRate.toFixed(2);
  const sevenDayComplaintRate = status.sevenDay.complaintRate.toFixed(3);

  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Security Warning - Action Required</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm">
            Your project has exceeded security thresholds. Current rates: 7-day bounce rate{' '}
            <strong>{sevenDayBounceRate}%</strong>, 7-day complaint rate{' '}
            <strong>{sevenDayComplaintRate}%</strong>.
          </p>
          <p className="text-xs text-amber-800">
            High bounce or complaint rates can lead to project suspension. Review the detailed metrics
            and take action to improve your email quality.
          </p>
        </div>
        <Link href="/settings?tab=security">
          <Button size="sm" variant="outline" className="w-full sm:w-auto">
            View Details
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
