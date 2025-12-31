import {Heading, Link, Section, Text} from '@react-email/components';
import * as React from 'react';
import {EmailLayout} from '../common/EmailLayout';
import {Footer} from '../common/Footer';
import {Header} from '../common/Header';

interface ProjectDisabledEmailProps {
  projectName: string;
  projectId: string;
  violations: string[];
  dashboardUrl?: string;
  landingUrl?: string;
}

export function ProjectDisabledEmail({
  projectName = 'My Project',
  projectId = 'proj_example123',
  violations = ['Bounce rate exceeded 10% threshold', 'Complaint rate exceeded 0.5% threshold'],
  dashboardUrl = 'https://next-app.useplunk.com',
  landingUrl = 'https://next.useplunk.com',
}: ProjectDisabledEmailProps) {
  return (
    <EmailLayout>
      <Header />

      <Section className="px-8 pb-10 pt-10">
        <Heading className="mb-2 mt-0 text-2xl font-semibold tracking-tight text-gray-900">Project disabled</Heading>

        <Text className="mb-8 mt-0 text-base leading-relaxed text-gray-600">
          Your project <strong className="font-medium text-gray-900">{projectName}</strong> has been automatically
          disabled to protect your sender reputation.
        </Text>

        <Section className="mb-8 overflow-hidden rounded-lg" style={{border: '1px solid #e5e7eb'}}>
          <Section className="bg-gray-50 px-6 py-4">
            <Text className="mb-0 mt-0 text-xs font-medium uppercase tracking-wider text-gray-500">
              Issues detected
            </Text>
          </Section>
          <Section className="px-6 py-6">
            {violations.map((violation, index) => (
              <Section key={index} className="mb-3 last:mb-0">
                <Text className="mb-0 mt-0 text-sm leading-relaxed text-gray-700">{violation}</Text>
              </Section>
            ))}
          </Section>
        </Section>

        <Section className="mb-8 rounded-lg bg-red-50 px-6 py-4" style={{border: '1px solid #fca5a5'}}>
          <Text className="mb-0 mt-0 text-sm leading-relaxed text-red-900">
            High bounce or complaint rates can severely damage your sender reputation and email deliverability. We've
            disabled your project to prevent further issues.
          </Text>
        </Section>

        <Heading className="mb-4 mt-0 text-lg font-semibold text-gray-900">Steps to restore your project</Heading>

        <Section className="mb-8">
          <Section className="mb-3">
            <Text className="mb-1 mt-0 text-sm font-medium text-gray-900">Review your email lists</Text>
            <Text className="mb-0 mt-0 text-sm leading-relaxed text-gray-600">
              Remove invalid or unengaged contacts
            </Text>
          </Section>

          <Section className="mb-3">
            <Text className="mb-1 mt-0 text-sm font-medium text-gray-900">Verify recipient consent</Text>
            <Text className="mb-0 mt-0 text-sm leading-relaxed text-gray-600">
              Ensure you have proper consent from all recipients
            </Text>
          </Section>

          <Section>
            <Text className="mb-1 mt-0 text-sm font-medium text-gray-900">Check email content</Text>
            <Text className="mb-0 mt-0 text-sm leading-relaxed text-gray-600">
              Verify your content follows best practices and isn't triggering spam filters
            </Text>
          </Section>
        </Section>

        <Section className="mb-6">
          <Link
            href={dashboardUrl}
            className="inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white no-underline"
          >
            View project dashboard
          </Link>
        </Section>
      </Section>

      <Footer projectId={projectId} landingUrl={landingUrl} />
    </EmailLayout>
  );
}

export default ProjectDisabledEmail;
