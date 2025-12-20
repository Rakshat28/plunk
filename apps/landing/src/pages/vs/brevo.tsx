import {ComparisonTable, FAQSection, Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, BarChart3, DollarSign, Globe, PackageOpen, Users, Zap} from 'lucide-react';
import type {ComparisonRow} from '../../components/ComparisonTable';
import type {FAQ} from '../../components/FAQSection';

const comparisonData: ComparisonRow[] = [
  {feature: 'Pricing Model', plunk: 'Pay-as-you-go per email', competitor: 'Monthly tiers by contacts'},
  {feature: 'Contact Limits', plunk: 'Unlimited', competitor: 'Tier-based limits'},
  {feature: 'Open Source', plunk: true, competitor: false},
  {feature: 'Self-Hostable', plunk: true, competitor: false},
  {feature: 'Target Audience', plunk: 'Developers & SaaS', competitor: 'All-in-one marketing suite'},
  {feature: 'Setup Time', plunk: '5 minutes', competitor: '30+ minutes'},
  {feature: 'Transactional Emails', plunk: true, competitor: true},
  {feature: 'Marketing Campaigns', plunk: true, competitor: true},
  {feature: 'Workflow Automation', plunk: 'Included', competitor: 'Higher tiers only'},
];

const faqs: FAQ[] = [
  {
    question: 'What is the difference between Plunk and Brevo (Sendinblue)?',
    answer:
      'Plunk is built for developers with a simple API and pay-as-you-go pricing, while Brevo is an all-in-one marketing suite with more features but higher complexity. Plunk is open-source and self-hostable, while Brevo is proprietary. Plunk charges per email sent with unlimited contacts, while Brevo uses tiered pricing based on contact count.',
  },
  {
    question: 'Is Plunk cheaper than Brevo?',
    answer:
      "It depends on your usage pattern. Plunk's pay-as-you-go model ($0.001 per email) with unlimited contacts is often more cost-effective for businesses with large contact lists but moderate email volume. Brevo charges based on contact count, which can become expensive as your audience grows.",
  },
  {
    question: 'Can I self-host Plunk unlike Brevo?',
    answer:
      'Yes. Plunk is open-source (AGPL-3.0) and can be self-hosted using Docker, giving you full control over your data and infrastructure. Brevo is a proprietary cloud-only service with no self-hosting option.',
  },
  {
    question: 'Is Plunk easier to use than Brevo?',
    answer:
      'For developers, yes. Plunk focuses on email essentials with a clean API and minimal setup. Brevo offers more features (SMS, chat, CRM) which adds complexity. If you just need email automation, Plunk is simpler. If you need an all-in-one marketing platform, Brevo might be better.',
  },
  {
    question: 'How easy is it to migrate from Brevo to Plunk?',
    answer:
      "Migration is straightforward. Export your contacts from Brevo, import them to Plunk via CSV, and update your application to use Plunk's API. Most migrations take less than a day. Plunk's API is well-documented and easy to integrate.",
  },
];

/**
 * Plunk vs Brevo (Sendinblue) comparison page
 */
export default function BrevoComparison() {
  return (
    <>
      <NextSeo
        title="Brevo (Sendinblue) Alternative: Developer-First & Open Source | Plunk"
        description="Plunk offers a simpler, developer-focused alternative to Brevo with pay-as-you-go pricing, open-source code, and self-hosting. No contact limits."
        canonical="https://www.useplunk.com/vs/brevo"
        openGraph={{
          title: 'Brevo (Sendinblue) Alternative: Developer-First & Open Source | Plunk',
          description:
            'Plunk offers a simpler, developer-focused alternative to Brevo with pay-as-you-go pricing, open-source code, and self-hosting.',
          url: 'https://www.useplunk.com/vs/brevo',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk vs Brevo'}],
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
              <span className={'text-sm font-semibold text-neutral-900'}>Plunk vs Brevo</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Developer-first alternative
              <br />
              for Brevo
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Simpler pricing, cleaner API, open-source code. All the email power, none of the bloat. Built for
              developers, not marketing teams.
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Pricing That Scales With You</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Pay for emails sent, not contacts stored</p>
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
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Pay per email</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Simple pay-as-you-go pricing. Unlimited contacts, pay only for emails sent.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>$0.001/email</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>Unlimited contacts included</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>All features on all plans</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-white'} />
                  </div>
                  <span>No monthly minimums</span>
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
                <span className={'text-sm font-semibold text-neutral-900'}>Brevo</span>
              </div>
              <h3 className={'mt-6 text-2xl font-bold text-neutral-900'}>Tiered by contacts</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Monthly subscription tiers based on contact count with feature restrictions on lower plans.
              </p>
              <div className={'mt-6 text-4xl font-bold text-neutral-900'}>Contact-based</div>
              <div className={'mt-8 space-y-3'}>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Pricing increases with contacts</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Features gated by tier</span>
                </div>
                <div className={'flex items-center gap-3 text-sm text-neutral-600'}>
                  <div className={'h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center'}>
                    <div className={'h-1.5 w-1.5 rounded-full bg-neutral-600'} />
                  </div>
                  <span>Monthly subscription required</span>
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Why Choose Plunk Over Brevo</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Focus on email, not feature overload</p>
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
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Simpler Pricing</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Pay $0.001 per email with unlimited contacts. No contact-based tiers, no surprise charges as you grow.
                Predictable costs.
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
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Developer-First</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Clean API, clear documentation, 5-minute setup. Built for developers who want to ship fast, not navigate
                complex marketing suites.
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
                AGPL-3.0 licensed. Inspect the code, contribute features, fork if needed. Full transparency, no vendor
                lock-in. Brevo is proprietary.
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
                <Globe className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Self-Hostable</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Run on your infrastructure with Docker. Full data control, compliance-ready, cost-optimized. Brevo is
                cloud-only.
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
                <Users className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Unlimited Contacts</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Store unlimited contacts at no extra cost. Brevo charges more as your contact list grows. With Plunk,
                you only pay for emails sent.
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
              <h3 className={'mt-6 text-xl font-semibold text-neutral-900'}>Email-Focused</h3>
              <p className={'mt-3 leading-relaxed text-neutral-600'}>
                Plunk does email and does it well. No SMS, chat, CRM bloat. If you need just email automation, Plunk is
                simpler and more focused.
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Feature-by-Feature Comparison</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>See exactly what you get with each platform</p>
          </motion.div>

          <ComparisonTable competitorName="Brevo" rows={comparisonData} />
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} schemaId="faq-schema-brevo" />

        {/* CTA */}
        <section className={'border-t border-neutral-200 py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Make the switch to simplicity</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Join developers choosing focused tools over bloated marketing suites. Start free, no credit card required.
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
                View pricing details
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
