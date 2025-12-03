import useSWR from 'swr';

export interface ActivityStats {
  totalEvents: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalWorkflowsStarted: number;
  openRate: number;
  clickRate: number;
}

export interface ContactsResponse {
  contacts: unknown[];
  total: number;
  cursor?: string;
  hasMore: boolean;
}

export interface CampaignsResponse {
  campaigns: unknown[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalContacts: number;
  totalEmailsSent: number;
  totalCampaigns: number;
  openRate: number;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * Hook to fetch dashboard statistics
 * Fetches activity stats, contact count, and campaign count in parallel
 */
export function useDashboardStats(): DashboardStats {
  // Fetch activity stats (last 30 days by default)
  const {data: activityStats, error: activityError, isLoading: isLoadingActivity} = useSWR<ActivityStats>('/activity/stats');

  // Fetch contacts (only need the total count)
  const {data: contactsData, error: contactsError, isLoading: isLoadingContacts} = useSWR<ContactsResponse>('/contacts?limit=1');

  // Fetch campaigns (only need the total count)
  const {data: campaignsData, error: campaignsError, isLoading: isLoadingCampaigns} = useSWR<CampaignsResponse>('/campaigns?pageSize=1');

  // Still loading if ANY of the requests are still in progress
  const isLoading = isLoadingActivity || isLoadingContacts || isLoadingCampaigns;
  const error = activityError || contactsError || campaignsError;

  return {
    totalContacts: contactsData?.total ?? 0,
    totalEmailsSent: activityStats?.totalEmailsSent ?? 0,
    totalCampaigns: campaignsData?.total ?? 0,
    openRate: activityStats?.openRate ?? 0,
    isLoading,
    error,
  };
}
