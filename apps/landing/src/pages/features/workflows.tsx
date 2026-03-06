import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {ArrowRight, Clock, GitBranch, Mail, RefreshCw, UserPlus, Webhook, Zap} from 'lucide-react';
import Head from 'next/head';

const features = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Event-Driven Triggers',
    description: 'Start workflows automatically when users sign up, make a purchase, or perform any custom action.',
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Smart Email Sequences',
    description: 'Send personalized emails at the right time with dynamic content based on user data.',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Time-Based Delays',
    description: 'Add strategic delays between steps to create perfectly timed email journeys. Patience is a virtue.',
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: 'Conditional Logic',
    description: 'Branch workflows based on user behavior, attributes, or engagement to personalize every journey.',
  },
  {
    icon: <Webhook className="h-5 w-5" />,
    title: 'External Integrations',
    description: 'Connect to external systems with webhooks to sync data or trigger actions outside of Plunk.',
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    title: 'Re-entry Control',
    description: 'Decide whether contacts can enter workflows multiple times or just once. No spam, just strategy.',
  },
];

const useCases = [
  {
    icon: <UserPlus className="h-6 w-6" />,
    title: 'User Onboarding',
    description:
      'Welcome new users with a personalized email series that guides them through your product features and helps them get started.',
    example: 'Trigger on signup → Send welcome email → Wait 2 days → Send getting started tips',
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'Abandoned Cart Recovery',
    description:
      'Automatically remind customers about items left in their cart with timely follow-ups and special incentives. Those forgotten items need a gentle nudge.',
    example: 'Trigger on cart abandoned → Wait 1 hour → Send reminder → Wait 1 day → Send discount offer',
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: 'Re-engagement Campaigns',
    description:
      'Win back inactive users with targeted campaigns based on their last activity and engagement patterns.',
    example: 'Trigger on 30 days inactive → Check if opened last email → Yes: Send update / No: Send special offer',
  },
];

/**
 *
 */
export default function WorkflowsFeature() {
  return (
    <>
      <Head>
        <title>Email Workflow Automation | Plunk</title>
        <meta
          name="description"
          content="Build sophisticated email automation workflows with visual no-code builder. Create event-driven sequences, conditional branching, and time-based delays."
        />
        <meta property="og:title" content="Email Workflow Automation - Automate Your Email Marketing | Plunk" />
        <meta
          property="og:description"
          content="Build sophisticated email automation workflows with visual no-code builder. Create event-driven sequences, conditional branching, and time-based delays."
        />
      </Head>

      <Navbar />

      <main className={'mx-auto max-w-7xl px-8 sm:px-0'}>
        {/* Hero Section */}
        <section className={'relative py-20 sm:py-32'}>
          {/* Subtle background grid */}
          <div
            className={
              'absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]'
            }
          />

          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <div className={'mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm'}>
              <Zap className="h-4 w-4 text-neutral-600" />
              <span className={'font-medium text-neutral-600'}>Workflow Automation</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Automate Your Email Marketing
            </h1>
            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Turn events into personalized email journeys. Build sophisticated automation workflows with our visual
              no-code builder.
            </p>

            <div className={'mt-12 flex flex-wrap justify-center gap-4'}>
              <motion.a
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                href={`${DASHBOARD_URI}/auth/signup`}
                className={
                  'group rounded-lg bg-neutral-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-neutral-900/10 transition hover:bg-neutral-800'
                }
              >
                <span className={'flex items-center gap-2'}>
                  Start building workflows
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.a>
              <Link
                href={WIKI_URI}
                target={'_blank'}
                className={
                  'rounded-lg border border-neutral-300 bg-white px-8 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'
                }
              >
                View documentation
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>
              Everything you need for email automation
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Powerful features that make complex automations simple</p>
          </motion.div>

          <div className={'grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3'}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'group bg-white p-10 transition hover:bg-neutral-50'}
              >
                <div
                  className={
                    'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                  }
                >
                  {feature.icon}
                </div>
                <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>{feature.title}</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>
              Visual workflow builder
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Create complex email automations without writing a single line of code
            </p>
          </motion.div>

          <div className={'mx-auto mt-16 max-w-5xl'}>
            <div className={'grid gap-8 lg:grid-cols-3'}>
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div
                  className={
                    'flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-xl font-bold text-neutral-900'
                  }
                >
                  1
                </div>
                <h3 className={'mt-4 text-lg font-semibold text-neutral-900'}>Choose a trigger</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>
                  Select an event that starts your workflow, like user signup, purchase, or any custom action you track.
                </p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div
                  className={
                    'flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-xl font-bold text-neutral-900'
                  }
                >
                  2
                </div>
                <h3 className={'mt-4 text-lg font-semibold text-neutral-900'}>Build your flow</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>
                  Drag and drop steps to create your workflow. Add emails, delays, conditions, webhooks, and more.
                </p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div
                  className={
                    'flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-xl font-bold text-neutral-900'
                  }
                >
                  3
                </div>
                <h3 className={'mt-4 text-lg font-semibold text-neutral-900'}>Activate and monitor</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>
                  Enable your workflow and watch it run automatically. Monitor executions in real-time with full
                  visibility.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>
              Built for every use case
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>From onboarding to re-engagement, workflows handle it all</p>
          </motion.div>

          <div className={'mx-auto max-w-5xl space-y-8'}>
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div className={'flex items-start gap-6'}>
                  <div
                    className={
                      'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white'
                    }
                  >
                    {useCase.icon}
                  </div>
                  <div className={'flex-1'}>
                    <h3 className={'text-xl font-semibold text-neutral-900'}>{useCase.title}</h3>
                    <p className={'mt-2 text-neutral-600'}>{useCase.description}</p>
                    <div className={'mt-4 rounded-lg bg-neutral-50 p-4'}>
                      <p className={'font-mono text-sm text-neutral-700'}>{useCase.example}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={'border-t border-neutral-200 py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>
              Ready to automate your emails?
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Start building powerful workflows today. No credit card required.
            </p>
            <div className={'mt-12 flex flex-wrap justify-center gap-4'}>
              <motion.a
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                href={`${DASHBOARD_URI}/auth/signup`}
                className={
                  'rounded-lg bg-neutral-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800'
                }
              >
                Get started for free
              </motion.a>
              <Link
                href={'/pricing'}
                className={
                  'rounded-lg border border-neutral-300 px-8 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'
                }
              >
                View pricing
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
