import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@plunk/ui';
import type {Campaign} from '@plunk/db';
import {CampaignStatus} from '@plunk/db';
import type {PaginatedResponse} from '@plunk/types';
import {ArrowLeft, Calendar, Mail, Users} from 'lucide-react';
import {useState} from 'react';
import useSWR from 'swr';

interface CampaignSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCampaign: (campaign: Campaign, selectedFields: SelectedFields) => void;
}

interface SelectedFields {
  subject: boolean;
  body: boolean;
  from: boolean;
  fromName: boolean;
  replyTo: boolean;
  audience: boolean;
}

export function CampaignSelectionDialog({open, onOpenChange, onSelectCampaign}: CampaignSelectionDialogProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({
    subject: true,
    body: true,
    from: true,
    fromName: true,
    replyTo: true,
    audience: true,
  });

  const {data, isLoading} = useSWR<PaginatedResponse<Campaign>>(
    open ? `/campaigns?page=${page}&pageSize=10${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}` : null,
    {revalidateOnFocus: false},
  );

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedCampaign(null);
  };

  const handleConfirm = () => {
    if (selectedCampaign) {
      onSelectCampaign(selectedCampaign, selectedFields);
      onOpenChange(false);
      // Reset state
      setPage(1);
      setStatusFilter('ALL');
      setStep('select');
      setSelectedCampaign(null);
      setSelectedFields({
        subject: true,
        body: true,
        from: true,
        fromName: true,
        replyTo: true,
        audience: true,
      });
    }
  };

  const toggleField = (field: keyof SelectedFields) => {
    setSelectedFields(prev => ({...prev, [field]: !prev[field]}));
  };

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

  const getAudienceLabel = (campaign: Campaign) => {
    if (campaign.audienceType === 'ALL') {
      return 'All Contacts';
    } else if (campaign.audienceType === 'SEGMENT') {
      return `Segment (${campaign.totalRecipients.toLocaleString()} contacts)`;
    } else {
      return `Filtered (${campaign.totalRecipients.toLocaleString()} contacts)`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'configure' && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 'select' ? 'Select a Campaign' : 'Choose What to Copy'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Choose a previous campaign to use as a starting point'
              : 'Select which parts of the campaign you want to use'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Status Filter */}
            <div className="space-y-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Campaigns</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaigns List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg
                      className="h-8 w-8 animate-spin mx-auto text-neutral-900"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-neutral-500">Loading campaigns...</p>
                  </div>
                </div>
              )}

              {!isLoading && data?.data.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No campaigns found</h3>
                  <p className="text-neutral-500">
                    {statusFilter !== 'ALL' ? 'Try adjusting your filter' : 'Create your first campaign to get started'}
                  </p>
                </div>
              )}

              {data?.data.map(campaign => (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover:border-neutral-400 transition-colors"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        {campaign.description && (
                          <CardDescription className="text-xs line-clamp-1">{campaign.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-neutral-500" />
                        <span className="text-neutral-500">Subject:</span>
                        <span className="font-medium text-neutral-900 truncate">{campaign.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-neutral-500" />
                        <span className="text-neutral-500">Audience:</span>
                        <span className="text-neutral-700">{getAudienceLabel(campaign)}</span>
                      </div>
                      {campaign.scheduledFor && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                          <span className="text-neutral-500">Scheduled:</span>
                          <span className="text-neutral-700">
                            {new Date(campaign.scheduledFor).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t">
                <p className="text-sm text-neutral-500">
                  Page {page} of {data.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === data.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Campaign Preview */}
              {selectedCampaign && (
                <div className="pb-4 mb-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">{selectedCampaign.name}</span>
                    {getStatusBadge(selectedCampaign.status)}
                  </div>
                  {selectedCampaign.description && (
                    <p className="text-xs text-neutral-500 mt-1">{selectedCampaign.description}</p>
                  )}
                </div>
              )}

              {/* Field Selection */}
              <div className="divide-y divide-neutral-100">
                <div
                  className="flex items-center gap-3 py-3 cursor-pointer hover:text-neutral-900 transition-colors"
                  onClick={() => toggleField('subject')}
                >
                  <Checkbox
                    id="subject"
                    checked={selectedFields.subject}
                    onCheckedChange={() => toggleField('subject')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="subject" className="text-sm font-medium cursor-pointer">
                      Email Subject
                    </Label>
                    {selectedCampaign?.subject && (
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">{selectedCampaign.subject}</p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 py-3 cursor-pointer hover:text-neutral-900 transition-colors"
                  onClick={() => toggleField('body')}
                >
                  <Checkbox id="body" checked={selectedFields.body} onCheckedChange={() => toggleField('body')} />
                  <div className="flex-1">
                    <Label htmlFor="body" className="text-sm font-medium cursor-pointer">
                      Email Body
                    </Label>
                    <p className="text-xs text-neutral-400 mt-0.5">Full email content and design</p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 py-3 cursor-pointer hover:text-neutral-900 transition-colors"
                  onClick={() => toggleField('from')}
                >
                  <Checkbox id="from" checked={selectedFields.from} onCheckedChange={() => toggleField('from')} />
                  <div className="flex-1">
                    <Label htmlFor="from" className="text-sm font-medium cursor-pointer">
                      From Email
                    </Label>
                    {selectedCampaign?.from && (
                      <p className="text-xs text-neutral-400 mt-0.5">{selectedCampaign.from}</p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 py-3 cursor-pointer hover:text-neutral-900 transition-colors"
                  onClick={() => toggleField('fromName')}
                >
                  <Checkbox
                    id="fromName"
                    checked={selectedFields.fromName}
                    onCheckedChange={() => toggleField('fromName')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="fromName" className="text-sm font-medium cursor-pointer">
                      From Name
                    </Label>
                    {selectedCampaign?.fromName && (
                      <p className="text-xs text-neutral-400 mt-0.5">{selectedCampaign.fromName}</p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 py-3 cursor-pointer hover:text-neutral-900 transition-colors"
                  onClick={() => toggleField('replyTo')}
                >
                  <Checkbox
                    id="replyTo"
                    checked={selectedFields.replyTo}
                    onCheckedChange={() => toggleField('replyTo')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="replyTo" className="text-sm font-medium cursor-pointer">
                      Reply-To Email
                    </Label>
                    {selectedCampaign?.replyTo && (
                      <p className="text-xs text-neutral-400 mt-0.5">{selectedCampaign.replyTo}</p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 py-3 cursor-pointer hover:text-neutral-900 transition-colors"
                  onClick={() => toggleField('audience')}
                >
                  <Checkbox
                    id="audience"
                    checked={selectedFields.audience}
                    onCheckedChange={() => toggleField('audience')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="audience" className="text-sm font-medium cursor-pointer">
                      Audience Settings
                    </Label>
                    {selectedCampaign && (
                      <p className="text-xs text-neutral-400 mt-0.5">{getAudienceLabel(selectedCampaign)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div className="flex gap-3 pt-4 border-t mt-4">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={!Object.values(selectedFields).some(v => v)}>
                Create Campaign
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
