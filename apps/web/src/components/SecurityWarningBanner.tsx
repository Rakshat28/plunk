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

  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Security Warning - Action Required</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium">
            Your project has exceeded the following security thresholds:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
            {status.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-800 mt-2">
            High bounce or complaint rates can lead to project suspension. Review the detailed metrics
            and take action to improve your email quality.
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
