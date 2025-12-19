import {NextSeo} from 'next-seo';
import React from 'react';
import {Footer, Navbar} from '../components';
import {motion} from 'framer-motion';

import {DASHBOARD_URI} from '../lib/constants';
import {GithubIcon} from 'lucide-react';

/**
 *
 */
export default function Index() {
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

      <div className={'mx-auto max-w-7xl px-8 sm:px-0'}>
        <main>
          <section className={'py-32'}>
            <div className={'mx-auto max-w-4xl text-center'}>
              <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
                Simple, transparent pricing
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-neutral-600">Start free, pay only for what you use</p>
            </div>

            {/* Pricing Tiers */}
            <div className="mx-auto mt-20 grid max-w-5xl gap-8 lg:grid-cols-2">
              {/* Free Tier */}
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
                className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-10 shadow-2xl"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

                <div className="relative flex flex-1 flex-col">
                  <div className="mb-6 inline-block self-start rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                    Free Forever
                  </div>

                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-6xl font-bold tracking-tight text-white">1,000</span>
                    <span className="text-xl font-medium text-white/60">emails</span>
                  </div>
                  <p className="mb-8 text-base text-white/60">per month</p>

                  <ul className="flex-1 space-y-3">
                    <li className="flex items-start gap-3 text-white/80">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Transactional emails</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Workflow automation</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Campaign broadcasts</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Custom domains</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Click & open tracking
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>No credit card required</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/60">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Plunk branding</span>
                    </li>
                  </ul>

                  <motion.a
                    href={`${DASHBOARD_URI}/auth/signup`}
                    whileHover={{scale: 1.02}}
                    whileTap={{scale: 0.98}}
                    className="mt-8 block w-full rounded-lg border-2 border-white bg-white px-6 py-3 text-center font-semibold text-neutral-900 transition hover:bg-white/90"
                  >
                    Start for free
                  </motion.a>
                </div>
              </motion.div>

              {/* Pay as you grow */}
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.3}}
                className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white p-10 shadow-lg"
              >
                <div className="mb-6 inline-block self-start rounded-full bg-neutral-100 px-4 py-1.5 text-sm font-semibold text-neutral-900">
                  Pay as you grow
                </div>

                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-6xl font-bold tracking-tight text-neutral-900">$0.001</span>
                  <span className="text-xl font-medium text-neutral-500">per email</span>
                </div>
                <p className="mb-8 text-base text-neutral-500">No contact limits, pay only for what you send</p>

                <ul className="flex-1 space-y-3">
                  <li className="flex items-start gap-3 text-neutral-600">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-600">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>No Plunk branding</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-600">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Billing limits</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-600">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Unlimited emails</span>
                  </li>
                </ul>

                <motion.a
                  href={`${DASHBOARD_URI}/auth/signup`}
                  whileHover={{scale: 1.02}}
                  whileTap={{scale: 0.98}}
                  className="mt-8 block w-full rounded-lg bg-neutral-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-neutral-800"
                >
                  Start for free
                </motion.a>
              </motion.div>
            </div>

            {/* Features Grid */}
            <div className="mx-auto mt-24 max-w-5xl">
              <h2 className="mb-12 text-center text-2xl font-bold text-neutral-900">Everything included</h2>
              <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">Unlimited emails</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Send unlimited transactional, campaign, and automated emails
                  </p>
                </div>
                <div className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">Unlimited contacts</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    No limits on your audience size. Grow without restrictions
                  </p>
                </div>
                <div className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">Custom domains</h3>
                  <p className="mt-2 text-sm text-neutral-600">Send from your own domain with full authentication</p>
                </div>
                <div className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">Analytics & tracking</h3>
                  <p className="mt-2 text-sm text-neutral-600">Detailed metrics on opens, clicks, and conversions</p>
                </div>
                <div className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">Workflow automation</h3>
                  <p className="mt-2 text-sm text-neutral-600">Build complex email sequences with visual editor</p>
                </div>
                <div className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">API access</h3>
                  <p className="mt-2 text-sm text-neutral-600">Full REST API with comprehensive documentation</p>
                </div>
              </div>

              <div className="mt-12 overflow-hidden rounded-lg border border-neutral-200">
                <div className="flex flex-col items-center space-y-6 p-10 sm:flex-row sm:space-y-0">
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className={'text-2xl font-bold text-neutral-900'}>Self-host</h2>
                    <p className={'mt-2 text-neutral-600'}>
                      Host Plunk on your own infrastructure. The perfect solution for when you require full control.
                    </p>
                  </div>
                  <div className={'sm:ml-auto'}>
                    <motion.button
                      onClick={() => {
                        window.open('https://github.com/useplunk/plunk', '_blank');
                      }}
                      whileHover={{scale: 1.02}}
                      whileTap={{scale: 0.98}}
                      className={
                        'flex w-full items-center justify-center gap-x-3 rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 sm:w-auto'
                      }
                    >
                      <GithubIcon size={20} />
                      View GitHub
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}
