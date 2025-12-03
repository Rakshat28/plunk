import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle} from '@plunk/ui';
import {BookOpen, CheckCircle2, Mail, MessageCircle, Shield, Users, Zap} from 'lucide-react';
import Link from 'next/link';
import {useMemo} from 'react';
import {LANDING_URI, WIKI_URI} from '../lib/constants';
import type {ProjectSetupState} from '../lib/hooks/useProjectSetupState';
import {useConfig} from '../lib/hooks/useConfig';

interface QuickStartStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkText: string;
  isCompleted: boolean;
}

interface QuickStartProps {
  setupState: ProjectSetupState | undefined;
  isLoading: boolean;
}

// Help resources that always appear
function HelpResources() {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-200">
      <p className="text-xs font-medium text-neutral-500 mb-3">Need help?</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href={WIKI_URI} target="_blank" className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all">
            <BookOpen className="h-3.5 w-3.5" />
            Documentation
          </button>
        </Link>
        <Link href={`${LANDING_URI}/discord`} target="_blank" className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all">
            <MessageCircle className="h-3.5 w-3.5" />
            Join Discord
          </button>
        </Link>
      </div>
    </div>
  );
}

export function QuickStart({setupState, isLoading}: QuickStartProps) {
  // Calculate days since last campaign using useMemo to avoid impure function during render
  // Must be called before any early returns to follow Rules of Hooks
  const daysSinceLastCampaign = useMemo(() => {
    if (!setupState || !setupState.lastCampaignSentAt) return null;
    const now = new Date();
    const lastSent = new Date(setupState.lastCampaignSentAt);
    return Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
  }, [setupState]);

  const {data: config} = useConfig();
  const billingEnabled = config?.features.billing.enabled ?? false;

  if (isLoading || !setupState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get started with Plunk in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50/50 animate-pulse"
              >
                <div className="h-10 w-10 rounded-lg bg-neutral-200" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-neutral-200 rounded w-1/3" />
                  <div className="h-3 bg-neutral-200 rounded w-2/3" />
                </div>
                <div className="h-9 w-20 bg-neutral-200 rounded-lg" />
              </div>
            ))}
          </div>
          <HelpResources />
        </CardContent>
      </Card>
    );
  }

  const hasContacts = setupState.contactCount > 0;
  const hasSentCampaign = setupState.lastCampaignSentAt !== null;
  const hasRecentCampaign = daysSinceLastCampaign !== null && daysSinceLastCampaign <= 30;

  // Build dynamic steps based on setup state with proper prioritization
  // Priority order: Domain → Contacts → Campaign → Workflow → Subscription
  const allSteps: QuickStartStep[] = [];

  // Priority 1: Domain verification (critical for deliverability)
  if (!setupState.hasVerifiedDomain) {
    allSteps.push({
      id: 'domain',
      icon: Shield,
      title: 'Verify Your Domain',
      description: 'Essential for email deliverability and avoiding spam',
      link: '/settings?tab=domains',
      linkText: 'Add Domain',
      isCompleted: false,
    });
  }

  // Priority 2: Add contacts (can't send without contacts)
  if (!hasContacts) {
    allSteps.push({
      id: 'contacts',
      icon: Users,
      title: 'Add Your First Contacts',
      description: 'Import your subscriber list to start sending emails',
      link: '/contacts',
      linkText: 'Add Contacts',
      isCompleted: false,
    });
  }

  // Priority 3: Send campaign (core functionality, show if they have contacts but never sent)
  if (hasContacts && !hasSentCampaign) {
    allSteps.push({
      id: 'campaign',
      icon: Mail,
      title: 'Send Your First Campaign',
      description: 'Create and send your first email campaign',
      link: '/campaigns',
      linkText: 'Create Campaign',
      isCompleted: false,
    });
  }

  // Priority 4: Set up automation (advanced feature, only show if no workflow and have contacts)
  if (hasContacts && !setupState.hasEnabledWorkflow) {
    allSteps.push({
      id: 'workflows',
      icon: Zap,
      title: 'Set Up Automation',
      description: 'Create automated workflows to engage your audience',
      link: '/workflows',
      linkText: 'Create Workflow',
      isCompleted: false,
    });
  }

  // Priority 5: Subscription (nice to have, lower priority)
  if (billingEnabled && !setupState.hasSubscription) {
    allSteps.push({
      id: 'subscription',
      icon: Shield,
      title: 'Upgrade Your Plan',
      description: 'Remove Plunk branding and unlock more features',
      link: '/settings?tab=billing',
      linkText: 'Upgrade',
      isCompleted: false,
    });
  }

  // Priority 6: Re-engagement (show if they've been inactive)
  if (hasSentCampaign && !hasRecentCampaign && daysSinceLastCampaign !== null && daysSinceLastCampaign > 30) {
    allSteps.push({
      id: 'campaign-reengagement',
      icon: Mail,
      title: 'Re-engage Your Audience',
      description: `It's been ${daysSinceLastCampaign} days since your last campaign`,
      link: '/campaigns',
      linkText: 'Create Campaign',
      isCompleted: false,
    });
  }

  // If core setup is complete and they're actively sending, show success message
  if (setupState.hasVerifiedDomain && hasContacts && hasSentCampaign && hasRecentCampaign) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Your project is fully set up</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="h-10 w-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-700" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-semibold text-green-900 mb-1">All set!</p>
              <p className="text-xs text-green-700 leading-relaxed">
                Your project is fully configured and you&apos;re actively engaging your audience. Keep up the great
                work!
              </p>
            </div>
          </div>
          <HelpResources />
        </CardContent>
      </Card>
    );
  }

  // Show only the first 3 most important steps
  const visibleSteps = allSteps.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start</CardTitle>
        <CardDescription>
          {visibleSteps.length === 0 ? 'Your project is set up' : 'Get started with Plunk in minutes'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleSteps.map(step => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="group relative flex items-start gap-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
              >
                <div
                  className={`h-10 w-10 rounded-lg ${step.isCompleted ? 'bg-green-100 border border-green-200' : 'bg-white border border-neutral-200'} flex items-center justify-center flex-shrink-0 transition-colors`}
                >
                  <Icon
                    className={`h-5 w-5 ${step.isCompleted ? 'text-green-700' : 'text-neutral-600'} transition-colors`}
                  />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                    {step.isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{step.description}</p>
                </div>
                <Link href={step.link} className="flex-shrink-0">
                  <Button
                    size="sm"
                    variant={step.isCompleted ? 'outline' : 'default'}
                    className="h-9 transition-all group-hover:shadow-sm"
                  >
                    {step.linkText}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
        <HelpResources />
      </CardContent>
    </Card>
  );
}
