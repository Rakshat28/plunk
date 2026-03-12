import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, Book, Code, Mail, Shield, TrendingUp, Users} from 'lucide-react';

interface Guide {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{className?: string}>;
  badge?: string;
}

const guides: Guide[] = [
  {
    title: 'What is DKIM?',
    description: 'Learn how DKIM email authentication works and why it matters for deliverability.',
    href: '/guides/what-is-dkim',
    icon: Shield,
    badge: 'Authentication',
  },
  {
    title: 'What is SPF?',
    description: 'Understand SPF records and how they protect your emails from spoofing.',
    href: '/guides/what-is-spf',
    icon: Shield,
    badge: 'Authentication',
  },
  {
    title: 'What is DMARC?',
    description: 'Complete guide to DMARC policies and email security best practices.',
    href: '/guides/what-is-dmarc',
    icon: Shield,
    badge: 'Authentication',
  },
  {
    title: 'Email Deliverability Guide',
    description: 'Improve your email deliverability with best practices and proven strategies.',
    href: '/guides/email-deliverability',
    icon: TrendingUp,
    badge: 'Deliverability',
  },
  {
    title: 'Email Open Rates',
    description: 'Industry benchmarks and strategies to improve your email open rates.',
    href: '/guides/email-open-rate',
    icon: Mail,
    badge: 'Analytics',
  },
  {
    title: 'Email Marketing Best Practices',
    description: 'Comprehensive guide to email marketing: timing, content, design, and more.',
    href: '/guides/email-marketing-best-practices',
    icon: Book,
    badge: 'Best Practices',
  },
  {
    title: 'Email Bounce Rate',
    description: 'Understand hard vs soft bounces and how to reduce your bounce rate.',
    href: '/guides/email-bounce-rate',
    icon: TrendingUp,
    badge: 'Deliverability',
  },
  {
    title: 'Email Click-Through Rate',
    description: 'Optimize your CTAs and improve email click-through rates.',
    href: '/guides/email-click-through-rate',
    icon: Mail,
    badge: 'Analytics',
  },
  {
    title: 'Transactional vs Marketing Email',
    description: 'Understand the legal and technical differences between email types.',
    href: '/guides/transactional-vs-marketing-email',
    icon: Book,
    badge: 'Fundamentals',
  },
  {
    title: 'Email API Guide',
    description: 'Everything you need to know about email APIs with code examples.',
    href: '/guides/email-api-guide',
    icon: Code,
    badge: 'Technical',
  },
  {
    title: 'Email Sender Reputation',
    description: 'Build and maintain a positive sender reputation for better deliverability.',
    href: '/guides/email-sender-reputation',
    icon: Users,
    badge: 'Deliverability',
  },
];

/**
 * Email Guides hub page
 */
export default function GuidesIndex() {
  return (
    <>
      <NextSeo
        title="Email Marketing & Deliverability Guides | Plunk"
        description="Learn email best practices, authentication (DKIM, SPF, DMARC), deliverability optimization, and more. Free guides from Plunk."
        canonical="https://www.useplunk.com/guides"
        openGraph={{
          title: 'Email Marketing & Deliverability Guides | Plunk',
          description:
            'Learn email best practices, authentication (DKIM, SPF, DMARC), deliverability optimization, and more.',
          url: 'https://www.useplunk.com/guides',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk Guides'}],
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
              <Book className="h-4 w-4 text-neutral-600" />
              <span className={'text-sm text-neutral-600'}>Free Email Guides</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Master email
              <br />
              marketing & deliverability
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Free guides on email authentication, deliverability, best practices, and technical implementation. Learn
              from the experts.
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
            </div>
          </motion.div>
        </section>

        {/* Guides Grid */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Browse all guides</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Everything you need to master email</p>
          </motion.div>

          <div className={'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'}>
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <motion.div
                  key={guide.href}
                  initial={{opacity: 0, y: 20}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1]}}
                >
                  <Link
                    href={guide.href}
                    className={
                      'group block h-full rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg'
                    }
                  >
                    <div className={'flex items-start justify-between mb-4'}>
                      <div
                        className={
                          'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-110'
                        }
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {guide.badge && (
                        <span className={'rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700'}>
                          {guide.badge}
                        </span>
                      )}
                    </div>
                    <h3 className={'text-xl font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700'}>
                      {guide.title}
                    </h3>
                    <p className={'text-sm text-neutral-600 leading-relaxed'}>{guide.description}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Ready to get started?</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Put these guides into practice with Plunk's modern email platform. Start free, no credit card required.
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
                Get started free
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
