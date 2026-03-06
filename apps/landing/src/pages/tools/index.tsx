import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {NextSeo} from 'next-seo';
import {ArrowRight, Code2, Mail, Search, Sparkles, Wrench} from 'lucide-react';

const tools = [
  {
    name: 'Markdown to Email',
    slug: 'markdown-to-email',
    description: 'Convert rich text to email-safe HTML with our visual editor and instant preview.',
    features: ['Visual Editor', 'Email-Safe HTML', 'Inline CSS', 'Copy to Clipboard'],
    icon: Code2,
  },
  {
    name: 'Email Verification',
    slug: 'verify-email',
    description: 'Verify email addresses instantly. Check DNS, MX records, typos, and disposable domains.',
    features: ['DNS Validation', 'Typo Detection', 'MX Records', 'Disposable Check'],
    icon: Search,
  },
];

/**
 * Free Email Tools index page
 */
export default function ToolsIndex() {
  return (
    <>
      <NextSeo
        title="Free Email Tools | Markdown to Email & Email Verification | Plunk"
        description="Free tools for email developers: Convert markdown to email-safe HTML and verify email addresses instantly. No sign-up required."
        canonical="https://next.useplunk.com/tools"
        openGraph={{
          title: 'Free Email Tools | Markdown to Email & Email Verification | Plunk',
          description:
            'Free tools for email developers: Convert markdown to email-safe HTML and verify email addresses instantly.',
          url: 'https://next.useplunk.com/tools',
          images: [{url: 'https://next.useplunk.com/assets/card.png', alt: 'Plunk Email Tools'}],
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
              <Wrench className="h-4 w-4 text-neutral-600" />
              <span className={'text-sm text-neutral-600'}>Free Email Tools</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl text-balance'}>
              Free tools for
              <br />
              email developers
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Build better emails with our free tools. Convert markdown to email-safe HTML, verify email addresses, and
              more. No sign-up required.
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
                href="/guides"
                className={
                  'rounded-lg border border-neutral-300 bg-white px-8 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-400'
                }
              >
                Browse guides
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Tools Grid */}
        <section className={'py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Available Tools</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Everything you need to work with emails</p>
          </motion.div>

          <div className={'grid gap-8 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto'}>
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                  <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                    className={
                      'group rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg cursor-pointer h-full'
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
                      <Sparkles className="h-5 w-5 text-neutral-400" />
                    </div>
                    <h3 className={'text-2xl font-bold text-neutral-900 mb-3'}>{tool.name}</h3>
                    <p className={'mb-6 leading-relaxed text-neutral-600'}>{tool.description}</p>
                    <div className={'space-y-2'}>
                      {tool.features.map(feature => (
                        <div key={feature} className={'flex items-center gap-2 text-sm text-neutral-600'}>
                          <div className={'h-1.5 w-1.5 rounded-full bg-neutral-900'} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Why Use These Tools */}
        <section className={'border-t border-neutral-200 py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Why use these tools?</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Built by email experts for email developers</p>
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
              <h3 className={'text-2xl font-bold text-neutral-900'}>Free Forever</h3>
              <p className={'mt-4 leading-relaxed text-neutral-600'}>
                No sign-up, no paywalls, no limits. Use our tools as much as you need, completely free. We believe in
                giving back to the email development community.
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
              <Code2 className="h-8 w-8 text-green-500 mb-4" />
              <h3 className={'text-2xl font-bold text-neutral-900'}>Developer-Focused</h3>
              <p className={'mt-4 leading-relaxed text-neutral-600'}>
                Built by developers who work with email every day. Clean outputs, instant results, and designed for
                real-world email workflows.
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
              <Sparkles className="h-8 w-8 text-yellow-500 mb-4" />
              <h3 className={'text-2xl font-bold text-neutral-900'}>Production Ready</h3>
              <p className={'mt-4 leading-relaxed text-neutral-600'}>
                Generate email-safe HTML that works across all email clients. Verify emails with industry-standard
                checks. Our tools are battle-tested and used by thousands of developers.
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Need production-grade email tools?</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              These free tools are great for development, but Plunk offers so much more: templates, scheduling,
              automation, analytics, and deliverability optimization. Start free, scale as you grow.
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
                Start with Plunk
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
