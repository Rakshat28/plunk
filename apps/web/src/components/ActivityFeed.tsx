import {Button} from '@plunk/ui';
import type {Activity, CursorPaginatedResponse} from '@plunk/types';
import {network} from '../lib/network';
import {ActivityItem} from './ActivityItem';
import {Loader2} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';

export interface ActivityFeedProps {
  typeFilter?: string;
  dateRangeDays?: number;
  contactId?: string;
}

export function ActivityFeed({typeFilter, dateRangeDays = 30, contactId}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize start date to prevent recreation on every render
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - dateRangeDays);
    return date.toISOString();
  }, [dateRangeDays]);

    const fetchActivities = useCallback(
    async (cursor?: string) => {
      try {
        if (cursor) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          setActivities([]);
          setNextCursor(undefined);
          setHasMore(true);
        }
        setError(null);

        const params = new URLSearchParams({
          limit: '20', // Conservative limit to avoid overloading
          startDate: startDate,
        });

        if (cursor) {
          params.set('cursor', cursor);
        }
        if (typeFilter) {
          params.set('types', typeFilter);
        }
        if (contactId) {
          params.set('contactId', contactId);
        }

        const result = await network.fetch<CursorPaginatedResponse<Activity>>('GET', `/activity?${params.toString()}`);

        if (cursor) {
          // Append to existing activities
          setActivities(prev => [...prev, ...result.data]);
        } else {
          // Replace activities
          setActivities(result.data);
        }

        setNextCursor(result.cursor);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
        console.error('Error fetching activities:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [typeFilter, startDate, contactId],
  );

  // Fetch upcoming activities
  const fetchUpcomingActivities = useCallback(async () => {
    try {
      // Don't fetch upcoming if we're filtering by contact
      // (upcoming items aren't contact-specific)
      if (contactId) {
        setUpcomingActivities([]);
        return;
      }

      const params = new URLSearchParams({
        limit: '20',
        daysAhead: dateRangeDays.toString(),
      });

      const result = await network.fetch<{activities: Activity[]}>('GET', `/activity/upcoming?${params.toString()}`);

      setUpcomingActivities(result.activities);
    } catch (err) {
      console.error('Error fetching upcoming activities:', err);
      // Don't set error state for upcoming - just fail silently
      setUpcomingActivities([]);
    }
  }, [dateRangeDays, contactId]);

  // Initial fetch - only run once when filters change
  useEffect(() => {
    void fetchActivities();
    void fetchUpcomingActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, startDate, contactId]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    // Don't set up auto-refresh if still loading initial data
    if (isLoading) {
      return;
    }

    const interval = setInterval(() => {
      // Only refresh if we're on the first page and not already loading
      if (!isLoading && !isLoadingMore && activities.length > 0) {
        void fetchActivities();
        void fetchUpcomingActivities();
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isLoadingMore, activities.length]);

  const loadMore = () => {
    if (nextCursor && hasMore && !isLoadingMore) {
      void fetchActivities(nextCursor);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
        <Button onClick={() => fetchActivities()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (activities.length === 0 && upcomingActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-sm">
          No activity found for the selected filters. Activities will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Past Activity Timeline */}
      {activities.length > 0 && (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={`${activity.id}-${index}`}>
              <ActivityItem activity={activity} />
              {index < activities.length - 1 && <div className="border-t border-neutral-100 my-4" />}
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button onClick={loadMore} variant="outline" disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Separator between past and upcoming */}
      {activities.length > 0 && upcomingActivities.length > 0 && (
        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm font-medium text-neutral-500">Upcoming Scheduled</span>
          </div>
        </div>
      )}

      {/* Upcoming Activities */}
      {upcomingActivities.length > 0 && (
        <div className="space-y-4">
          {upcomingActivities.map((activity, index) => (
            <div key={`${activity.id}-${index}`}>
              <ActivityItem activity={activity} isUpcoming={true} />
              {index < upcomingActivities.length - 1 && <div className="border-t border-neutral-100 my-4" />}
            </div>
          ))}
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && activities.length > 0 && upcomingActivities.length === 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-neutral-400">You&apos;ve reached the end of the activity feed</p>
        </div>
      )}
    </div>
  );
}
