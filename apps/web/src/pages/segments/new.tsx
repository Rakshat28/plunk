import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label} from '@plunk/ui';
import {NextSeo} from 'next-seo';
import {DashboardLayout} from '../../components/DashboardLayout';
import {SegmentFilterBuilder} from '../../components/SegmentFilterBuilder';
import {network} from '../../lib/network';
import {ArrowLeft, Save} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useState} from 'react';
import {toast} from 'sonner';
import type {FilterCondition} from '@plunk/types';
import type {Segment} from '@plunk/db';
import {SegmentSchemas} from '@plunk/shared';

export default function NewSegmentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trackMembership, setTrackMembership] = useState(false);
  const [condition, setCondition] = useState<FilterCondition>({
    logic: 'AND',
    groups: [
      {
        filters: [{field: 'subscribed', operator: 'equals', value: true}],
      },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await network.fetch<Segment, typeof SegmentSchemas.create>('POST', '/segments', {
        name,
        description: description || undefined,
        condition,
        trackMembership,
      });
      toast.success('Segment created successfully');
      void router.push('/segments');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create segment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <NextSeo title="Create Segment" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/segments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Create Segment</h1>
              <p className="text-neutral-500 mt-1">Build complex audience filters with AND/OR logic</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Segment Details</CardTitle>
                <CardDescription>Give your segment a name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Segment Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="e.g., VIP Customers or Recent High Spenders"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g., Users on VIP plan OR recent signups who spent $1000+"
                    maxLength={500}
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <input
                    id="trackMembership"
                    type="checkbox"
                    checked={trackMembership}
                    onChange={e => setTrackMembership(e.target.checked)}
                    className="mt-1 h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="trackMembership" className="font-medium cursor-pointer">
                      Track membership changes
                    </Label>
                    <p className="text-xs text-neutral-500 mt-1">
                      When enabled, segment entry and exit events will be tracked for use in workflows and analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filter Builder */}
            <Card>
              <CardContent className="pt-6">
                <SegmentFilterBuilder condition={condition} onChange={setCondition} />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <Link href="/segments">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Segment'}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </>
  );
}
