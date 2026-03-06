import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {ArrowRight, Filter, GitBranch, Mail, Target, TrendingUp, Users} from 'lucide-react';
import Head from 'next/head';

const features = [
  {
    icon: <Filter className="h-5 w-5" />,
    title: 'Dynamic Filtering',
    description:
      'Create segments based on contact data, custom fields, email activity, and events with powerful AND/OR logic.',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Real-Time Updates',
    description: 'Dynamic segments automatically update as contact data changes, always keeping your audience current.',
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: 'Workflow Integration',
    description:
      'Trigger workflows when contacts enter or exit segments, or use segment conditions in workflow branching.',
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: 'Campaign Targeting',
    description:
      'Send targeted campaigns to specific segments instead of your entire contact list. Less noise, more signal.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Static Segments',
    description: 'Manually curate contact lists for special groups like beta testers or VIP customers.',
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Behavior-Based',
    description: 'Segment by email engagement - who opened, clicked, bounced, or never received your emails.',
  },
];

const filterExamples = [
  {
    title: 'Active Users',
    description: 'Target users who signed up recently and are actively engaging',
    filters: ['Created within 30 days', 'Opened email within 7 days', 'Custom field: plan equals "pro"'],
  },
  {
    title: 'Re-engagement Needed',
    description: 'Find inactive users who need a nudge to come back. Sometimes they just need a reminder.',
    filters: ['Last activity older than 60 days', 'Email sent but not opened', 'Subscribed equals true'],
  },
  {
    title: 'High-Value Customers',
    description: 'Identify your most valuable customers for special treatment',
    filters: ['Custom field: totalSpent greater than 1000', 'Triggered event: purchase', 'Plan equals "enterprise"'],
  },
];

const useCases = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'Targeted Campaigns',
    description:
      'Send newsletters and announcements to specific audience segments instead of blasting everyone. Increase open rates by sending relevant content to the right people. Your unsubscribe rate will thank you.',
  },
  {
    icon: <GitBranch className="h-6 w-6" />,
    title: 'Behavior-Based Workflows',
    description:
      'Trigger workflows when contacts enter segments like "VIP Customers" or "Churning Users". Create personalized automations based on segment membership.',
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: 'A/B Testing',
    description:
      'Create segments for test groups and control groups. Send different campaigns to each segment and measure results.',
  },
];

/**
 *
 */
export default function SegmentsFeature() {
  return (
    <>
      <Head>
        <title>Audience Segmentation - Target the Right Contacts | Plunk</title>
        <meta
          name="description"
          content="Create dynamic and static segments to organize your contacts. Filter by behavior, attributes, and engagement. Target campaigns and trigger workflows based on segment membership."
        />
        <meta property="og:title" content="Audience Segmentation - Smart Contact Organization | Plunk" />
        <meta
          property="og:description"
          content="Create dynamic and static segments to organize your contacts. Filter by behavior, attributes, and engagement. Target campaigns and trigger workflows based on segment membership."
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
              <Users className="h-4 w-4 text-neutral-600" />
              <span className={'font-medium text-neutral-600'}>Audience Segmentation</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Target the Right
              <br />
              Audience Every Time
            </h1>
            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Organize contacts into dynamic segments based on behavior, attributes, and engagement. Send targeted
              campaigns and trigger personalized workflows.
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
                  Start segmenting
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
              Powerful segmentation tools
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Everything you need to organize and target your audience</p>
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

        {/* Filter Examples */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>
              Flexible filtering options
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Build complex segments with nested AND/OR logic</p>
          </motion.div>

          <div className={'mx-auto max-w-5xl space-y-6'}>
            {filterExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div className={'flex items-start justify-between gap-6'}>
                  <div className={'flex-1'}>
                    <h3 className={'text-xl font-semibold text-neutral-900'}>{example.title}</h3>
                    <p className={'mt-2 text-neutral-600'}>{example.description}</p>
                  </div>
                </div>
                <div className={'mt-6 space-y-2'}>
                  {example.filters.map((filter, filterIndex) => (
                    <div key={filterIndex} className={'flex items-center gap-3 rounded-lg bg-neutral-50 px-4 py-3'}>
                      <Filter className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                      <span className={'font-mono text-sm text-neutral-700'}>{filter}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Types of Segments */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>Two types of segments</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>Choose between dynamic filtering or manual curation</p>
          </motion.div>

          <div className={'mx-auto mt-16 max-w-5xl'}>
            <div className={'grid gap-8 lg:grid-cols-2'}>
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div className={'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white'}>
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Dynamic Segments</h3>
                <p className={'mt-2 text-neutral-600'}>
                  Automatically update based on filter conditions. As contact data changes, segment membership updates
                  in real-time.
                </p>
                <div className={'mt-6 space-y-2'}>
                  <div className={'flex items-center gap-2 text-sm text-neutral-600'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                    <span>Filter-based membership</span>
                  </div>
                  <div className={'flex items-center gap-2 text-sm text-neutral-600'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                    <span>Automatic updates</span>
                  </div>
                  <div className={'flex items-center gap-2 text-sm text-neutral-600'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                    <span>Optional entry/exit tracking</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div className={'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white'}>
                  <Users className="h-6 w-6" />
                </div>
                <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Static Segments</h3>
                <p className={'mt-2 text-neutral-600'}>
                  Manually curate your segment by adding specific contacts. Membership stays fixed until you change it.
                </p>
                <div className={'mt-6 space-y-2'}>
                  <div className={'flex items-center gap-2 text-sm text-neutral-600'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                    <span>Manual contact selection</span>
                  </div>
                  <div className={'flex items-center gap-2 text-sm text-neutral-600'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                    <span>Fixed membership</span>
                  </div>
                  <div className={'flex items-center gap-2 text-sm text-neutral-600'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                    <span>Perfect for VIP lists</span>
                  </div>
                </div>
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
              Use segments everywhere
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>From targeted campaigns to automated workflows</p>
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
              Start segmenting your audience
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Create targeted campaigns and personalized workflows with powerful segmentation. No credit card required.
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
