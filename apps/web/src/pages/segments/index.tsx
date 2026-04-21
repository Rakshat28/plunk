import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  IconSpinner,
} from '@plunk/ui';
import type {Segment} from '@plunk/db';
import type {FilterCondition} from '@plunk/types';
import {DashboardLayout} from '../../components/DashboardLayout';
import {EmptyState} from '../../components/EmptyState';
import {network} from '../../lib/network';
import {formatRelativeTime} from '../../lib/dateUtils';
import {AlertTriangle, Calendar, Edit, Filter, Plus, Trash2, Users} from 'lucide-react';
import {NextSeo} from 'next-seo';
import Link from 'next/link';
import {useState} from 'react';
import {toast} from 'sonner';
import useSWR from 'swr';
import dayjs from 'dayjs';

// Helper function to count total filters in a condition
function countFiltersInCondition(condition: unknown): number {
  if (!condition || typeof condition !== 'object') return 0;

  const cond = condition as FilterCondition;
  if (!cond.groups || !Array.isArray(cond.groups)) return 0;

  return cond.groups.reduce((total, group) => {
    let count = group.filters?.length || 0;
    // Recursively count nested conditions
    if (group.conditions) {
      count += countFiltersInCondition(group.conditions);
    }
    return total + count;
  }, 0);
}

export default function SegmentsPage() {
  // Limit to 50 segments to avoid loading thousands into the browser
  const {
    data: segments,
    mutate,
    isLoading,
  } = useSWR<Segment[]>('/segments', {
    revalidateOnFocus: false,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);

  // Show warning if there are many segments
  const showLimitWarning = segments && segments.length >= 50;

  const handleDelete = async () => {
    if (!segmentToDelete) return;

    try {
      await network.fetch('DELETE', `/segments/${segmentToDelete}`);
      toast.success('Segment deleted successfully');
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete segment');
    } finally {
      setSegmentToDelete(null);
    }
  };

  return (
    <>
      <NextSeo title="Segments" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Segments</h1>
              <p className="text-neutral-500 mt-2 text-sm sm:text-base">
                Create dynamic audience groups based on contact attributes and behaviors
              </p>
            </div>
            <Link href="/segments/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Segment</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>

          {/* Warning if too many segments */}
          {showLimitWarning && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Showing first {segments?.length} segments. Consider archiving old segments to improve performance.
              </AlertDescription>
            </Alert>
          )}

          {/* Segments Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconSpinner />
            </div>
          ) : segments?.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Filter}
                  title="No segments yet"
                  description="Group contacts by attributes to target specific audiences."
                  action={
                    <Link href="/segments/new">
                      <Button>
                        <Plus className="h-4 w-4" />
                        Create Segment
                      </Button>
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segments?.map(segment => (
                <Card key={segment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{segment.name}</CardTitle>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              (segment as unknown as {type: string}).type === 'STATIC'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {(segment as unknown as {type: string}).type === 'STATIC' ? 'Static' : 'Dynamic'}
                          </span>
                        </div>
                        {segment.description && (
                          <CardDescription className="mt-1">{segment.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-neutral-500" />
                          <span className="text-sm text-neutral-600">Members</span>
                        </div>
                        <span className="text-lg font-semibold text-neutral-900">{segment.memberCount}</span>
                      </div>

                      {(segment as unknown as {type: string}).type !== 'STATIC' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-neutral-500" />
                            <span className="text-sm text-neutral-600">Filters</span>
                          </div>
                          <span className="text-sm font-medium text-neutral-900">
                            {countFiltersInCondition(segment.condition)}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
                        <Link href={`/segments/${segment.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSegmentToDelete(segment.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <div className="group relative inline-block cursor-help">
                            <span>Created {formatRelativeTime(segment.createdAt)}</span>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg bottom-full left-0 mb-1 whitespace-nowrap">
                              {dayjs(segment.createdAt).format('DD MMMM YYYY, hh:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="group relative inline-block cursor-help">
                          <span>• Updated {formatRelativeTime(segment.updatedAt)}</span>
                          <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg bottom-full left-0 mb-1 whitespace-nowrap">
                            {dayjs(segment.updatedAt).format('DD MMMM YYYY, hh:mm')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Segment"
          description="Are you sure you want to delete this segment? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      </DashboardLayout>
    </>
  );
}
