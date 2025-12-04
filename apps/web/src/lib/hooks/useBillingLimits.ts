import useSWR from 'swr';

export interface CategoryLimit {
  usage: number;
  limit: number | null;
  percentage: number;
  isWarning: boolean;
  isBlocked: boolean;
}

export interface BillingLimitsData {
  workflows: CategoryLimit;
  campaigns: CategoryLimit;
  transactional: CategoryLimit;
}

/**
 * Hook to fetch billing limits for a project
 *
 * Free tier projects (no subscription): Shows total usage with 1000/month limit
 * Paid tier projects (with subscription): Shows per-category usage with custom limits
 */
export function useBillingLimits(projectId: string | undefined, billingEnabled: boolean) {
  const {data, error, mutate, isLoading} = useSWR<BillingLimitsData>(
    projectId && billingEnabled ? `/users/@me/projects/${projectId}/billing-limits` : null,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds to keep usage updated
    },
  );

  return {
    limitsData: data,
    error,
    isLoading,
    mutate,
  };
}
