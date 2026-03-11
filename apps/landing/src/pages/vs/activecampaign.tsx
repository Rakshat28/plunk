import {ComparisonTable, FAQSection, Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, Code2, DollarSign, Globe, PackageOpen, Workflow, Zap} from 'lucide-react';
import type {ComparisonRow} from '../../components/ComparisonTable';
import type {FAQ} from '../../components/FAQSection';

const comparisonData: ComparisonRow[] = [
  {feature: 'Pricing Model', plunk: 'Pay-as-you-go', competitor: 'Expensive tiers'},
  {feature: 'Setup Complexity', plunk: '5 minutes', competitor: 'Hours to days'},
  {feature: 'Open Source', plunk: true, competitor: false},
  {feature: 'Self-Hostable', plunk: true, competitor: false},
  {feature: 'Transactional Emails', plunk: true, competitor: true},
  {feature: 'Marketing Campaigns', plunk: true, competitor: true},
  {feature: 'Workflow Automation', plunk: true, competitor: true},
  {feature: 'CRM Included', plunk: false, competitor: true},
  {feature: 'Sales Automation', plunk: false, competitor: true},
  {feature: 'Machine Learning', plunk: false, competitor: true},
];

const faqs: FAQ[] = [
  {
    question: 'When should I choose ActiveCampaign over Plunk?',
    answer:
      'Choose ActiveCampaign if you need a full CRM with sales automation, lead scoring, and machine learning features. ActiveCampaign is designed for marketing and sales teams that need an all-in-one platform. Choose Plunk if you need powerful email automation without the complexity. It is built for developers who want to integrate email into their product without CRM overhead.',
  },
  {
    question: 'What is the price difference between Plunk and ActiveCampaign?',
    answer:
      'ActiveCampaign starts at $29/month for basic features and quickly scales to $149/month or more for automation features. Plunk uses pay-as-you-go pricing. You only pay for emails sent. For email-focused needs, Plunk typically costs 50-80% less than ActiveCampaign while providing the same email automation capabilities.',
  },
  {
    question: "Can Plunk match ActiveCampaign's automation capabilities?",
    answer:
      'For email automation, yes. Plunk supports workflow automation, event-based triggers, and audience segmentation just like ActiveCampaign. The difference is Plunk focuses purely on email, while ActiveCampaign includes CRM, sales automation, and ML-powered recommendations. If you need email automation without sales/CRM features, Plunk delivers the same capability with simpler implementation.',
  },
  {
    question: 'Is migration from ActiveCampaign to Plunk difficult?',
    answer:
      "It depends on your ActiveCampaign usage. If you're primarily using email automation and campaigns, migration is straightforward: export contacts, recreate workflows, and integrate Plunk's API. If you heavily rely on CRM, lead scoring, or sales automation, you'll need separate tools for those features. Most developers migrate in a day or less.",
  },
  {
    question: 'What ActiveCampaign features does Plunk not have?',
    answer:
      "Plunk focuses on email, so it doesn't include ActiveCampaign's CRM, sales pipeline management, lead scoring, SMS marketing, or machine learning features. If you need those, ActiveCampaign is better. If you want powerful email automation without the enterprise complexity, Plunk is the simpler choice.",
  },
];

/**
 * Plunk vs ActiveCampaign comparison page
 */
export default function ActiveCampaignComparison() {
  return (
    <>
      <NextSeo
        title="ActiveCampaign Alternative: Open-Source & Affordable | Plunk"
        description="Powerful email automation without ActiveCampaign's complexity and cost. Open-source, developer-friendly, pay-as-you-go pricing. No CRM bloat."
        canonical="https://www.useplunk.com/vs/activecampaign"
        openGraph={{
          title: 'ActiveCampaign Alternative: Open-Source & Affordable | Plunk',
          description:
            "Powerful email automation without ActiveCampaign's complexity and cost. Open-source, developer-friendly, pay-as-you-go pricing.",
          url: 'https://www.useplunk.com/vs/activecampaign',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk vs ActiveCampaign'}],
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
              <span className={'text-sm font-semibold text-neutral-900'}>Plunk vs ActiveCampaign</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl text-balance'}>
              Open-source alternative
              <br />
              for ActiveCampaign
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              ActiveCampaign is powerful but expensive and complex. Plunk delivers essential email automation without
              CRM bloat, sales features, or enterprise pricing. Built for developers, not marketing departments.
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

        {/* Pricing Model Comparison */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              Enterprise Features Without Enterprise Prices
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Email automation that doesn't break the bank</p>
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
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Simple pay-as-you-go</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Only pay for emails sent. All features included, no tier gating, no forced upgrades.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>Pay-as-you-go</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>All automation features included</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>No monthly minimums or contracts</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>Typical savings: 50-80% vs ActiveCampaign</span>
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
                <span className={'text-sm font-semibold text-neutral-900'}>ActiveCampaign</span>
              </div>
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Expensive subscription tiers</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Complex pricing with feature gating. Automation requires higher tiers.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>From $29/month</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Advanced automation: $149+/month</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Feature limits on lower tiers</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Includes CRM/sales features you may not need</span>
                </div>
              </div>
            </motion.div>
          </div>
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Automation Without Complexity</h2>
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
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Affordable Pricing</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Pay-as-you-go with all features included. No expensive tier upgrades required for automation. Typically
                50-80% cheaper than ActiveCampaign.
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
                <Zap className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>5-Minute Setup</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Start sending in minutes. No CRM to configure, no sales pipeline to set up. Just authenticate and build
                your email workflows.
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
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Developer-First</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Clean API designed for developers, not marketing teams. Integrate email into your product without
                learning complex enterprise software.
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
                <PackageOpen className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Open Source</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                AGPL-3.0 licensed. Full transparency into how your emails are processed. Contribute features, understand
                the system. ActiveCampaign is proprietary.
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
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Self-Hostable</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Deploy on your own infrastructure with Docker. Full data control, compliance-ready, no vendor lock-in.
                ActiveCampaign is cloud-only.
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
                <Workflow className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Workflow Automation</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Event-based triggers, segmentation, and automated sequences. All the email automation power of
                ActiveCampaign without CRM complexity.
              </p>
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Feature Comparison</h2>
          </motion.div>

          <ComparisonTable competitorName="ActiveCampaign" rows={comparisonData} />
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} schemaId="faq-schema-activecampaign" />

        {/* CTA */}
        <section className={'relative overflow-hidden border-t border-neutral-200 py-32'}>
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              Get email automation without the bloat
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Join developers choosing focused email automation over enterprise complexity. Start free, no credit card
              required.
            </p>
            <div className={'mt-12 flex flex-wrap justify-center gap-4'}>
              <motion.a
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                href={`${DASHBOARD_URI}/auth/signup`}
                className={
                  'group rounded-lg bg-neutral-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800'
                }
              >
                <span className={'flex items-center gap-2'}>
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
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
