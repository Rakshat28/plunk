import {ComparisonTable, FAQSection, Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, Code2, DollarSign, Globe, Mail, PackageOpen, Zap} from 'lucide-react';
import type {ComparisonRow} from '../../components/ComparisonTable';
import type {FAQ} from '../../components/FAQSection';

const comparisonData: ComparisonRow[] = [
  {feature: 'Pricing Model', plunk: 'Pay-as-you-go', competitor: 'Trial then subscription'},
  {feature: 'Target Audience', plunk: 'Developers', competitor: 'Small businesses/creators'},
  {feature: 'Open Source', plunk: true, competitor: false},
  {feature: 'Self-Hostable', plunk: true, competitor: false},
  {feature: 'Transactional Emails', plunk: true, competitor: true},
  {feature: 'Marketing Campaigns', plunk: true, competitor: true},
  {feature: 'Workflow Automation', plunk: true, competitor: true},
  {feature: 'CRM Features', plunk: false, competitor: true},
  {feature: 'Live Chat', plunk: false, competitor: true},
  {feature: 'API-First Design', plunk: true, competitor: 'Integration-focused'},
];

const faqs: FAQ[] = [
  {
    question: 'When should I choose Bento over Plunk?',
    answer:
      "Choose Bento if you need an all-in-one platform with CRM, live chat, and customer relationship features alongside email. Bento is designed for small businesses and creators who want everything in one place. Choose Plunk if you're a developer who needs focused email automation without CRM bloat. It's built specifically for integrating email into your product.",
  },
  {
    question: 'What is the pricing difference between Plunk and Bento?',
    answer:
      'Bento offers a 30-day unlimited trial, then switches to subscription pricing. Plunk uses pay-as-you-go pricing with no trials needed. You only pay for emails sent. For email-focused needs, Plunk is typically more cost-effective. Bento includes CRM and live chat in the price, so if you need those features, Bento may offer better value.',
  },
  {
    question: 'Can Plunk handle email automation like Bento?',
    answer:
      'Yes. Plunk supports workflow automation, event-based triggers, transactional emails, and marketing campaigns. All the email features Bento offers. The difference is Plunk focuses purely on email, while Bento includes CRM, live chat, and customer relationship management. If you only need email automation, Plunk is simpler.',
  },
  {
    question: 'How does the developer experience compare?',
    answer:
      'Plunk is API-first, designed specifically for developers who want to integrate email into their applications. Bento is integration-focused, designed for small businesses using tools like Shopify and WordPress. Plunk gives developers more control and flexibility, while Bento offers pre-built integrations and a UI-first approach.',
  },
  {
    question: 'Is migration from Bento to Plunk easy?',
    answer:
      "For email features, yes. Export your contacts from Bento, import them to Plunk, recreate your workflows using our API or dashboard, and integrate Plunk into your application. If you rely heavily on Bento's CRM, live chat, or multi-channel features, you'll need separate tools for those. Most email-only migrations take a few hours.",
  },
];

/**
 * Plunk vs Bento comparison page
 */
export default function BentoComparison() {
  return (
    <>
      <NextSeo
        title="Bento Alternative: Developer-First Email Platform | Plunk"
        description="Open-source alternative to Bento. API-first email platform without CRM bloat. Self-hostable, pay-as-you-go pricing, built for developers."
        canonical="https://www.useplunk.com/vs/bento"
        openGraph={{
          title: 'Bento Alternative: Developer-First Email Platform | Plunk',
          description:
            'Open-source alternative to Bento. API-first email platform without CRM bloat. Self-hostable, pay-as-you-go pricing.',
          url: 'https://www.useplunk.com/vs/bento',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk vs Bento'}],
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
              <span className={'text-sm font-semibold text-neutral-900'}>Plunk vs Bento</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl text-balance'}>
              Open-source alternative
              <br />
              for Bento
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Bento is an all-in-one platform. Plunk is focused on email. Get powerful email automation without CRM,
              live chat, or multi-channel complexity. Developer-first, API-driven, transparent pricing.
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
              Focused Email vs All-in-One Complexity
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Pay for what you use, not what you don't need</p>
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
                Pay-as-you-go for email only. No CRM or chat features you don't need. Simple, transparent pricing.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>Pay-as-you-go</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>Only pay for emails sent</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>No monthly commitments</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>Focus on email, nothing more</span>
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
                <span className={'text-sm font-semibold text-neutral-900'}>Bento</span>
              </div>
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Trial then subscription</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                30-day unlimited trial, then subscription pricing. Includes CRM, chat, and multi-channel features.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>30-day trial</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Trial ends, then monthly subscription</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Includes features beyond email</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>All-in-one platform approach</span>
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Developer-First Email Platform</h2>
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
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>API-First Design</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Built for developers who integrate email into their applications. Clean REST API, comprehensive docs,
                webhook support.
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
                <PackageOpen className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Open Source</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                AGPL-3.0 licensed. Full code transparency, contribute features, understand the system. Bento is
                proprietary closed-source.
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
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Pay-as-you-go</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Only pay for emails sent. No subscriptions, no trials that expire, no forced plan upgrades. Predictable
                costs based on usage.
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
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Simple Setup</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Start sending in 5 minutes. No CRM to configure, no multi-channel setup, no live chat integration. Just
                email, done right.
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
                Deploy on your infrastructure with Docker. Full data control, compliance-ready, no vendor lock-in. Bento
                is cloud-only.
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
                <Mail className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Email-Focused</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Do one thing exceptionally well: email. No feature bloat, no CRM complexity, no multi-channel confusion.
                Just powerful email automation.
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

          <ComparisonTable competitorName="Bento" rows={comparisonData} />
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} schemaId="faq-schema-bento" />

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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Get focused email automation</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Join developers choosing focused email solutions over all-in-one complexity. Start free, no credit card
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
