import {Footer, Navbar} from '../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, LANDING_URI, WIKI_URI} from '../lib/constants';
import React from 'react';
import Artur from '../../public/assets/artur.png';
import Joe from '../../public/assets/joe.png';
import Noah from '../../public/assets/noah.png';
import Pierre from '../../public/assets/pierre.png';
import Jonni from '../../public/assets/jonni.png';
import Alisson from '../../public/assets/alisson.png';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Globe,
  Inbox,
  Lock,
  Mail,
  Megaphone,
  PackageOpen,
  Send,
  Shield,
  TrendingUp,
  User,
  Users,
  Workflow,
} from 'lucide-react';

const testimonials = [
  {
    testimonial: 'Transparent and intuitive UI, extremely easy setup & automation and great support.',
    author: 'Artur Czemiel',
    image: Artur,
    role: 'Founder at GraphQL Editor',
  },
  {
    testimonial: 'Lots of care put into Plunk',
    author: 'Jonni Lundy',
    image: Jonni,
    role: 'Founding Operations Manager at Resend',
  },
  {
    testimonial: "I've been using Plunk for building & sending out marketing emails and genuinely love it!",
    author: 'Joe Ashwell',
    image: Joe,
    role: 'Founder at UnwindHR',
  },
  {
    testimonial: 'I loved the ease of use, beautiful UI and great UX. Everything simply works.',
    author: 'Alisson Leal',
    image: Alisson,
    role: 'Founder at Brapi',
  },
  {
    testimonial: 'Simple to use, efficient and no regrets!',
    author: 'Noah Di Gesu',
    image: Noah,
    role: 'Founder at Smoothey',
  },
  {
    testimonial: 'Clean design, easy to understand, fair pricing.',
    author: 'Pierre Jacquel',
    image: Pierre,
    role: 'Founder at Landingly',
  },
];

const features = [
  {
    icon: <Workflow className="h-5 w-5" />,
    title: 'Workflow Automation',
    description:
      'Visual builder for complex email sequences with triggers, delays, and conditional logic. No code required.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Dynamic Segments',
    description: 'Real-time audience segmentation based on contact data and behavior. Less noise, more signal.',
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Campaign Management',
    description: 'Broadcast emails with scheduling and performance tracking. Send the right message at the right time.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Analytics',
    description: 'Detailed metrics on opens, clicks, bounces, and conversions across campaigns.',
  },
  {
    icon: <Inbox className="h-5 w-5" />,
    title: 'Inbound Email',
    description: 'Receive and process incoming emails with webhook notifications. Your inbox, automated.',
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Custom Domains',
    description: 'Brand consistency with DKIM authentication and custom sending domains. Yes, even in Outlook.',
  },
];

/**
 *
 */
export default function Index() {
  return (
    <>
      <Script
        id={`faq-schema-index`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'How is Plunk different from other email automation tools?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text':
                    'Plunk is the email tool built for SaaS businesses, indie hackers and developers. Plunk allows you to create complex, automated email flows and to trigger them from anywhere through a single API call.',
                },
              },
              {
                '@type': 'Question',
                'name': 'Can I use Plunk for transactional emails?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text':
                    'Yes, Plunk is a full-fledged email tool that allows you to send transactional emails as well as marketing emails. You can use Plunk to send emails to your customers when they sign up, when they cancel their subscription, when they upgrade their plan, etc.',
                },
              },
              {
                '@type': 'Question',
                'name': 'Can I use Plunk for sending newsletters?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text':
                    'Yes, Plunk allows you to send newsletters and other broadcast emails to multiple contacts at once.',
                },
              },
              {
                '@type': 'Question',
                'name': 'What programming languages and frameworks does Plunk support?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text':
                    'Plunk supports all programming languages and frameworks that are capable of sending API calls.. You can use Plunk to send emails from your backend, frontend, mobile app, or any other platform.',
                },
              },
              {
                '@type': 'Question',
                'name': 'How much does Plunk cost?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text':
                    'Plunk offers a free plan that includes 1000 emails per month. You can upgrade to a pay-as-you-go plan that costs $0.001 per email.',
                },
              },
            ],
          }),
        }}
      />
      <Script
        id={`corp-schema-index`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Corporation',
            'name': 'Plunk',
            'alternateName': 'UsePlunk',
            'url': LANDING_URI,
            'logo': `${LANDING_URI}/assets/logo.png`,
            'sameAs': ['https://www.twitter.com/useplunk', LANDING_URI],
          }),
        }}
      />
      <Script
        id={`software-schema-index`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Plunk',
            'applicationCategory': 'Email Marketing Software',
            'operatingSystem': 'Web, Docker',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD',
              'priceSpecification': {
                '@type': 'UnitPriceSpecification',
                'price': '0.001',
                'priceCurrency': 'USD',
                'unitText': 'email',
              },
            },
            'featureList':
              'Workflow Automation, Dynamic Segmentation, Campaign Management, Analytics, Developer API, Custom Domains, Self-Hosting, Open Source',
          }),
        }}
      />

      <Navbar />

      <main className={'mx-auto max-w-7xl px-8 sm:px-0'}>
        {/* Hero Section */}
        <section className={'relative py-32 sm:py-48'}>
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
            <motion.div
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
              className={
                'mb-8 inline-flex flex-col sm:flex-row items-center gap-x-2 gap-y-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm shadow-sm'
              }
            >
              <span className={'flex items-center gap-2'}>
                <svg className="h-4 w-4 text-neutral-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={'font-medium text-neutral-700'}>5,000+ Stars on GitHub</span>
              </span>
              <span className={'hidden sm:inline text-neutral-300'}>·</span>
              <span className={'text-neutral-500'}>AGPL-3.0 Open Source</span>
            </motion.div>

            <h1 className={'text-7xl font-bold tracking-tight text-neutral-900 sm:text-8xl lg:text-9xl text-balance'}>
              Open-Source
              <br />
              Email Platform
            </h1>
            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Transactional emails, marketing campaigns, and workflow automation in one platform. Open-source,
              self-hostable, $0.001 per email, no contact limits.
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
                  Get started
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
                Documentation
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Alternatives */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-5xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              Replace your email stack
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>
              The open-source alternative to Resend, SendGrid, Mailchimp, and more
            </p>

            <div className={'mt-16 grid grid-cols-2 gap-px bg-neutral-200 lg:grid-cols-5'}>
              <Link href={'/vs/resend'} className={'group bg-white p-10 transition hover:bg-neutral-50'}>
                <div className={'flex flex-col items-center gap-4'}>
                  <div className={'text-2xl font-bold text-neutral-400 transition group-hover:text-neutral-900'}>
                    Resend
                  </div>
                  <span className={'text-xs font-medium text-neutral-500'}>vs Plunk →</span>
                </div>
              </Link>

              <Link href={'/vs/sendgrid'} className={'group bg-white p-10 transition hover:bg-neutral-50'}>
                <div className={'flex flex-col items-center gap-4'}>
                  <div className={'text-2xl font-bold text-neutral-400 transition group-hover:text-neutral-900'}>
                    SendGrid
                  </div>
                  <span className={'text-xs font-medium text-neutral-500'}>vs Plunk →</span>
                </div>
              </Link>

              <Link href={'/vs/mailchimp'} className={'group bg-white p-10 transition hover:bg-neutral-50'}>
                <div className={'flex flex-col items-center gap-4'}>
                  <div className={'text-2xl font-bold text-neutral-400 transition group-hover:text-neutral-900'}>
                    Mailchimp
                  </div>
                  <span className={'text-xs font-medium text-neutral-500'}>vs Plunk →</span>
                </div>
              </Link>

              <Link href={'/vs/customerio'} className={'group bg-white p-10 transition hover:bg-neutral-50'}>
                <div className={'flex flex-col items-center gap-4'}>
                  <div className={'text-2xl font-bold text-neutral-400 transition group-hover:text-neutral-900'}>
                    Customer.io
                  </div>
                  <span className={'text-xs font-medium text-neutral-500'}>vs Plunk →</span>
                </div>
              </Link>

              <Link href={'/vs/mailgun'} className={'group bg-white p-10 transition hover:bg-neutral-50'}>
                <div className={'flex flex-col items-center gap-4'}>
                  <div className={'text-2xl font-bold text-neutral-400 transition group-hover:text-neutral-900'}>
                    Mailgun
                  </div>
                  <span className={'text-xs font-medium text-neutral-500'}>vs Plunk →</span>
                </div>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Problem Statement */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-20 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              Most email tools weren't built to scale
            </h2>
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
                <Clock className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>Complex setup</h3>
              <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                Most email platforms take days to configure. Plunk is up and running in under 5 minutes.
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
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>Contact limits</h3>
              <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                Other platforms charge more as your list grows. Plunk stores unlimited contacts for free.
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
                <Lock className="h-5 w-5" />
              </div>
              <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>Vendor lock-in</h3>
              <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                Closed-source platforms own your stack. Plunk is AGPL-3.0 licensed and fully self-hostable.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-20 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Built for scale</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Everything you need to run email at any volume</p>
          </motion.div>

          <div className={'grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3'}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'group bg-white p-12 transition hover:bg-neutral-50'}
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

        {/* Unified Contacts */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              One contact, complete history
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Every interaction flows into a single contact record. Transactional emails, campaigns, and workflows, all
              tracked in one place.
            </p>
          </motion.div>

          <div className={'mx-auto mt-20 max-w-5xl'}>
            {/* Email types */}
            <div className={'grid gap-8 lg:grid-cols-3'}>
              {/* Transactional */}
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8 text-center'}
              >
                <div
                  className={'mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-900 text-white'}
                >
                  <Send className="h-8 w-8" />
                </div>
                <h3 className={'mt-4 font-semibold text-neutral-900'}>Transactional</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>Receipts, password resets</p>
              </motion.div>

              {/* Campaigns */}
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8 text-center'}
              >
                <div
                  className={'mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-900 text-white'}
                >
                  <Megaphone className="h-8 w-8" />
                </div>
                <h3 className={'mt-4 font-semibold text-neutral-900'}>Campaigns</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>Newsletters, announcements</p>
              </motion.div>

              {/* Workflows */}
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8 text-center'}
              >
                <div
                  className={'mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-900 text-white'}
                >
                  <Workflow className="h-8 w-8" />
                </div>
                <h3 className={'mt-4 font-semibold text-neutral-900'}>Workflows</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>Onboarding, drip sequences</p>
              </motion.div>
            </div>

            {/* Arrows */}
            <div className={'relative my-12'}>
              <svg className={'mx-auto h-32 w-full'} viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#a3a3a3" />
                  </marker>
                </defs>

                {/* Left arrow - smooth curve */}
                <motion.path
                  d="M 100 0 Q 150 60, 250 110"
                  stroke="#d4d4d4"
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{pathLength: 0}}
                  whileInView={{pathLength: 1}}
                  viewport={{once: true}}
                  transition={{duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1]}}
                />

                {/* Center arrow - straight */}
                <motion.path
                  d="M 300 0 L 300 110"
                  stroke="#d4d4d4"
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{pathLength: 0}}
                  whileInView={{pathLength: 1}}
                  viewport={{once: true}}
                  transition={{duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1]}}
                />

                {/* Right arrow - smooth curve */}
                <motion.path
                  d="M 500 0 Q 450 60, 350 110"
                  stroke="#d4d4d4"
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{pathLength: 0}}
                  whileInView={{pathLength: 1}}
                  viewport={{once: true}}
                  transition={{duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1]}}
                />
              </svg>
            </div>

            {/* Contact */}
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1]}}
              className={'mx-auto max-w-xl'}
            >
              <div className={'rounded-lg border border-neutral-200 bg-white'}>
                <div className={'flex items-center gap-6 p-8'}>
                  <div
                    className={'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900'}
                  >
                    <User className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                  <div className={'flex-1 space-y-1'}>
                    <div className={'font-mono text-base font-medium text-neutral-900'}>hello@useplunk.com</div>
                  </div>
                </div>
                <div className={'grid grid-cols-3 gap-px border-t border-neutral-200 bg-neutral-200'}>
                  <div className={'bg-white px-4 py-3 text-center'}>
                    <div className={'text-lg font-bold text-neutral-900'}>1,247</div>
                    <div className={'text-xs text-neutral-500'}>Emails received</div>
                  </div>
                  <div className={'bg-white px-4 py-3 text-center'}>
                    <div className={'text-lg font-bold text-neutral-900'}>89%</div>
                    <div className={'text-xs text-neutral-500'}>Open rate</div>
                  </div>
                  <div className={'bg-white px-4 py-3 text-center'}>
                    <div className={'text-lg font-bold text-neutral-900'}>12</div>
                    <div className={'text-xs text-neutral-500'}>Workflows</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Open Source */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              Open source, privacy first
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              AGPL-3.0 licensed, EU-hosted, and GDPR compliant. Inspect the code, self-host on your own infrastructure,
              or use our cloud.
            </p>

            <div className={'mt-16 grid gap-px bg-neutral-200 sm:grid-cols-3'}>
              <div className={'bg-white p-12'}>
                <div
                  className={'mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-900 text-white'}
                >
                  <PackageOpen className={'h-7 w-7'} />
                </div>
                <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>Open Source</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>AGPL-3.0 licensed</p>
                <p className={'mt-4 text-xs text-neutral-500'}>5K+ stars on GitHub</p>
              </div>
              <div className={'bg-white p-12'}>
                <div
                  className={'mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-900 text-white'}
                >
                  <Shield className={'h-7 w-7'} />
                </div>
                <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>Privacy First</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>EU hosted</p>
                <p className={'mt-4 text-xs text-neutral-500'}>GDPR compliant</p>
              </div>
              <div className={'bg-white p-12'}>
                <div
                  className={'mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-900 text-white'}
                >
                  <Globe className={'h-7 w-7'} />
                </div>
                <h3 className={'mt-6 text-lg font-semibold text-neutral-900'}>Self-Hostable</h3>
                <p className={'mt-2 text-sm text-neutral-600'}>Deploy anywhere</p>
                <p className={'mt-4 text-xs text-neutral-500'}>Docker Compose ready</p>
              </div>
            </div>

            <div className={'mt-12 flex flex-wrap justify-center gap-4'}>
              <motion.a
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                href={'https://github.com/useplunk/plunk'}
                target={'_blank'}
                className={
                  'group inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'
                }
              >
                View on GitHub
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </div>
          </motion.div>
        </section>

        {/* Pricing */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>
              Simple, transparent pricing
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Pay for what you use, nothing more. No surprises at scale.
            </p>

            <div className={'mt-20'}>
              <div className={'flex items-baseline justify-center gap-3'}>
                <span className={'text-7xl font-bold tracking-tight text-neutral-900'}>$0.001</span>
                <span className={'text-2xl text-neutral-500'}>/email</span>
              </div>

              <div className="mx-auto mt-20 max-w-4xl">
                <div className="grid gap-8 sm:grid-cols-3">
                  <div className="flex flex-col items-center gap-y-2">
                    <svg role="img" className="h-8 w-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <title>MailChimp</title>
                      <path d="M11.267 0C6.791-.015-1.82 10.246 1.397 12.964l.79.669a3.88 3.88 0 0 0-.22 1.792c.084.84.518 1.644 1.22 2.266.666.59 1.542.964 2.392.964 1.406 3.24 4.62 5.228 8.386 5.34 4.04.12 7.433-1.776 8.854-5.182.093-.24.488-1.316.488-2.267 0-.956-.54-1.352-.885-1.352-.01-.037-.078-.286-.172-.586-.093-.3-.19-.51-.19-.51.375-.563.382-1.065.332-1.35-.053-.353-.2-.653-.496-.964-.296-.311-.902-.63-1.753-.868l-.446-.124c-.002-.019-.024-1.053-.043-1.497-.014-.32-.042-.822-.197-1.315-.186-.668-.508-1.253-.911-1.627 1.112-1.152 1.806-2.422 1.804-3.511-.003-2.095-2.576-2.729-5.746-1.416l-.672.285A678.22 678.22 0 0 0 12.7.504C12.304.159 11.817.002 11.267 0zm.073.873c.166 0 .322.019.465.058.297.084 1.28 1.224 1.28 1.224s-1.826 1.013-3.52 2.426c-2.28 1.757-4.005 4.311-5.037 7.082-.811.158-1.526.618-1.963 1.253-.261-.218-.748-.64-.834-.804-.698-1.326.761-3.902 1.781-5.357C5.834 3.44 9.37.867 11.34.873zm3.286 3.273c.04-.002.06.05.028.074-.143.11-.299.26-.413.414a.04.04 0 0 0 .031.064c.659.004 1.587.235 2.192.574.041.023.012.103-.034.092-.915-.21-2.414-.369-3.97.01-1.39.34-2.45.863-3.224 1.426-.04.028-.086-.023-.055-.06.896-1.035 1.999-1.935 2.987-2.44.034-.018.07.019.052.052-.079.143-.23.447-.278.678-.007.035.032.063.062.042.615-.42 1.684-.868 2.622-.926zm3.023 3.205l.056.001a.896.896 0 0 1 .456.146c.534.355.61 1.216.638 1.845.015.36.059 1.229.074 1.478.034.571.184.651.487.751.17.057.33.098.563.164.706.198 1.125.4 1.39.658.157.162.23.333.253.497.083.608-.472 1.36-1.942 2.041-1.607.746-3.557.935-4.904.785l-.471-.053c-1.078-.145-1.693 1.247-1.046 2.201.417.615 1.552 1.015 2.688 1.015 2.604 0 4.605-1.111 5.35-2.072a.987.987 0 0 0 .06-.085c.036-.055.006-.085-.04-.054-.608.416-3.31 2.069-6.2 1.571 0 0-.351-.057-.672-.182-.255-.1-.788-.344-.853-.891 2.333.72 3.801.039 3.801.039a.072.072 0 0 0 .042-.072.067.067 0 0 0-.074-.06s-1.911.283-3.718-.378c.197-.64.72-.408 1.51-.345a11.045 11.045 0 0 0 3.647-.394c.818-.234 1.892-.697 2.727-1.356.281.618.38 1.299.38 1.299s.219-.04.4.073c.173.106.299.326.213.895-.176 1.063-.628 1.926-1.387 2.72a5.714 5.714 0 0 1-1.666 1.244c-.34.18-.704.334-1.087.46-2.863.935-5.794-.093-6.739-2.3a3.545 3.545 0 0 1-.189-.522c-.403-1.455-.06-3.2 1.008-4.299.065-.07.132-.153.132-.256 0-.087-.055-.179-.102-.243-.374-.543-1.669-1.466-1.409-3.254.187-1.284 1.31-2.189 2.357-2.135.089.004.177.01.266.015.453.027.85.085 1.223.1.625.028 1.187-.063 1.853-.618.225-.187.405-.35.71-.401.028-.005.092-.028.215-.028zm.022 2.18a.42.42 0 0 0-.06.005c-.335.054-.347.468-.228 1.04.068.32.187.595.32.765.175-.02.343-.022.498 0 .089-.205.104-.557.024-.942-.112-.535-.261-.872-.554-.868zm-3.66 1.546a1.724 1.724 0 0 0-1.016.326c-.16.117-.311.28-.29.378.008.032.031.056.088.063.131.015.592-.217 1.122-.25.374-.023.684.094.923.2.239.104.386.173.443.113.037-.038.026-.11-.031-.204-.118-.192-.36-.387-.618-.497a1.601 1.601 0 0 0-.621-.129zm4.082.81c-.171-.003-.313.186-.317.42-.004.236.131.43.303.432.172.003.314-.185.318-.42.004-.236-.132-.429-.304-.432zm-3.58.172c-.05 0-.102.002-.155.008-.311.05-.483.152-.593.247-.094.082-.152.173-.152.237a.075.075 0 0 0 .075.076c.07 0 .228-.063.228-.063a1.98 1.98 0 0 1 1.001-.104c.157.018.23.027.265-.026.01-.016.022-.049-.01-.1-.063-.103-.311-.269-.66-.275zm2.26.4c-.127 0-.235.051-.283.148-.075.154.035.363.246.466.21.104.443.063.52-.09.075-.155-.035-.364-.246-.467a.542.542 0 0 0-.237-.058zm-11.635.024c.048 0 .098 0 .149.003.73.04 1.806.6 2.052 2.19.217 1.41-.128 2.843-1.449 3.069-.123.02-.248.029-.374.026-1.22-.033-2.539-1.132-2.67-2.435-.145-1.44.591-2.548 1.894-2.811.117-.024.252-.04.398-.042zm-.07.927a1.144 1.144 0 0 0-.847.364c-.38.418-.439.988-.366 1.19.027.073.07.094.1.098.064.008.16-.039.22-.2a1.2 1.2 0 0 0 .017-.052 1.58 1.58 0 0 1 .157-.37.689.689 0 0 1 .955-.199c.266.174.369.5.255.81-.058.161-.154.469-.133.721.043.511.357.717.64.738.274.01.466-.143.515-.256.029-.067.005-.107-.011-.125-.043-.053-.113-.037-.18-.021a.638.638 0 0 1-.16.022.347.347 0 0 1-.294-.148c-.078-.12-.073-.3.013-.504.011-.028.025-.058.04-.092.138-.308.368-.825.11-1.317-.195-.37-.513-.602-.894-.65a1.135 1.135 0 0 0-.138-.01z"></path>
                    </svg>
                    <span className="text-sm font-medium">Mailchimp</span>
                    <span className="text-sm text-neutral-500">$0,004 / email</span>
                    <span className="text-sm text-neutral-500">Standard plan</span>
                  </div>
                  <div className="flex flex-col items-center gap-y-2">
                    <svg role="img" viewBox="0 0 24 24" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg">
                      <title>Twilio Sendgrid</title>
                      <path d="M12 0C5.381-.008.008 5.352 0 11.971V12c0 6.64 5.359 12 12 12 6.64 0 12-5.36 12-12 0-6.641-5.36-12-12-12zm0 20.801c-4.846.015-8.786-3.904-8.801-8.75V12c-.014-4.846 3.904-8.786 8.75-8.801H12c4.847-.014 8.786 3.904 8.801 8.75V12c.015 4.847-3.904 8.786-8.75 8.801H12zm5.44-11.76c0 1.359-1.12 2.479-2.481 2.479-1.366-.007-2.472-1.113-2.479-2.479 0-1.361 1.12-2.481 2.479-2.481 1.361 0 2.481 1.12 2.481 2.481zm0 5.919c0 1.36-1.12 2.48-2.481 2.48-1.367-.008-2.473-1.114-2.479-2.48 0-1.359 1.12-2.479 2.479-2.479 1.361-.001 2.481 1.12 2.481 2.479zm-5.919 0c0 1.36-1.12 2.48-2.479 2.48-1.368-.007-2.475-1.113-2.481-2.48 0-1.359 1.12-2.479 2.481-2.479 1.358-.001 2.479 1.12 2.479 2.479zm0-5.919c0 1.359-1.12 2.479-2.479 2.479-1.367-.007-2.475-1.112-2.481-2.479 0-1.361 1.12-2.481 2.481-2.481 1.358 0 2.479 1.12 2.479 2.481z"></path>
                    </svg>
                    <span className="text-sm font-medium">Twilio Sendgrid</span>
                    <span className="text-sm text-neutral-500">$0,002 / email</span>
                    <span className="text-sm text-neutral-500">Essentials plan</span>
                  </div>
                  <div className="flex flex-col items-center gap-y-2">
                    <svg role="img" viewBox="0 0 24 24" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg">
                      <title>Mailgun</title>
                      <path d="M11.837 0c6.602 0 11.984 5.381 11.984 11.994-.017 2.99-3.264 4.84-5.844 3.331a3.805 3.805 0 0 1-.06-.035l-.055-.033-.022.055c-2.554 4.63-9.162 4.758-11.894.232-2.732-4.527.46-10.313 5.746-10.416a6.868 6.868 0 0 1 7.002 6.866 1.265 1.265 0 0 0 2.52 0c0-5.18-4.197-9.38-9.377-9.387C4.611 2.594.081 10.41 3.683 16.673c3.238 5.632 11.08 6.351 15.289 1.402l1.997 1.686A11.95 11.95 0 0 1 11.837 24C2.6 23.72-2.87 13.543 1.992 5.684A12.006 12.006 0 0 1 11.837 0Zm0 7.745c-3.276-.163-5.5 3.281-4.003 6.2a4.26 4.26 0 0 0 4.014 2.31c3.276-.171 5.137-3.824 3.35-6.575a4.26 4.26 0 0 0-3.36-1.935Zm0 2.53c1.324 0 2.152 1.433 1.49 2.58a1.72 1.72 0 0 1-1.49.86 1.72 1.72 0 1 1 0-3.44Z"></path>
                    </svg>
                    <span className="text-sm font-medium">Mailgun</span>
                    <span className="text-sm text-neutral-500">$0,003 / email</span>
                    <span className="text-sm text-neutral-500">Foundation plan</span>
                  </div>
                  <p className="text-balance text-center text-xs text-neutral-400 sm:col-span-3">
                    Calculated based on the plan that best matches the features of Plunk at 10.000 emails per month.
                  </p>
                </div>
              </div>

              <div className={'mt-16 flex flex-wrap justify-center gap-4'}>
                <Link
                  href={'/pricing'}
                  className={
                    'rounded-lg border border-neutral-300 px-8 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'
                  }
                >
                  View pricing details
                </Link>
                <a
                  href={`${DASHBOARD_URI}/auth/signup`}
                  className={
                    'rounded-lg bg-neutral-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-neutral-900/10 transition hover:bg-neutral-800'
                  }
                >
                  Start for free
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Testimonials */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
          >
            <div className={'mb-20 text-center'}>
              <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Trusted by the best</h2>
            </div>

            <div className={'grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3'}>
              {testimonials.map((t, index) => (
                <motion.div
                  key={index}
                  initial={{opacity: 0, y: 20}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                  className={'flex flex-col bg-white p-10'}
                >
                  <div className={'mb-2 font-serif text-5xl leading-none text-neutral-200'}>&ldquo;</div>
                  <p className={'text-sm leading-relaxed text-neutral-700'}>{t.testimonial}</p>
                  <div className={'mt-auto flex items-center gap-4 pt-6'}>
                    <div className={'relative h-12 w-12 overflow-hidden rounded-full'}>
                      <Image src={t.image} alt={t.author} placeholder="blur" className={'object-cover'} />
                    </div>
                    <div>
                      <div className={'text-sm font-semibold text-neutral-900'}>{t.author}</div>
                      <div className={'text-xs text-neutral-500'}>{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

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
              Start sending in 5 minutes
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              1,000 emails free every month. Then $0.001 per email. No contact limits, no surprises.
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
                Create free account
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
