import {NextSeo} from 'next-seo';
import React from 'react';
import {Footer, Navbar} from '../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI} from '../lib/constants';
import {ArrowRight, BarChart3, Code2, Globe, Mail, PackageOpen, Shield, Users, Zap, X, Check} from 'lucide-react';
import Link from 'next/link';
import {GithubIcon} from 'lucide-react';

const includedFeatures = [
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Transactional emails',
    description: 'API and SMTP delivery for receipts, password resets, and any event-driven email.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Workflow automation',
    description: 'Build event-triggered sequences with delays, conditions, and branching logic.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Campaign broadcasts',
    description: 'Send newsletters and announcements to your full list or a targeted segment.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Unlimited contacts',
    description: 'Store as many contacts as you need. Growing your list never costs more.',
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: 'Full API access',
    description: 'REST API with SDKs for Node.js, Python, and more. Comprehensive documentation.',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Custom domains',
    description: 'Send from your own domain with DKIM, SPF, and DMARC set up automatically.',
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Audience segmentation',
    description: 'Dynamic segments built on behavior, attributes, and engagement data.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Analytics & tracking',
    description: 'Opens, clicks, bounces, and unsubscribes. Real data, no guessing.',
  },
  {
    icon: <PackageOpen className="h-5 w-5" />,
    title: 'Open source',
    description: 'AGPL-3.0 licensed. Inspect the code, self-host it, or contribute to it.',
  },
];

/**
 *
 */
export default function Pricing() {
  return (
    <>
      <NextSeo
        title={'Plunk Pricing | The Open-Source Email Platform'}
        description={
          'Transparent email pricing at $0.001 per email with no contact limits. Free plan includes 1,000 emails/month across transactional, workflow, and campaign emails. No hidden fees, pay only for what you use.'
        }
        openGraph={{
          title: 'Plunk Pricing | The Open-Source Email Platform',
          description:
            'Transparent email pricing at $0.001 per email with no contact limits. Free plan includes 1,000 emails/month across transactional, workflow, and campaign emails. No hidden fees, pay only for what you use.',
        }}
        additionalMetaTags={[
          {
            property: 'title',
            content: 'Plunk Pricing | The Open-Source Email Platform',
          },
        ]}
      />

      <Navbar />

      <main className={'mx-auto max-w-7xl px-8 sm:px-0'}>
        {/* Hero */}
        <section className={'relative py-20 sm:py-32'}>
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
            <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl text-balance">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-neutral-600">
              1,000 emails free every month. Then $0.001 per email. Unlimited contacts, no hidden fees.
            </p>
          </motion.div>
        </section>

        {/* Pricing tiers */}
        <section className={'pb-20'}>
          <div className={'mx-auto grid max-w-4xl gap-px bg-neutral-200 sm:grid-cols-2'}>
            {/* Free */}
            <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
              className={'flex flex-col bg-white p-10'}
            >
              <p className={'text-sm font-semibold uppercase tracking-widest text-neutral-400'}>Free forever</p>
              <div className={'mt-4 flex items-baseline gap-2'}>
                <span className={'text-6xl font-bold tracking-tight text-neutral-900'}>1,000</span>
                <span className={'text-lg text-neutral-500'}>emails / mo</span>
              </div>
              <p className={'mt-2 text-sm text-neutral-500'}>No credit card required</p>

              <ul className={'mt-8 flex-1 space-y-3'}>
                {['Transactional emails', 'Workflow automation', 'Campaign broadcasts', 'Custom domains', 'Click & open tracking', 'Unlimited contacts'].map(item => (
                  <li key={item} className={'flex items-center gap-3 text-sm text-neutral-600'}>
                    <Check className={'h-4 w-4 flex-shrink-0 text-neutral-900'} />
                    {item}
                  </li>
                ))}
                <li className={'flex items-center gap-3 text-sm text-neutral-400'}>
                  <X className={'h-4 w-4 flex-shrink-0'} />
                  Plunk branding on emails
                </li>
              </ul>

              <motion.a
                href={`${DASHBOARD_URI}/auth/signup`}
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                className={'mt-10 block w-full rounded-lg border border-neutral-300 px-6 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:border-neutral-400'}
              >
                Start for free
              </motion.a>
            </motion.div>

            {/* Pay as you grow */}
            <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
              className={'flex flex-col bg-white p-10'}
            >
              <p className={'text-sm font-semibold uppercase tracking-widest text-neutral-400'}>Pay as you grow</p>
              <div className={'mt-4 flex items-baseline gap-2'}>
                <span className={'text-6xl font-bold tracking-tight text-neutral-900'}>$0.001</span>
                <span className={'text-lg text-neutral-500'}>/ email</span>
              </div>
              <p className={'mt-2 text-sm'}>&nbsp;</p>

              <ul className={'mt-8 flex-1 space-y-3'}>
                {['Everything in Free', 'No Plunk branding', 'Monthly spend cap', 'Unlimited emails'].map(item => (
                  <li key={item} className={'flex items-center gap-3 text-sm text-neutral-600'}>
                    <Check className={'h-4 w-4 flex-shrink-0 text-neutral-900'} />
                    {item}
                  </li>
                ))}
              </ul>

              <motion.a
                href={`${DASHBOARD_URI}/auth/signup`}
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                className={'mt-10 block w-full rounded-lg bg-neutral-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800'}
              >
                Get started

              </motion.a>
            </motion.div>
          </div>
        </section>

        {/* Every feature included */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>
              Every feature on every plan
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>No feature tiers, no add-ons, no surprises</p>
          </motion.div>

          <div className={'grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3'}>
            {includedFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1]}}
                className={'group bg-white p-10 transition hover:bg-neutral-50'}
              >
                <div className={'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'}>
                  {feature.icon}
                </div>
                <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>{feature.title}</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Self-host */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'overflow-hidden rounded-xl border border-neutral-200 bg-white'}
          >
            <div className={'flex flex-col items-center gap-6 p-10 sm:flex-row sm:gap-0'}>
              <div className={'flex-1 text-center sm:text-left'}>
                <div className={'mb-3 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700'}>
                  <PackageOpen className={'h-3.5 w-3.5'} />
                  Self-hostable
                </div>
                <h2 className={'text-2xl font-bold text-neutral-900'}>Run it on your own infrastructure</h2>
                <p className={'mt-2 text-neutral-600'}>
                  Full data ownership, no per-email costs, and GDPR compliance by default. Deploy with Docker Compose in minutes.
                </p>
              </div>
              <div className={'sm:ml-auto sm:pl-8'}>
                <motion.button
                  onClick={() => {
                    window.open('https://github.com/useplunk/plunk', '_blank');
                  }}
                  whileHover={{scale: 1.02}}
                  whileTap={{scale: 0.98}}
                  className={'flex w-full items-center justify-center gap-x-3 rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 sm:w-auto'}
                >
                  <GithubIcon size={18} />
                  View on GitHub
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
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
              Start sending in 5 minutes
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              1,000 emails free every month. No credit card required.
            </p>
            <div className={'mt-12 flex flex-wrap justify-center gap-4'}>
              <motion.a
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                href={`${DASHBOARD_URI}/auth/signup`}
                className={'group rounded-lg bg-neutral-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800'}
              >
                <span className={'flex items-center gap-2'}>
                  Create free account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.a>
              <Link
                href={'https://github.com/useplunk/plunk'}
                target={'_blank'}
                className={'rounded-lg border border-neutral-300 px-8 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'}
              >
                Self-host for free
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
