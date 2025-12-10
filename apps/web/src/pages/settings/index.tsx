import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {ProjectSchemas} from '@plunk/shared';
import {TrackingMode} from '@plunk/db';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItemWithDescription,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@plunk/ui';
import {AnimatePresence, motion} from 'framer-motion';
import {NextSeo} from 'next-seo';
import {AlertTriangle, CreditCard, Database, Globe, Mail, Settings as SettingsIcon, Users} from 'lucide-react';
import type {z} from 'zod';
import {useRouter} from 'next/router';
import {DashboardLayout} from '../../components/DashboardLayout';
import {DomainsSettings} from '../../components/DomainsSettings';
import {BillingLimits} from '../../components/BillingLimits';
import {BillingConsumption} from '../../components/BillingConsumption';
import {BillingInvoices} from '../../components/BillingInvoices';
import {UnpaidInvoiceBanner} from '../../components/UnpaidInvoiceBanner';
import {ApiKeyDisplay} from '../../components/ApiKeyDisplay';
import {SmtpSettings} from '../../components/SmtpSettings';
import {DataManagementSettings} from '../../components/DataManagementSettings';
import {TeamSettings} from '../../components/TeamSettings';
import {useActiveProject} from '../../lib/contexts/ActiveProjectProvider';
import {network} from '../../lib/network';
import {useProjects} from '../../lib/hooks/useProject';
import {useConfig} from '../../lib/hooks/useConfig';
import {useUser} from '../../lib/hooks/useUser';
import useSWR from 'swr';

type TabId = 'general' | 'billing' | 'domains' | 'smtp' | 'data' | 'team';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof SettingsIcon;
  condition?: boolean;
}

const buildTabs = (options: {billingEnabled: boolean; smtpEnabled: boolean}): Tab[] => {
  const {billingEnabled, smtpEnabled} = options;
  const allTabs: Tab[] = [
    {id: 'general', label: 'General', icon: SettingsIcon},
    {id: 'team', label: 'Team', icon: Users},
    {id: 'billing', label: 'Billing', icon: CreditCard, condition: billingEnabled},
    {id: 'domains', label: 'Domains', icon: Globe},
    {id: 'smtp', label: 'SMTP', icon: Mail, condition: smtpEnabled},
    {id: 'data', label: 'Data', icon: Database},
  ];
  return allTabs.filter(tab => tab.condition !== false);
};

export default function Settings() {
  const router = useRouter();
  const {activeProject, setActiveProject} = useActiveProject();
  const {mutate: projectsMutate} = useProjects();
  const {data: config} = useConfig();
  const {data: user} = useUser();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  // Fetch current user's membership for the active project
  const {data: membershipData} = useSWR<{
    success: boolean;
    data: Array<{userId: string; email: string; role: 'OWNER' | 'ADMIN' | 'MEMBER'}>;
  }>(activeProject?.id ? `/projects/${activeProject.id}/members` : null, {revalidateOnFocus: false});

  const currentUserMembership = membershipData?.data.find(m => m.userId === user?.id);
  const currentUserRole = currentUserMembership?.role || 'MEMBER';

  const billingEnabled = config?.features.billing.enabled ?? false;
  const smtpEnabled = config?.features.smtp.enabled ?? false;
  const trackingToggleEnabled = config?.features.email.trackingToggleEnabled ?? false;
  const smtpConfig = smtpEnabled
    ? {
        enabled: true as const,
        domain: config?.features.smtp.domain ?? undefined,
        portSecure: config?.features.smtp.ports?.secure,
        portSubmission: config?.features.smtp.ports?.submission,
      }
    : {enabled: false as const};

  // Get current tab from URL or default to 'general'
  const currentTab = (router.query.tab as TabId) || 'general';

  // Set default tab in URL if none is present
  useEffect(() => {
    if (!router.query.tab && router.isReady) {
      router.replace('/settings?tab=general', undefined, {shallow: true});
    }
  }, [router]);

  // Handler to change tabs and update URL
  const handleTabChange = (newTab: string) => {
    router.push(`/settings?tab=${newTab}`, undefined, {shallow: true});
  };

  // Handle Stripe redirect success/cancel messages
  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.success === 'true') {
      // Use setTimeout to defer state update, avoiding synchronous setState in effect
      const timer = setTimeout(() => {
        setSuccessMessage('Subscription activated successfully! It may take a moment to update.');
        // Clear message and URL after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          router.replace('/settings?tab=billing', undefined, {shallow: true});
        }, 5000);
      }, 0);
      return () => clearTimeout(timer);
    } else if (router.query.canceled === 'true') {
      // Use setTimeout to defer state update, avoiding synchronous setState in effect
      const timer = setTimeout(() => {
        setErrorMessage('Checkout was canceled. You can try again anytime.');
        // Clear message and URL after 5 seconds
        setTimeout(() => {
          setErrorMessage(null);
          router.replace('/settings?tab=billing', undefined, {shallow: true});
        }, 5000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const form = useForm<z.infer<typeof ProjectSchemas.update>>({
    resolver: zodResolver(ProjectSchemas.update),
    defaultValues: {
      name: activeProject?.name || '',
      tracking: activeProject?.tracking ?? TrackingMode.ENABLED,
    },
  });

  // Update form when active project changes
  useEffect(() => {
    if (activeProject) {
      form.reset({
        name: activeProject.name,
        tracking: activeProject.tracking ?? TrackingMode.ENABLED,
      });
    }
  }, [activeProject, form]);

  const onSubmit = async (values: z.infer<typeof ProjectSchemas.update>) => {
    if (!activeProject) return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedProject = await network.fetch<typeof activeProject, typeof ProjectSchemas.update>(
        'PATCH',
        `/users/@me/projects/${activeProject.id}`,
        values,
      );

      // Update the active project in context
      setActiveProject(updatedProject);

      // Refresh projects list
      await projectsMutate();

      setSuccessMessage('Project settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update project settings');
    }
  };

  const handleRegenerateKeys = async () => {
    if (!activeProject) return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedProject = await network.fetch<typeof activeProject>(
        'POST',
        `/users/@me/projects/${activeProject.id}/regenerate-keys`,
      );

      // Update the active project in context
      setActiveProject(updatedProject);

      // Refresh projects list
      await projectsMutate();

      setSuccessMessage('API keys regenerated successfully');
      setShowRegenerateDialog(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to regenerate API keys');
      setShowRegenerateDialog(false);
    }
  };

  const promptRegenerateKeys = () => {
    setShowRegenerateDialog(true);
  };

  const handleStartSubscription = async () => {
    if (!activeProject) return;
    if (!billingEnabled) {
      setErrorMessage('Billing is disabled on this instance.');
      return;
    }

    try {
      setIsLoadingBilling(true);
      setErrorMessage(null);

      const response = await network.fetch<{url: string}>('POST', `/users/@me/projects/${activeProject.id}/checkout`);

      // Redirect to Stripe checkout
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start checkout');
      setIsLoadingBilling(false);
    }
  };

  const handleManageBilling = async () => {
    if (!activeProject) return;
    if (!billingEnabled) {
      setErrorMessage('Billing is disabled on this instance.');
      return;
    }

    try {
      setIsLoadingBilling(true);
      setErrorMessage(null);

      const response = await network.fetch<{url: string}>(
        'POST',
        `/users/@me/projects/${activeProject.id}/billing-portal`,
      );

      // Redirect to Stripe billing portal
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open billing portal');
      setIsLoadingBilling(false);
    }
  };

  const handleResetProject = async () => {
    if (!activeProject || resetConfirmText !== 'RESET') return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      await network.fetch('POST', `/users/@me/projects/${activeProject.id}/reset`);

      setSuccessMessage('Project reset successfully. All data has been cleared.');
      setShowResetDialog(false);
      setResetConfirmText('');

      // Refresh the page to reload data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reset project');
      setShowResetDialog(false);
      setResetConfirmText('');
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject || deleteConfirmText !== 'DELETE') return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      await network.fetch('DELETE', `/users/@me/projects/${activeProject.id}`);

      setSuccessMessage('Project deleted successfully. Redirecting...');
      setShowDeleteDialog(false);
      setDeleteConfirmText('');

      // Refresh projects list and redirect to dashboard
      await projectsMutate();

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete project');
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    }
  };

  if (!activeProject) {
    return (
      <>
        <NextSeo title="Settings" />
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <p className="text-neutral-500">No project selected</p>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <NextSeo title="Settings" />
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
            <p className="text-neutral-500 mt-2">Manage your project settings and preferences</p>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="max-w-4xl">
            <TabsList>
              {buildTabs({billingEnabled, smtpEnabled}).map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2" title={tab.label}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                  <CardDescription>Update your project name and basic information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({field}) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Awesome Project" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email Tracking Mode - only show if feature is available */}
                      {trackingToggleEnabled && (
                        <FormField
                          control={form.control}
                          name="tracking"
                          render={({field}) => (
                            <FormItem>
                              <FormLabel>Email Tracking</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tracking mode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItemWithDescription
                                    value={TrackingMode.ENABLED}
                                    title="Enabled"
                                    description="Track opens and clicks for all emails"
                                  />
                                  <SelectItemWithDescription
                                    value={TrackingMode.DISABLED}
                                    title="Disabled"
                                    description="No tracking for any emails"
                                  />
                                  <SelectItemWithDescription
                                    value={TrackingMode.MARKETING_ONLY}
                                    title="Marketing Only"
                                    description="Track only campaigns and workflow emails, not transactional"
                                  />
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Control how email opens and clicks are tracked for this project.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="flex justify-end">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>

                      {/* Success/Error Messages */}
                      <AnimatePresence mode="wait">
                        {successMessage && (
                          <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0}}
                            className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                          >
                            {successMessage}
                          </motion.div>
                        )}
                        {errorMessage && (
                          <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0}}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                          >
                            {errorMessage}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* API Keys - Separate Card */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>API Credentials</CardTitle>
                      <CardDescription>Use these keys to integrate with the Plunk API</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={promptRegenerateKeys}>
                      Regenerate Keys
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ApiKeyDisplay
                    label="Public API Key"
                    value={activeProject.public}
                    description="Use this key for client-side integrations"
                  />
                  <ApiKeyDisplay
                    label="Secret API Key"
                    value={activeProject.secret}
                    description="Keep this key secure and never expose it publicly"
                    isSecret
                  />
                </CardContent>
              </Card>

              {/* Danger Zone - Separate Card */}
              <Card className="border-red-200 mt-6">
                <CardHeader className="border-b border-red-100 bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-900">Danger Zone</CardTitle>
                      <CardDescription className="text-red-700">
                        Irreversible actions that affect your project data
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Reset Project */}
                  <div className="group">
                    <div className="flex items-start justify-between gap-4 p-5 rounded-lg border border-neutral-200 bg-white transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-orange-600" />
                          <h4 className="font-semibold text-neutral-900">Reset Project Data</h4>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3">
                          Clear all campaigns, contacts, workflows, templates, and events. This gives you a blank
                          project to start fresh.
                        </p>
                        <div className="flex items-start gap-2 text-xs text-neutral-500">
                          <span className="font-medium">Preserved:</span>
                          <span>API keys, domains, billing information</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowResetDialog(true)}
                        className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                      >
                        Reset Data
                      </Button>
                    </div>
                  </div>

                  {/* Delete Project */}
                  <div className="group">
                    <div className="flex items-start justify-between gap-4 p-5 rounded-lg border-2 border-red-200 bg-red-50/50 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <h4 className="font-semibold text-red-900">Delete Project Permanently</h4>
                        </div>
                        <p className="text-sm text-red-800 mb-3">
                          Permanently delete this project and all associated data. This action{' '}
                          <strong>cannot be undone</strong>.
                          {activeProject?.subscription && ' Your subscription will be canceled.'}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                            Permanent Deletion
                          </span>
                          <span className="text-red-600">All data will be lost</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="shrink-0"
                      >
                        Delete Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <div className="space-y-6">
                {/* Unpaid Invoice Banner */}
                <UnpaidInvoiceBanner projectId={activeProject.id} hasSubscription={!!activeProject.subscription} />

                <Card>
                  <CardHeader>
                    <CardTitle>Billing & Subscription</CardTitle>
                    <CardDescription>Manage your subscription and billing information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Success/Error Messages */}
                      <AnimatePresence mode="wait">
                        {successMessage && (
                          <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0}}
                            className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                          >
                            {successMessage}
                          </motion.div>
                        )}
                        {errorMessage && (
                          <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0}}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                          >
                            {errorMessage}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {activeProject.subscription ? (
                        // Has subscription - show billing portal button
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="font-medium">Active Subscription</span>
                            </div>
                            <p className="text-sm text-green-700">
                              Your subscription is active. Manage your billing details, update payment methods, or
                              cancel your subscription through the billing portal.
                            </p>
                          </div>

                          <div className="flex justify-start">
                            <Button onClick={handleManageBilling} disabled={isLoadingBilling}>
                              {isLoadingBilling ? 'Loading...' : 'Manage Billing'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // No subscription - show start subscription button
                        <div className="space-y-4">
                          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                            <div className="flex items-center gap-2 text-neutral-800 mb-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="font-medium">No Active Subscription</span>
                            </div>
                            <p className="text-sm text-neutral-600">
                              Start a subscription and support the development of Plunk. You will be charged a one-time
                              onboarding fee which will be credited to your first invoice.
                            </p>
                          </div>

                          <div className="flex justify-start">
                            <Button onClick={handleStartSubscription} disabled={isLoadingBilling}>
                              {isLoadingBilling ? 'Loading...' : 'Start Subscription'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Limits */}
                <BillingLimits
                  projectId={activeProject.id}
                  hasSubscription={!!activeProject.subscription}
                  billingEnabled={billingEnabled}
                />

                {/* Current Month Consumption */}
                <BillingConsumption projectId={activeProject.id} hasSubscription={!!activeProject.subscription} />

                {/* Past Invoices */}
                <BillingInvoices
                  projectId={activeProject.id}
                  hasSubscription={!!activeProject.subscription}
                  onManageBilling={handleManageBilling}
                />
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team">
              <TeamSettings
                projectId={activeProject.id}
                currentUserRole={currentUserRole}
                currentUserId={user?.id || ''}
              />
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains">
              <DomainsSettings projectId={activeProject.id} />
            </TabsContent>

            {/* SMTP Tab */}
            <TabsContent value="smtp">
              <SmtpSettings smtpConfig={smtpConfig} />
            </TabsContent>

            {/* Data Management Tab */}
            <TabsContent value="data">
              <DataManagementSettings />
            </TabsContent>
          </Tabs>
        </div>

        {/* Regenerate Keys Confirmation Dialog */}
        <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Regenerate API Keys
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <p>Are you sure you want to regenerate your API keys?</p>
                <Alert className="bg-orange-50 border-orange-200 text-orange-900 text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <div className="ml-2">
                    <strong>Warning:</strong> This action will immediately invalidate your current API keys. Any
                    applications using the old keys will stop working until you update them with the new keys.
                  </div>
                </Alert>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleRegenerateKeys} className="bg-orange-600 hover:bg-orange-700">
                Regenerate Keys
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Project Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <DialogTitle className="text-center text-xl">Reset Project Data?</DialogTitle>
              <DialogDescription className="text-center text-base">
                All your campaigns, contacts, workflows, and templates will be permanently deleted. Your API keys and
                settings will remain intact.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-sm font-medium text-neutral-700 block mb-2 text-center">
                Type{' '}
                <span className="font-mono font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">RESET</span>{' '}
                to confirm
              </label>
              <Input
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                placeholder="Type RESET here"
                className="text-center"
                autoFocus
              />
            </div>

            <DialogFooter className="flex-col-reverse gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirmText('');
                }}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetProject}
                disabled={resetConfirmText !== 'RESET'}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                Reset Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Project Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-center text-xl">Delete Project Permanently?</DialogTitle>
              <DialogDescription className="text-center text-base space-y-2">
                <p>
                  This will <strong className="text-red-600">permanently delete</strong> your entire project and all
                  data. This action cannot be undone.
                </p>
                {activeProject?.subscription && (
                  <p className="text-sm text-red-700 bg-red-50 rounded p-2 border border-red-200">
                    Your active subscription will be canceled
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-sm font-medium text-neutral-700 block mb-2 text-center">
                Type <span className="font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">DELETE</span>{' '}
                to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="text-center"
                autoFocus
              />
            </div>

            <DialogFooter className="flex-col-reverse gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteProject}
                disabled={deleteConfirmText !== 'DELETE'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Delete Forever
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
