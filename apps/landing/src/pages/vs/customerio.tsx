import {ComparisonTable, FAQSection, Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, BarChart3, Code2, DollarSign, Globe, PackageOpen, Zap} from 'lucide-react';
import type {ComparisonRow} from '../../components/ComparisonTable';
import type {FAQ} from '../../components/FAQSection';

const comparisonData: ComparisonRow[] = [
  {feature: 'Free Tier', plunk: '1,000 emails/month', competitor: 'Limited free tier'},
  {feature: 'Pricing Model', plunk: 'Pay-as-you-go', competitor: 'Complex usage-based tiers'},
  {feature: 'Open Source', plunk: true, competitor: false},
  {feature: 'Self-Hostable', plunk: true, competitor: false},
  {feature: 'Transactional Emails', plunk: true, competitor: true},
  {feature: 'Marketing Campaigns', plunk: true, competitor: true},
  {feature: 'Workflow Automation', plunk: true, competitor: true},
  {feature: 'Behavioral Segmentation', plunk: true, competitor: true},
  {feature: 'Visual Journey Builder', plunk: true, competitor: true},
  {feature: 'Developer-First API', plunk: true, competitor: false},
];

const faqs: FAQ[] = [
  {
    question: 'When should I choose Customer.io over Plunk?',
    answer:
      "Choose Customer.io if you need advanced behavioral segmentation, visual journey builders, and have a dedicated marketing operations team. Customer.io excels at complex, enterprise-level marketing automation with sophisticated visual tools. Choose Plunk if you want developer-friendly APIs, simpler workflows, and don't need the overhead of an enterprise marketing platform.",
  },
  {
    question: 'What is the pricing difference between Plunk and Customer.io?',
    answer:
      "Plunk uses a simple pay-as-you-go pricing model where you only pay for emails sent. Customer.io has complex usage-based tiers that combine messages sent, active profiles, and feature access. For small to medium teams, Plunk is typically more cost-effective. Customer.io's pricing scales with contact count and feature usage, which can become expensive as you grow.",
  },
  {
    question: 'Is migration from Customer.io to Plunk complex?',
    answer:
      "Migration complexity depends on your current setup. If you use basic transactional emails and simple workflows, migration is straightforward - update your API integration and recreate your workflows. If you rely heavily on Customer.io's visual journey builder and advanced behavioral segmentation, you'll need to simplify some workflows. Most teams can migrate in a few days of development work.",
  },
  {
    question: 'What does Plunk simplify compared to Customer.io?',
    answer:
      'Plunk removes enterprise complexity while keeping core functionality. You get a clean, developer-first API instead of complex visual builders. Workflows are defined in code or simple UI, not elaborate journey maps. Pricing is transparent pay-as-you-go instead of tiered complexity. Setup takes minutes instead of weeks. Plunk is open-source and self-hostable, giving you full control without vendor lock-in.',
  },
];

/**
 * Plunk vs Customer.io comparison page
 */
export default function CustomerioComparison() {
  return (
    <>
      <NextSeo
        title="Customer.io Alternative: Open-Source & Developer-Focused | Plunk"
        description="Compare Plunk and Customer.io. Customer.io is powerful but complex. Plunk is open-source, developer-friendly, with simple workflows and transparent pricing."
        canonical="https://next.useplunk.com/vs/customerio"
        openGraph={{
          title: 'Customer.io Alternative: Open-Source & Developer-Focused | Plunk',
          description:
            'Compare Plunk and Customer.io. Plunk is open-source, developer-friendly, with simple workflows and transparent pricing.',
          url: 'https://next.useplunk.com/vs/customerio',
          images: [{url: 'https://next.useplunk.com/assets/card.png', alt: 'Plunk vs Customer.io'}],
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
              <span className={'text-sm text-neutral-600'}>Comparing</span>
              <span className={'text-sm font-semibold text-neutral-900'}>Plunk vs Customer.io</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Open-source alternative
              <br />
              for Customer.io
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Customer.io is powerful but complex. Plunk gives developers the automation they need without the
              enterprise overhead.
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
                  Try Plunk free
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

        {/* Pricing Model Comparison */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Simple Pricing That Scales</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Transparent pay-as-you-go vs complex enterprise tiers</p>
          </motion.div>

          <div className={'grid gap-8 lg:grid-cols-2'}>
            <motion.div
              initial={{opacity: 0, x: -20}}
              whileInView={{opacity: 1, x: 0}}
              viewport={{once: true}}
              transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
              className={'rounded-2xl border-2 border-neutral-900 bg-white p-10'}
            >
              <div className={'mb-4 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-1.5'}>
                <span className={'text-sm font-semibold text-white'}>Plunk</span>
              </div>
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Pay per email sent</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Pay-as-you-go pricing. Only pay for emails you actually send.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>Pay-as-you-go</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>Only pay for emails you actually send</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>No contact-based pricing complexity</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>All features included, no upsells</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{opacity: 0, x: 20}}
              whileInView={{opacity: 1, x: 0}}
              viewport={{once: true}}
              transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
              className={'rounded-2xl border border-neutral-200 bg-neutral-50 p-10'}
            >
              <div className={'mb-4 inline-flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-1.5'}>
                <span className={'text-sm font-semibold text-neutral-900'}>Customer.io</span>
              </div>
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Complex usage-based pricing</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Pricing based on profiles, messages, and feature tiers.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>Tiered complexity</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Pay for profiles and messages sent</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Enterprise pricing can be expensive</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Advanced features locked behind tiers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Feature-by-Feature</h2>
          </motion.div>

          <ComparisonTable competitorName="Customer.io" rows={comparisonData} />
        </section>

        {/* Key Advantages */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-20 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Key Advantages</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Why developers choose Plunk</p>
          </motion.div>

          <div className={'grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3'}>
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
              className={'group bg-white p-12 transition hover:bg-neutral-50'}
            >
              <div
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                }
              >
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Developer-First Experience</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Clean, simple APIs designed for developers. No complex visual builders or marketing jargon. Integrate in
                minutes, not weeks.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
              className={'group bg-white p-12 transition hover:bg-neutral-50'}
            >
              <div
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                }
              >
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Transparent Pricing</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Pay-as-you-go pricing with no hidden costs or complex tiers. No need to pay for contact lists or profile
                counts - just emails sent.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1]}}
              className={'group bg-white p-12 transition hover:bg-neutral-50'}
            >
              <div
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                }
              >
                <PackageOpen className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Open Source</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                AGPL-3.0 licensed. Inspect the code, contribute features, fork if needed. No vendor lock-in with
                proprietary platforms.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1]}}
              className={'group bg-white p-12 transition hover:bg-neutral-50'}
            >
              <div
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                }
              >
                <Zap className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Quick Setup</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Minutes to integrate and start sending. No lengthy onboarding, no sales calls, no enterprise setup
                processes. Start free immediately.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1]}}
              className={'group bg-white p-12 transition hover:bg-neutral-50'}
            >
              <div
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                }
              >
                <Globe className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Self-Hosting Option</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Run on your infrastructure with Docker. Full data control, compliance-ready. Pay only AWS SES fees when
                self-hosting.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1]}}
              className={'group bg-white p-12 transition hover:bg-neutral-50'}
            >
              <div
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                }
              >
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Simplicity at Scale</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Simple workflows that scale without over-engineering. Get enterprise capabilities without enterprise
                complexity or dedicated ops teams.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} schemaId="faq-schema-customerio" />

        {/* CTA */}
        <section className={'border-t border-neutral-200 py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Try Plunk free</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              1,000 emails/month free. No credit card required. Developer-friendly from day one.
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
                href={WIKI_URI}
                target={'_blank'}
                className={
                  'rounded-lg border border-neutral-300 px-8 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'
                }
              >
                Read documentation
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
