import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {BillingLimitSchemas} from '@plunk/shared';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Progress,
} from '@plunk/ui';
import {AlertCircle, AlertTriangle, Check} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import type {z} from 'zod';
import {useBillingLimits, type BillingLimitsData, type CategoryLimit} from '../lib/hooks/useBillingLimits';
import {network} from '../lib/network';

interface BillingLimitsProps {
  projectId: string;
  hasSubscription: boolean;
}

type LimitsFormValues = z.infer<typeof BillingLimitSchemas.update>;

export function BillingLimits({projectId, hasSubscription}: BillingLimitsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch billing limits using SWR
  const {limitsData, isLoading, mutate} = useBillingLimits(projectId, hasSubscription);

  const form = useForm<LimitsFormValues>({
    resolver: zodResolver(BillingLimitSchemas.update),
    defaultValues: {
      workflows: null,
      campaigns: null,
      transactional: null,
    },
  });

  // Update form when limits data changes
  useEffect(() => {
    if (limitsData) {
      form.reset({
        workflows: limitsData.workflows.limit,
        campaigns: limitsData.campaigns.limit,
        transactional: limitsData.transactional.limit,
      });
    }
  }, [limitsData, form]);

  const onSubmit = async (values: LimitsFormValues) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      await network.fetch<BillingLimitsData, typeof BillingLimitSchemas.update>(
        'PUT',
        `/users/@me/projects/${projectId}/billing-limits`,
        values,
      );

      // Revalidate SWR cache
      await mutate();
      setIsEditing(false);
      setSuccessMessage('Billing limits updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update billing limits');
    }
  };

  const handleCancel = () => {
    if (limitsData) {
      form.reset({
        workflows: limitsData.workflows.limit,
        campaigns: limitsData.campaigns.limit,
        transactional: limitsData.transactional.limit,
      });
    }
    setIsEditing(false);
    setErrorMessage(null);
  };

  if (!hasSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Limits</CardTitle>
          <CardDescription>Set monthly limits for each email category</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <p className="text-sm">
                Billing limits are only available with an active subscription. Start a subscription to set limits for
                your email usage.
              </p>
            </div>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Limits</CardTitle>
          <CardDescription>Set monthly limits for each email category</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Limits</CardTitle>
        <CardDescription>
          Set monthly limits for each email category. Limits reset on the 1st of each month.
        </CardDescription>
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

          {/* Usage Display (when not editing) */}
          {!isEditing && limitsData && (
            <div className="space-y-4">
              <UsageDisplay category="Workflows" usage={limitsData.workflows} />
              <UsageDisplay category="Campaigns" usage={limitsData.campaigns} />
              <UsageDisplay category="Transactional" usage={limitsData.transactional} />

              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsEditing(true)}>Edit Limits</Button>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="workflows"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Workflow Emails Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Maximum workflow emails per month. Leave empty for unlimited.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="campaigns"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Campaign Emails Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Maximum campaign emails per month. Leave empty for unlimited.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactional"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Transactional Emails Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum transactional emails per month. Leave empty for unlimited.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UsageDisplayProps {
  category: string;
  usage: CategoryLimit;
}

function UsageDisplay({category, usage}: UsageDisplayProps) {
  const getStatusColor = () => {
    if (usage.isBlocked) return 'text-red-600';
    if (usage.isWarning) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (usage.isBlocked) return 'bg-red-600';
    if (usage.isWarning) return 'bg-orange-500';
    return 'bg-green-600';
  };

  const getStatusIcon = () => {
    if (usage.isBlocked) return <AlertCircle className="h-4 w-4" />;
    if (usage.isWarning) return <AlertTriangle className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const limitText = usage.limit === null ? 'Unlimited' : usage.limit.toLocaleString();

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-neutral-900">{category}</h3>
          <p className="text-sm text-neutral-500">
            {usage.usage.toLocaleString()} / {limitText} emails this month
          </p>
        </div>
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {usage.limit === null ? 'Unlimited' : `${Math.round(usage.percentage)}%`}
          </span>
        </div>
      </div>

      {usage.limit !== null && (
        <>
          <Progress value={Math.min(usage.percentage, 100)} className="h-2" indicatorClassName={getProgressColor()} />

          {usage.isBlocked && (
            <Alert className="mt-3 bg-red-50 border-red-200 text-red-900">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-xs">
                  <strong>Limit reached:</strong> No more {category.toLowerCase()} emails can be sent this month.
                </p>
              </div>
            </Alert>
          )}

          {usage.isWarning && !usage.isBlocked && (
            <Alert className="mt-3 bg-orange-50 border-orange-200 text-orange-900">
              <AlertTriangle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-xs">
                  <strong>Warning:</strong> You&apos;ve used {Math.round(usage.percentage)}% of your{' '}
                  {category.toLowerCase()} email limit.
                </p>
              </div>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
