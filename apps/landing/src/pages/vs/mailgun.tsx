import {Footer, Navbar, ComparisonTable, FAQSection} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, BarChart3, Workflow, Users, PackageOpen, Globe, Layers} from 'lucide-react';
import type {ComparisonRow} from '../../components/ComparisonTable';
import type {FAQ} from '../../components/FAQSection';

const comparisonData: ComparisonRow[] = [
  {feature: 'Free Tier', plunk: '1,000 emails/month', competitor: 'Limited trial'},
  {feature: 'Pricing Model', plunk: 'Pay-as-you-go', competitor: 'Tiered monthly plans'},
  {feature: 'Open Source', plunk: true, competitor: false},
  {feature: 'Self-Hostable', plunk: true, competitor: false},
  {feature: 'Transactional Emails', plunk: true, competitor: true},
  {feature: 'Marketing Campaigns', plunk: true, competitor: false},
  {feature: 'Workflow Automation', plunk: true, competitor: false},
  {feature: 'Dynamic Segmentation', plunk: true, competitor: false},
  {feature: 'Email Validation', plunk: 'Basic', competitor: 'Advanced'},
  {feature: 'Custom Domains', plunk: true, competitor: true},
];

const faqs: FAQ[] = [
  {
    question: 'When should I choose Mailgun over Plunk?',
    answer:
      'Choose Mailgun if you need advanced email validation features or have very high volume transactional email needs (millions per day) and want a proven infrastructure provider. Mailgun has been around longer and has extensive deliverability tools. Choose Plunk if you need marketing campaigns, workflow automation, or want the flexibility to self-host (though Plunk also offers fully-managed hosting).',
  },
  {
    question: 'What is the pricing difference between Plunk and Mailgun?',
    answer:
      'Plunk uses a simple pay-as-you-go pricing model where you pay only for emails sent. Mailgun uses tiered monthly plans based on email volume, which can be cost-effective at very high volumes but less flexible for variable sending patterns. With Plunk, you get marketing campaigns and workflow automation included at no additional cost - with Mailgun, you\'d need separate tools for marketing.',
  },
  {
    question: 'Is migration from Mailgun to Plunk complex?',
    answer:
      'Migration requires updating your API integration since Plunk and Mailgun use different API structures. You\'ll need to update your code to use Plunk\'s endpoints and parameter format. Both platforms support similar core features (templates, webhooks, custom domains), so the concepts translate directly. Plan for a few hours of development work to migrate your integration. Your email templates can be adapted with minimal changes.',
  },
  {
    question: 'What does Plunk add beyond transactional emails?',
    answer:
      'Plunk adds marketing campaigns (one-time broadcasts to all contacts or specific segments), workflow automation (multi-step email sequences with triggers, delays, and conditions), and dynamic audience segmentation (auto-updating groups based on contact data and behavior). These features mean you can handle both transactional and marketing emails in one platform. Plunk is also open-source (AGPL-3.0) and self-hostable, giving you full control over your email infrastructure.',
  },
];

/**
 * Plunk vs Mailgun comparison page
 */
export default function MailgunComparison() {
  return (
    <>
      <NextSeo
        title="Mailgun Alternative: Open-Source with Marketing & Automation | Plunk"
        description="Compare Plunk and Mailgun. Mailgun focuses on transactional emails, while Plunk adds marketing campaigns, workflows, and is open-source."
        canonical="https://www.useplunk.com/vs/mailgun"
        openGraph={{
          title: 'Mailgun Alternative: Open-Source with Marketing & Automation | Plunk',
          description:
            'Compare Plunk and Mailgun. Mailgun is excellent for transactional emails. Plunk adds marketing, workflows, and is open-source.',
          url: 'https://www.useplunk.com/vs/mailgun',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk vs Mailgun'}],
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
            <div className={'mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2'}>
              <span className={'text-sm text-neutral-600'}>Comparing</span>
              <span className={'text-sm font-semibold text-neutral-900'}>Plunk vs Mailgun</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Open-source alternative
              <br />
              for Mailgun
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Mailgun is excellent for transactional emails. Plunk adds marketing campaigns, workflow automation, and
              is open-source.
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>The Pricing Model That Makes Sense</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Pay for what you use, not fixed subscriptions</p>
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
                  <span>Scale up or down without commitment</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>Marketing and automation included</span>
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
                <span className={'text-sm font-semibold text-neutral-900'}>Mailgun</span>
              </div>
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Tiered monthly plans</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Monthly subscription with tiered email volume limits.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>Fixed tiers</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Locked into monthly subscription tiers</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Need to upgrade plan as you grow</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Transactional only, no marketing</span>
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

          <ComparisonTable competitorName="Mailgun" rows={comparisonData} />
        </section>

        {/* What Plunk Adds */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-20 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>What Plunk Adds</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Beyond transactional emails</p>
          </motion.div>

          <div className={'grid gap-px bg-neutral-200 sm:grid-cols-3'}>
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
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Marketing Campaigns</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Send one-time broadcasts to all contacts or specific segments. Schedule sends, track performance.
                Mailgun doesn't offer this.
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
                <Workflow className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Workflow Automation</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Build multi-step email sequences with triggers, delays, and conditions. Perfect for onboarding, drip
                campaigns, cart abandonment.
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
                <Users className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Dynamic Segmentation</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Create audience segments that update automatically based on contact data and behavior. Target campaigns
                precisely.
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
                AGPL-3.0 licensed. Inspect the code, contribute features, no vendor lock-in. Mailgun is proprietary.
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
                <Layers className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>All-in-One Platform</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                One platform for transactional, marketing, and automation. No need for multiple tools or integrations.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} schemaId="faq-schema-mailgun" />

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
              1,000 emails/month free. No credit card required. Add marketing and automation when you need it.
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
