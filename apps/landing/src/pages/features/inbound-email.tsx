import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {ArrowRight, Bell, Database, Inbox, Mail, Shield, Zap} from 'lucide-react';
import Head from 'next/head';

const features = [
  {
    icon: <Database className="h-5 w-5" />,
    title: 'Automatic Contact Capture',
    description: 'Every sender is automatically added to your contact database with no manual data entry required.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Workflow Automation',
    description: 'Trigger automated workflows when emails are received to create sophisticated two-way communication.',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Built-in Security',
    description:
      'Spam, virus, SPF, DKIM, and DMARC filtering keeps your inbox clean. The spam stays out, the good stuff gets in.',
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: 'Webhook Notifications',
    description: 'Get instant notifications with rich metadata whenever an email arrives at your domain.',
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Simple DNS Setup',
    description: 'Add one MX record to your domain and start receiving emails immediately. No PhD required.',
  },
  {
    icon: <Inbox className="h-5 w-5" />,
    title: 'Real-Time Processing',
    description: 'Emails are processed instantly and can trigger workflows or webhooks in real-time.',
  },
];

const useCases = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'Support Ticket Creation',
    description:
      'Automatically create support tickets when customers email support@yourdomain.com. Send auto-replies and route to your help desk system via webhooks. Your support team will thank you.',
    benefits: ['Instant acknowledgment', 'Automatic ticket creation', 'No emails missed'],
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: 'Lead Capture from Email',
    description:
      'Receive emails at info@yourdomain.com and automatically add senders to your CRM. Trigger nurture workflows based on when they reached out.',
    benefits: ['Zero-friction lead capture', 'Auto-segmentation', 'Instant follow-up'],
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Two-Way Conversations',
    description:
      'Let customers reply to your campaign emails and automatically trigger engagement workflows. Tag contacts as "engaged" when they respond.',
    benefits: ['Build conversation history', 'Track engagement', 'Personalized responses'],
  },
];

/**
 *
 */
export default function InboundEmailFeature() {
  return (
    <>
      <Head>
        <title>Inbound Email - Receive & Process Incoming Emails | Plunk</title>
        <meta
          name="description"
          content="Receive emails at your custom domain and automatically process them. Capture leads, create support tickets, and trigger workflows from incoming emails."
        />
        <meta property="og:title" content="Inbound Email - Turn Incoming Emails into Automated Actions | Plunk" />
        <meta
          property="og:description"
          content="Receive emails at your custom domain and automatically process them. Capture leads, create support tickets, and trigger workflows from incoming emails."
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
              <Inbox className="h-4 w-4 text-neutral-600" />
              <span className={'font-medium text-neutral-600'}>Inbound Email</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl text-balance'}>
              Turn Incoming Emails
              <br />
              into Actions
            </h1>
            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Receive emails at your custom domain and automatically trigger workflows, capture leads, or create support
              tickets. Two-way email communication made simple.
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
                  Start receiving emails
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
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>
              Complete inbound email solution
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>
              Everything you need to receive and process incoming emails
            </p>
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
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>Set up in minutes</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>Get started with inbound email in three simple steps</p>
          </motion.div>

          <div className={'mx-auto mt-16 max-w-5xl'}>
            <div className={'grid gap-12 lg:grid-cols-3'}>
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
              >
                <div className={'mb-5 flex items-center gap-4'}>
                  <div
                    className={
                      'flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-xl font-bold text-neutral-900'
                    }
                  >
                    1
                  </div>
                </div>
                <h3 className={'text-lg font-semibold text-neutral-900'}>Verify your domain</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                  Add and verify your custom domain in Plunk by configuring DKIM and SPF records in your DNS settings.
                </p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
              >
                <div className={'mb-5 flex items-center gap-4'}>
                  <div
                    className={
                      'flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-xl font-bold text-neutral-900'
                    }
                  >
                    2
                  </div>
                </div>
                <h3 className={'text-lg font-semibold text-neutral-900'}>Add MX record</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                  Add one MX record to your DNS to route incoming emails to Plunk. Copy the record from your dashboard.
                </p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1]}}
              >
                <div className={'mb-5 flex items-center gap-4'}>
                  <div
                    className={
                      'flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-xl font-bold text-neutral-900'
                    }
                  >
                    3
                  </div>
                </div>
                <h3 className={'text-lg font-semibold text-neutral-900'}>Start receiving</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                  Emails sent to any address at your domain are automatically received and can trigger workflows or
                  webhooks.
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
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>Powerful use cases</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>
              From support to sales, inbound email unlocks new automation possibilities
            </p>
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
                    <div className={'mt-4 flex flex-wrap gap-2'}>
                      {useCase.benefits.map(benefit => (
                        <span
                          key={benefit}
                          className={'rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700'}
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technical Details */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl'}
          >
            <div className={'rounded-2xl border border-neutral-200 bg-white p-8 sm:p-12'}>
              <h2 className={'text-3xl font-bold tracking-tight text-neutral-900 text-balance'}>
                What happens when an email arrives?
              </h2>
              <div className={'mt-10'}>
                {[
                  {
                    title: 'Email arrives at your domain',
                    description: 'Your MX record routes the email to Plunk for processing',
                  },
                  {
                    title: 'Security checks pass',
                    description: 'Automatic validation of spam, virus, SPF, DKIM, and DMARC',
                  },
                  {
                    title: 'Contact is created or updated',
                    description: 'The sender is automatically added to your contact database',
                  },
                  {
                    title: 'Workflows trigger automatically',
                    description: 'Configured workflows start running based on the incoming email',
                  },
                ].map((step, i, arr) => (
                  <div key={step.title} className={'relative flex gap-6'}>
                    {/* Vertical connector */}
                    {i < arr.length - 1 && (
                      <div className={'absolute left-[1.125rem] top-10 bottom-0 w-px bg-neutral-200'} />
                    )}
                    <div className={'relative flex-shrink-0'}>
                      <div
                        className={
                          'flex h-9 w-9 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-sm font-bold text-neutral-900'
                        }
                      >
                        {i + 1}
                      </div>
                    </div>
                    <div className={i < arr.length - 1 ? 'pb-8' : ''}>
                      <p className={'font-semibold text-neutral-900'}>{step.title}</p>
                      <p className={'mt-1 text-sm text-neutral-600'}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className={'relative overflow-hidden border-t border-neutral-200 py-20'}>
          <div
            className={
              'absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_100%,#000_70%,transparent_110%)]'
            }
          />
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>
              Your domain can receive emails too
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Set up inbound email on any verified domain in minutes. Replies, support tickets, and webhooks, all from
              one platform.
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
