import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@plunk/ui';
import {AlertCircle, Mail, Send, TrendingUp, Users} from 'lucide-react';
import {NextSeo} from 'next-seo';
import Link from 'next/link';
import {useState} from 'react';
import {ApiKeyDisplay} from '../components/ApiKeyDisplay';
import {DashboardLayout} from '../components/DashboardLayout';
import {QuickStart} from '../components/QuickStart';
import {SecurityWarningBanner} from '../components/SecurityWarningBanner';
import {useActiveProject} from '../lib/contexts/ActiveProjectProvider';
import {useDashboardStats} from '../lib/hooks/useDashboardStats';
import {useOnboardingPath} from '../lib/hooks/useOnboardingPath';
import {useOnboardingStatus} from '../lib/hooks/useOnboardingStatus';
import {useProjectSetupState} from '../lib/hooks/useProjectSetupState';
import {useProjectSecurity} from '../lib/hooks/useProjectSecurity';
import {useConfig} from '../lib/hooks/useConfig';
import {useUser} from '../lib/hooks/useUser';
import {network} from '../lib/network';

export default function Index() {
  const {activeProject} = useActiveProject();
  const {totalContacts, totalEmailsSent, totalCampaigns, openRate, isLoading} = useDashboardStats();
  const {setupState, isLoading: isLoadingSetupState} = useProjectSetupState(activeProject?.id);
  const {securityMetrics} = useProjectSecurity(activeProject?.id);
  const {data: config} = useConfig();
  const {data: user} = useUser();
  const onboardingStatus = useOnboardingStatus();
  const {path: onboardingPath} = useOnboardingPath(activeProject?.id);
  const bannerActive = onboardingStatus === 'show' && Boolean(onboardingPath);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  const stats = [
    {
      name: 'Total Contacts',
      value: totalContacts.toLocaleString(),
      icon: Users,
    },
    {
      name: 'Emails Sent',
      value: totalEmailsSent.toLocaleString(),
      icon: Mail,
    },
    {
      name: 'Campaigns',
      value: totalCampaigns.toLocaleString(),
      icon: Send,
    },
    {
      name: 'Open Rate',
      value: `${openRate.toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  async function handleResendVerification() {
    setIsResending(true);
    setResendMessage('');
    try {
      const response = await network.fetch<{success: boolean}>('POST', '/auth/request-verification');

      if (response.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage('Failed to send verification email. Please try again.');
      }
    } catch {
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

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
              <AlertDescription className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium">
                    This project has been disabled due to security violations. All scheduled campaigns and workflows
                    have been cancelled. The project is now in read-only mode - you can view your data but cannot
                    create, update, or delete anything.
                  </p>
                  {securityMetrics && securityMetrics.status.violations.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-3">Security violations that caused suspension:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                        {securityMetrics.status.violations.map((violation, idx) => (
                          <li key={idx}>{violation}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="text-xs text-red-800 mt-2">
                    Please contact support to resolve this issue and get your project re-enabled.
                  </p>
                </div>
                <Link href="/settings?tab=security">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto flex-shrink-0">
                    View Details
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Email Verification Banner */}
          {user && user.type === 'PASSWORD' && !user.emailVerified && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verify your email address</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-sm">
                  Please verify your email address to unlock all features. Check your inbox for the verification link.
                </span>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handleResendVerification}
                    disabled={isResending}
                  >
                    {isResending ? 'Sending...' : 'Resend verification email'}
                  </Button>
                  {resendMessage && (
                    <p className={`text-xs ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
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
                    <CardTitle className="text-2xl tabular-nums">
                      {isLoading ? (
                        <div className="h-7 w-16 bg-neutral-100 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions & API Keys */}
          <div className={`grid grid-cols-1 gap-6 ${bannerActive ? '' : 'lg:grid-cols-2'}`}>
            {/* Quick Start — hidden when the persistent onboarding banner is guiding the user */}
            {!bannerActive && <QuickStart setupState={setupState} isLoading={isLoadingSetupState} />}

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
