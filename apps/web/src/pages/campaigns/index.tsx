import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@plunk/ui';
import type {Campaign, Template} from '@plunk/db';
import {CampaignStatus} from '@plunk/db';
import type {PaginatedResponse} from '@plunk/types';
import {DashboardLayout} from '../../components/DashboardLayout';
import {TemplateSelectionDialog} from '../../components/TemplateSelectionDialog';
import {CampaignSelectionDialog} from '../../components/CampaignSelectionDialog';
import {network} from '../../lib/network';
import {formatRelativeTime} from '../../lib/dateUtils';
import {Calendar, ChevronDown, Copy, FileText, Info, Mail, Plus, RefreshCw, Trash2, Users} from 'lucide-react';
import {NextSeo} from 'next-seo';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useState} from 'react';
import {toast} from 'sonner';
import useSWR from 'swr';
import dayjs from 'dayjs';

export default function CampaignsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [campaignToCancel, setCampaignToCancel] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  const {data, mutate, isLoading} = useSWR<PaginatedResponse<Campaign>>(
    `/campaigns?page=${page}&pageSize=20${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`,
    {revalidateOnFocus: false},
  );

  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<
      CampaignStatus,
      {variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string}
    > = {
      DRAFT: {variant: 'secondary', label: 'Draft', className: 'bg-neutral-100 text-neutral-700'},
      SCHEDULED: {variant: 'default', label: 'Scheduled', className: 'bg-blue-100 text-blue-700'},
      SENDING: {variant: 'default', label: 'Sending', className: 'bg-purple-100 text-purple-700'},
      SENT: {variant: 'default', label: 'Sent', className: 'bg-green-100 text-green-700'},
      CANCELLED: {variant: 'destructive', label: 'Cancelled', className: 'bg-red-100 text-red-700'},
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleCancel = async () => {
    if (!campaignToCancel) return;

    try {
      await network.fetch('POST', `/campaigns/${campaignToCancel}/cancel`);
      toast.success('Campaign cancelled successfully');
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel campaign');
    } finally {
      setCampaignToCancel(null);
    }
  };

  const handleDuplicate = async (campaignId: string) => {
    try {
      await network.fetch('POST', `/campaigns/${campaignId}/duplicate`);
      toast.success('Campaign duplicated successfully');
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate campaign');
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;

    try {
      await network.fetch('DELETE', `/campaigns/${campaignToDelete}`);
      toast.success('Campaign deleted successfully');
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete campaign');
    } finally {
      setCampaignToDelete(null);
    }
  };

  const handleSelectTemplate = (
    template: Template,
    selectedFields: {
      subject: boolean;
      body: boolean;
      from: boolean;
      fromName: boolean;
      replyTo: boolean;
    },
  ) => {
    // Navigate to create page with template data as query params
    const query: Record<string, string> = {
      name: `${template.name}`,
    };

    // Only include templateId if body is selected (needed to fetch body content)
    if (selectedFields.body) {
      query.templateId = template.id;
    }

    // Add selected fields to query params
    if (selectedFields.subject) {
      query.subject = template.subject;
    }
    if (selectedFields.from) {
      query.from = template.from;
    }
    if (selectedFields.fromName && template.fromName) {
      query.fromName = template.fromName;
    }
    if (selectedFields.replyTo && template.replyTo) {
      query.replyTo = template.replyTo;
    }

    void router.push({
      pathname: '/campaigns/create',
      query,
    });
  };

  const handleSelectCampaign = (
    campaign: Campaign,
    selectedFields: {
      subject: boolean;
      body: boolean;
      from: boolean;
      fromName: boolean;
      replyTo: boolean;
      audience: boolean;
    },
  ) => {
    // Navigate to create page with campaign data as query params
    const query: Record<string, string> = {
      name: `${campaign.name}`,
    };

    // Only include campaignId if body is selected (needed to fetch body content)
    if (selectedFields.body) {
      query.campaignId = campaign.id;
    }

    // Add selected fields to query params
    if (selectedFields.subject) {
      query.subject = campaign.subject;
    }
    if (selectedFields.from) {
      query.from = campaign.from;
    }
    if (selectedFields.fromName && campaign.fromName) {
      query.fromName = campaign.fromName;
    }
    if (selectedFields.replyTo && campaign.replyTo) {
      query.replyTo = campaign.replyTo;
    }
    if (selectedFields.audience) {
      query.audienceType = campaign.audienceType;
      if (campaign.segmentId) {
        query.segmentId = campaign.segmentId;
      }
    }

    void router.push({
      pathname: '/campaigns/create',
      query,
    });
  };

  return (
    <>
      <NextSeo title="Campaigns" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Campaigns</h1>
              <p className="text-neutral-500 mt-2 text-sm sm:text-base">
                Send one-time email broadcasts to your contacts. {data?.total ? `${data.total} total campaigns` : ''}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Campaign</span>
                  <span className="sm:hidden">Create</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuItem asChild className="py-3 cursor-pointer">
                  <Link href="/campaigns/create" className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-neutral-700" />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-medium text-sm">Empty Campaign</span>
                      <span className="text-xs text-neutral-500 leading-snug">
                        Start from scratch with a blank canvas
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowTemplateDialog(true)} className="py-3 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-neutral-700" />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-medium text-sm">From Template</span>
                      <span className="text-xs text-neutral-500 leading-snug">
                        Use an existing template as a starting point
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCampaignDialog(true)} className="py-3 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-4 w-4 mt-0.5 text-neutral-700" />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-medium text-sm">From Previous Campaign</span>
                      <span className="text-xs text-neutral-500 leading-snug">
                        Copy content and settings from an existing campaign
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="SENDING">Sending</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="space-y-4">
            {isLoading && (
              <Card>
                <CardContent className="py-8 text-center text-neutral-500">Loading campaigns...</CardContent>
              </Card>
            )}

            {!isLoading && data?.data.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} campaigns` : 'No campaigns yet'}
                    </h3>
                    <p className="text-neutral-500 mb-6">
                      {statusFilter !== 'ALL'
                        ? 'Try adjusting your filters or create a new campaign.'
                        : 'Create your first campaign to send emails to your contacts.'}
                    </p>
                    {statusFilter === 'ALL' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="lg">
                            <Plus className="h-4 w-4" />
                            Create Your First Campaign
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-80">
                          <DropdownMenuItem asChild className="py-3 cursor-pointer">
                            <Link href="/campaigns/create" className="flex items-start gap-3">
                              <Mail className="h-4 w-4 mt-0.5 text-neutral-700" />
                              <div className="flex flex-col gap-0.5 flex-1">
                                <span className="font-medium text-sm">Empty Campaign</span>
                                <span className="text-xs text-neutral-500 leading-snug">
                                  Start from scratch with a blank canvas
                                </span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowTemplateDialog(true)} className="py-3 cursor-pointer">
                            <div className="flex items-start gap-3">
                              <FileText className="h-4 w-4 mt-0.5 text-neutral-700" />
                              <div className="flex flex-col gap-0.5 flex-1">
                                <span className="font-medium text-sm">From Template</span>
                                <span className="text-xs text-neutral-500 leading-snug">
                                  Use an existing template as a starting point
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowCampaignDialog(true)} className="py-3 cursor-pointer">
                            <div className="flex items-start gap-3">
                              <RefreshCw className="h-4 w-4 mt-0.5 text-neutral-700" />
                              <div className="flex flex-col gap-0.5 flex-1">
                                <span className="font-medium text-sm">From Previous Campaign</span>
                                <span className="text-xs text-neutral-500 leading-snug">
                                  Copy content and settings from an existing campaign
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {statusFilter !== 'ALL' && (
                      <Link href="/campaigns/create">
                        <Button size="lg">
                          <Plus className="h-4 w-4" />
                          Create Campaign
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {data?.data.map(campaign => {
              const openRate = campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0;
              const clickRate = campaign.sentCount > 0 ? (campaign.clickedCount / campaign.sentCount) * 100 : 0;
              const deliveryProgress =
                campaign.totalRecipients > 0 ? (campaign.sentCount / campaign.totalRecipients) * 100 : 0;

              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-all hover:border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="hover:text-primary transition-colors flex-1 min-w-0"
                          >
                            <CardTitle className="text-xl truncate">{campaign.name}</CardTitle>
                          </Link>
                          {getStatusBadge(campaign.status)}
                        </div>
                        {campaign.description && (
                          <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Recipients */}
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-xs font-medium text-blue-900">Recipients</span>
                          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                            <div className="group relative">
                              <Info className="h-3 w-3 text-blue-600 cursor-help" />
                              <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-1">
                                This count will be recalculated before sending
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-900">{campaign.totalRecipients.toLocaleString()}</p>
                        {campaign.totalRecipients > 0 && campaign.status !== 'DRAFT' && (
                          <p className="text-xs text-blue-700 mt-1">{deliveryProgress.toFixed(0)}% sent</p>
                        )}
                        {campaign.status === 'DRAFT' && <p className="text-xs text-blue-600 mt-1">Estimated</p>}
                      </div>

                      {/* Open Rate */}
                      {campaign.sentCount > 0 && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs font-medium text-purple-900">Opens</span>
                          </div>
                          <p className="text-lg font-bold text-purple-900">{openRate.toFixed(1)}%</p>
                          <p className="text-xs text-purple-700 mt-1">{campaign.openedCount.toLocaleString()} opened</p>
                        </div>
                      )}

                      {/* Click Rate */}
                      {campaign.clickedCount > 0 && (
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-3.5 w-3.5 text-orange-600" />
                            <span className="text-xs font-medium text-orange-900">Clicks</span>
                          </div>
                          <p className="text-lg font-bold text-orange-900">{clickRate.toFixed(1)}%</p>
                          <p className="text-xs text-orange-700 mt-1">
                            {campaign.clickedCount.toLocaleString()} clicked
                          </p>
                        </div>
                      )}

                      {/* Scheduled For */}
                      {campaign.scheduledFor && (
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 md:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-medium text-green-900">Scheduled</span>
                          </div>
                          <p className="text-sm font-semibold text-green-900">
                            {new Date(campaign.scheduledFor).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {new Date(campaign.scheduledFor).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <div className="group relative inline-block cursor-help">
                          <span>Created {formatRelativeTime(campaign.createdAt)}</span>
                          <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg bottom-full left-0 mb-1 whitespace-nowrap">
                            {dayjs(campaign.createdAt).format('DD MMMM YYYY, hh:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="group relative inline-block cursor-help">
                        <span>• Updated {formatRelativeTime(campaign.updatedAt)}</span>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg bottom-full left-0 mb-1 whitespace-nowrap">
                          {dayjs(campaign.updatedAt).format('DD MMMM YYYY, hh:mm')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-100">
                      <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          {campaign.status === 'DRAFT' ? 'Edit Campaign' : 'View Details'}
                        </Button>
                      </Link>

                      <Button variant="outline" size="sm" onClick={() => handleDuplicate(campaign.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>

                      {campaign.status === 'DRAFT' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setCampaignToDelete(campaign.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      {(campaign.status === 'SCHEDULED' || campaign.status === 'SENDING') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setCampaignToCancel(campaign.id);
                            setShowCancelDialog(true);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-neutral-600">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          onConfirm={handleCancel}
          title="Cancel Campaign"
          description="Are you sure you want to cancel this campaign?"
          confirmText="Cancel Campaign"
          variant="destructive"
        />

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Campaign"
          description="Are you sure you want to delete this draft campaign? This action cannot be undone."
          confirmText="Delete Campaign"
          variant="destructive"
        />

        <TemplateSelectionDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
          onSelectTemplate={handleSelectTemplate}
        />

        <CampaignSelectionDialog
          open={showCampaignDialog}
          onOpenChange={setShowCampaignDialog}
          onSelectCampaign={handleSelectCampaign}
        />
      </DashboardLayout>
    </>
  );
}
