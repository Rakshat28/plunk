/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@plunk/ui';
import type {Segment} from '@plunk/db';
import {CampaignAudienceType} from '@plunk/db';
import {NextSeo} from 'next-seo';
import {DashboardLayout} from '../../components/DashboardLayout';
import {EmailSettings} from '../../components/EmailSettings';
import {EmailEditor} from '../../components/EmailEditor';
import {StepHeader} from '../../components/StepHeader';
import {network} from '../../lib/network';
import {EmailFormValidator} from '../../lib/validation';
import {ArrowLeft, Save, Users} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useState} from 'react';
import {toast} from 'sonner';
import useSWR from 'swr';
import {useActiveProject} from '../../lib/contexts/ActiveProjectProvider';

export default function CreateCampaignPage() {
  const router = useRouter();
  const {activeProject} = useActiveProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [from, setFrom] = useState('');
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [audienceType, setAudienceType] = useState<CampaignAudienceType>(CampaignAudienceType.ALL);
  const [segmentId, setSegmentId] = useState('');
  const [saving, setSaving] = useState(false);

  const {data: segments} = useSWR<Segment[]>('/segments', {revalidateOnFocus: false});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = EmailFormValidator.validateCampaign({name, subject, body, from, segmentId}, audienceType);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);

    try {
      const response = await network.fetch<{data: {id: string}}>('POST', '/campaigns', {
        name,
        description: description || undefined,
        subject,
        body,
        from,
        fromName: fromName || undefined,
        replyTo: replyTo || undefined,
        audienceType,
        segmentId: audienceType === CampaignAudienceType.SEGMENT ? segmentId : undefined,
        audienceFilter: audienceType === CampaignAudienceType.FILTERED ? [] : undefined,
      } as any);

      toast.success('Campaign created successfully');
      void router.push(`/campaigns/${response.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
      setSaving(false);
    }
  };

  // Calculate estimated recipients
  const getEstimatedRecipients = () => {
    if (audienceType === CampaignAudienceType.SEGMENT && segmentId && segments) {
      const segment = segments.find(s => s.id === segmentId);
      return segment?.memberCount || 0;
    }
    return 0; // We don't have total contact count here, but in a real scenario you'd fetch it
  };

  const estimatedRecipients = getEstimatedRecipients();

  return (
    <>
      <NextSeo title="Create Campaign" />
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Create Campaign</h1>
            <p className="text-neutral-500 mt-1 text-sm sm:text-base">Create a new email campaign to send to your contacts</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Settings (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <StepHeader stepNumber={1} title="Basic Information" description="Name and describe your campaign" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Campaign Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Spring Sale Announcement"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <textarea
                      id="description"
                      placeholder="Internal notes about this campaign"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <StepHeader
                    stepNumber={2}
                    title="Email Settings"
                    description="Configure sender information and subject"
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <EmailSettings
                    from={from}
                    fromName={fromName}
                    replyTo={replyTo}
                    onFromChange={setFrom}
                    onFromNameChange={setFromName}
                    onReplyToChange={setReplyTo}
                    fromNamePlaceholder={activeProject?.name || 'Your Company'}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Email Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Introducing our Spring Sale!"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Email Content */}
              <Card>
                <CardHeader>
                  <StepHeader stepNumber={3} title="Email Content" description="Design your email message" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="body">
                      Email Body <span className="text-red-500">*</span>
                    </Label>
                    <EmailEditor
                      value={body}
                      onChange={setBody}
                      placeholder="<h1>Welcome!</h1><p>Your email content here...</p>"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Audience Selection */}
              <Card>
                <CardHeader>
                  <StepHeader stepNumber={4} title="Audience" description="Choose who will receive this campaign" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audienceType">
                      Audience Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={audienceType}
                      onValueChange={value => setAudienceType(value as CampaignAudienceType)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CampaignAudienceType.ALL}>All Subscribed Contacts</SelectItem>
                        <SelectItem value={CampaignAudienceType.SEGMENT}>Specific Segment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {audienceType === CampaignAudienceType.SEGMENT && (
                    <div className="space-y-2">
                      <Label htmlFor="segment">
                        Select Segment <span className="text-red-500">*</span>
                      </Label>
                      <Select value={segmentId} onValueChange={setSegmentId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {segments?.map(segment => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name} ({segment.memberCount.toLocaleString()} contacts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {segments?.length === 0 && (
                        <p className="text-sm text-neutral-500 mt-2">
                          No segments found.{' '}
                          <Link href="/segments/new" className="text-primary hover:underline">
                            Create one first
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {audienceType === CampaignAudienceType.SEGMENT && estimatedRecipients > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {estimatedRecipients.toLocaleString()} recipients
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          This campaign will be sent to all contacts in the selected segment
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Actions (1/3 width) */}
            <div className="space-y-6">
              {/* Campaign Summary */}
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">Status</span>
                      <span className="font-medium">Draft</span>
                    </div>

                    {name && (
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Name</span>
                        <span className="font-medium text-right truncate ml-2" title={name}>
                          {name}
                        </span>
                      </div>
                    )}

                    {subject && (
                      <div className="py-2 border-b border-neutral-100">
                        <span className="text-neutral-500 block mb-1">Subject</span>
                        <span className="font-medium text-sm">{subject}</span>
                      </div>
                    )}

                    {from && (
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">From</span>
                        <span className="font-medium text-right truncate ml-2" title={from}>
                          {from}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">Audience</span>
                      <span className="font-medium">
                        {audienceType === CampaignAudienceType.ALL ? 'All Contacts' : 'Segment'}
                      </span>
                    </div>

                    {audienceType === CampaignAudienceType.SEGMENT && estimatedRecipients > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-neutral-500">Recipients</span>
                        <span className="font-medium">{estimatedRecipients.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Info Note */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      After creating this campaign, you&apos;ll be able to review it and choose when to send it.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-4">
                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Create Campaign
                        </>
                      )}
                    </Button>
                    <Link href="/campaigns" className="w-full">
                      <Button type="button" variant="outline" className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
    </>
  );
}
