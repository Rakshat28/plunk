import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, Code, DollarSign, Mail} from 'lucide-react';

const competitors = [
  {
    name: 'Postmark',
    slug: 'postmark',
    description: 'Transactional email reliability with marketing power',
    features: ['Transactional Emails', 'Marketing Campaigns', 'Workflow Automation'],
  },
  {
    name: 'SendGrid',
    slug: 'sendgrid',
    description: "Enterprise email platform vs Plunk's simplicity",
    features: ['Transactional Emails', 'Marketing Campaigns', 'API-First Design'],
  },
  {
    name: 'Mailgun',
    slug: 'mailgun',
    description: 'Developer-focused email vs open-source alternative',
    features: ['Transactional Emails', 'Marketing Campaigns', 'SMTP Support'],
  },
  {
    name: 'Mailchimp',
    slug: 'mailchimp',
    description: 'All-in-one marketing vs specialized email platform',
    features: ['Marketing Campaigns', 'Transactional Emails', 'CRM Integration'],
  },
  {
    name: 'Resend',
    slug: 'resend',
    description: 'Modern transactional email vs comprehensive solution',
    features: ['Transactional Emails', 'Developer Experience', 'Marketing Ready'],
  },
  {
    name: 'Customer.io',
    slug: 'customerio',
    description: 'Behavioral email vs workflow automation',
    features: ['Behavioral Emails', 'Transactional Emails', 'Automation'],
  },
  {
    name: 'Loops',
    slug: 'loops',
    description: 'Simple newsletter tool vs full email platform',
    features: ['Newsletters', 'Transactional Emails', 'Simple Setup'],
  },
  {
    name: 'Brevo',
    slug: 'brevo',
    description: 'European email platform vs global open-source',
    features: ['Transactional Emails', 'Marketing Campaigns', 'GDPR Compliant'],
  },
  {
    name: 'ConvertKit',
    slug: 'convertkit',
    description: 'Creator platform vs developer-first email',
    features: ['Marketing Campaigns', 'Workflow Automation', 'API-First Design'],
  },
  {
    name: 'ActiveCampaign',
    slug: 'activecampaign',
    description: 'Enterprise automation vs simple workflows',
    features: ['Marketing Campaigns', 'Workflow Automation', 'Transactional Emails'],
  },
  {
    name: 'MailerLite',
    slug: 'mailerlite',
    description: 'Developer-friendly vs developer-first platform',
    features: ['Marketing Campaigns', 'Transactional Emails', 'Open Source'],
  },
  {
    name: 'Klaviyo',
    slug: 'klaviyo',
    description: 'E-commerce leader vs affordable alternative',
    features: ['E-commerce Integration', 'Workflow Automation', 'Pay-as-you-go'],
  },
  {
    name: 'Bento',
    slug: 'bento',
    description: 'All-in-one platform vs focused email solution',
    features: ['Transactional Emails', 'Marketing Campaigns', 'API-First'],
  },
];

/**
 * Plunk vs Competitors index page
 */
export default function CompetitorsIndex() {
  return (
    <>
      <NextSeo
        title="Plunk vs Email Competitors | Compare Email Platforms"
        description="Compare Plunk with Postmark, SendGrid, Mailgun, Mailchimp, ConvertKit, ActiveCampaign, Klaviyo, MailerLite, and more. See why Plunk offers transactional emails plus marketing features in one open-source platform."
        canonical="https://www.useplunk.com/vs"
        openGraph={{
          title: 'Plunk vs Email Competitors | Compare Email Platforms',
          description:
            'Compare Plunk with 13 leading email platforms. Transactional + marketing emails in one open-source solution.',
          url: 'https://www.useplunk.com/vs',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk vs Competitors'}],
        }}
      />

      <Navbar />

      <main className={'mx-auto max-w-7xl px-8 sm:px-0'}>
        {/* Hero Section */}
        <section className={'relative py-32 sm:py-48'}>
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
            <div
              className={
                'mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2'
              }
            >
              <span className={'text-sm text-neutral-600'}>Email Platform Comparisons</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Plunk vs the
              <br />
              competition
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Compare Plunk with leading email platforms. See why developers choose our open-source alternative for
              transactional emails plus marketing features.
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
                  Get started free
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

        {/* Competitors Grid */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>
              Compare Plunk with Industry Leaders
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>See how Plunk stacks up against popular email platforms</p>
          </motion.div>

          <div className={'grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
            {competitors.map((competitor, index) => (
              <Link key={competitor.slug} href={`/vs/${competitor.slug}`}>
                <motion.div
                  initial={{opacity: 0, y: 20}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                  className={
                    'group rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg cursor-pointer'
                  }
                >
                  <div className={'mb-4 flex items-center justify-between'}>
                    <h3 className={'text-xl font-bold text-neutral-900'}>{competitor.name}</h3>
                  </div>
                  <p className={'mb-6 leading-relaxed text-neutral-600'}>{competitor.description}</p>
                  <div className={'mb-6 space-y-2'}>
                    {competitor.features.map(feature => (
                      <div key={feature} className={'flex items-center gap-2 text-sm text-neutral-600'}>
                        <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why Choose Plunk */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Why Choose Plunk</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>One platform for all your email needs</p>
          </motion.div>

          <div className={'grid gap-8 lg:grid-cols-3'}>
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
              className={
                'rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg'
              }
            >
              <Mail className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className={'text-2xl font-bold text-neutral-900'}>Transactional + Marketing</h3>
              <p className={'mt-4 leading-relaxed text-neutral-600'}>
                Send transactional emails with the same reliability as dedicated providers, plus marketing campaigns,
                automation, and segmentation—all in one platform.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
              className={
                'rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg'
              }
            >
              <Code className="h-8 w-8 text-green-500 mb-4" />
              <h3 className={'text-2xl font-bold text-neutral-900'}>Open Source & Self-Hostable</h3>
              <p className={'mt-4 leading-relaxed text-neutral-600'}>
                AGPL-3.0 licensed code you can inspect, modify, and self-host. Full control over your data and
                infrastructure. No vendor lock-in.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1]}}
              className={
                'rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg'
              }
            >
              <DollarSign className="h-8 w-8 text-yellow-500 mb-4" />
              <h3 className={'text-2xl font-bold text-neutral-900'}>Simple Pricing</h3>
              <p className={'mt-4 leading-relaxed text-neutral-600'}>
                Pay-as-you-go pricing with all features included. No separate charges for transactional vs marketing
                emails. No tiers, no commitments.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className={'border-t border-neutral-200 py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Ready to try Plunk?</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Join thousands of developers using Plunk for reliable email delivery. Start free, scale as you grow.
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
                Start free trial
              </motion.a>
              <Link
                href="/pricing"
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
