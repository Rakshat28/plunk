import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@plunk/ui';
import {AlertCircle, Mail, Send, TrendingUp, Users} from 'lucide-react';
import {NextSeo} from 'next-seo';
import Link from 'next/link';
import {ApiKeyDisplay} from '../components/ApiKeyDisplay';
import {DashboardLayout} from '../components/DashboardLayout';
import {QuickStart} from '../components/QuickStart';
import {SecurityWarningBanner} from '../components/SecurityWarningBanner';
import {useActiveProject} from '../lib/contexts/ActiveProjectProvider';
import {useDashboardStats} from '../lib/hooks/useDashboardStats';
import {useProjectSetupState} from '../lib/hooks/useProjectSetupState';
import {useProjectSecurity} from '../lib/hooks/useProjectSecurity';
import {useConfig} from '../lib/hooks/useConfig';

export default function Index() {
  const {activeProject} = useActiveProject();
  const {totalContacts, totalEmailsSent, totalCampaigns, openRate, isLoading} = useDashboardStats();
  const {setupState, isLoading: isLoadingSetupState} = useProjectSetupState(activeProject?.id);
  const {securityMetrics} = useProjectSecurity(activeProject?.id);
  const {data: config} = useConfig();

  const stats = [
    {
      name: 'Total Contacts',
      value: isLoading ? '-' : totalContacts.toLocaleString(),
      icon: Users,
    },
    {
      name: 'Emails Sent',
      value: isLoading ? '-' : totalEmailsSent.toLocaleString(),
      icon: Mail,
    },
    {
      name: 'Campaigns',
      value: isLoading ? '-' : totalCampaigns.toLocaleString(),
      icon: Send,
    },
    {
      name: 'Open Rate',
      value: isLoading ? '-' : `${openRate.toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <NextSeo title="Dashboard" />
      <DashboardLayout>
        <div className="space-y-8">
          {/* Project Disabled Banner */}
          {activeProject && activeProject.disabled && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Project Disabled - Read-Only Mode</AlertTitle>
              <AlertDescription>
                This project has been disabled due to security violations (high bounce or complaint rates). All
                scheduled campaigns and workflows have been cancelled. The project is now in read-only mode - you can
                view your data but cannot create, update, or delete anything. Please contact support to resolve this
                issue.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Warning Banner */}
          {activeProject && !activeProject.disabled && securityMetrics && (
            <SecurityWarningBanner status={securityMetrics.status} />
          )}

          {/* Subscription Warning Banner */}
          {activeProject &&
            !activeProject.disabled &&
            !activeProject.subscription &&
            config?.features.billing.enabled && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upgrade to remove Plunk branding</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-sm">
                    Your emails currently include Plunk branding. Upgrade to a subscription to remove it.
                  </span>
                  <Link href="/settings?tab=billing">
                    <Button size="sm" className="w-full sm:w-auto">
                      Upgrade Now
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Dashboard</h1>
            <p className="text-neutral-500 mt-2 text-sm sm:text-base">
              Welcome back to {activeProject?.name || 'Plunk'}. Here&apos;s what&apos;s happening with your emails.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardDescription>{stat.name}</CardDescription>
                      <Icon className="h-4 w-4 text-neutral-500" />
                    </div>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions & API Keys */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Start */}
            <QuickStart setupState={setupState} isLoading={isLoadingSetupState} />

            {/* API Keys */}
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Use these keys to integrate with Plunk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProject ? (
                    <>
                      <ApiKeyDisplay
                        label="Public Key"
                        value={activeProject.public}
                        description="Use this key for client-side integrations"
                      />
                      <ApiKeyDisplay
                        label="Secret Key"
                        value={activeProject.secret}
                        description="Keep this key secure and never expose it publicly"
                        isSecret
                      />
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">No project selected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
