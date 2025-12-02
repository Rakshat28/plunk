import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {ProjectSchemas} from '@plunk/shared';
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
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@plunk/ui';
import {AnimatePresence, motion} from 'framer-motion';
import {NextSeo} from 'next-seo';
import {AlertTriangle, CreditCard, Database, Globe, Mail, Settings as SettingsIcon} from 'lucide-react';
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
import {useActiveProject} from '../../lib/contexts/ActiveProjectProvider';
import {network} from '../../lib/network';
import {useProjects} from '../../lib/hooks/useProject';
import {useConfig} from '../../lib/hooks/useConfig';

type TabId = 'general' | 'billing' | 'domains' | 'smtp' | 'data';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

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
      trackingEnabled: activeProject?.trackingEnabled ?? true,
    },
  });

  // Update form when active project changes
  useEffect(() => {
    if (activeProject) {
      form.reset({
        name: activeProject.name,
        trackingEnabled: activeProject.trackingEnabled ?? true,
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
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
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

                    {/* Email Tracking Toggle - only show if feature is available */}
                    {trackingToggleEnabled && (
                      <FormField
                        control={form.control}
                        name="trackingEnabled"
                        render={({field}) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-neutral-200 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Tracking</FormLabel>
                              <FormDescription>
                                Enable open and click tracking for emails sent from this project. When disabled, emails
                                will be sent without tracking pixels.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>

                    {/* API Keys */}
                    <div className="space-y-4 pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-neutral-900">API Keys</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={promptRegenerateKeys}
                          className="text-xs"
                        >
                          Regenerate Keys
                        </Button>
                      </div>
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
                            Your subscription is active. Manage your billing details, update payment methods, or cancel
                            your subscription through the billing portal.
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
                            Start a subscription to unlock premium features and support the development of Plunk.
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
              <BillingLimits projectId={activeProject.id} hasSubscription={!!activeProject.subscription} />

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
    </DashboardLayout>
    </>
  );
}
