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
 */
export function useBillingLimits(projectId: string | undefined, hasSubscription: boolean) {
  const {data, error, mutate, isLoading} = useSWR<BillingLimitsData>(
    projectId && hasSubscription ? `/users/@me/projects/${projectId}/billing-limits` : null,
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
