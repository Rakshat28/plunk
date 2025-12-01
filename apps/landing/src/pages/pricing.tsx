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
          'Transparent email pricing at $0.001 per email with no contact limits. Free plan includes 3,000 emails/month. No hidden fees, pay only for what you use.'
        }
        openGraph={{
          title: 'Plunk Pricing | The Open-Source Email Platform',
          description:
            'Transparent email pricing at $0.001 per email with no contact limits. Free plan includes 3,000 emails/month. No hidden fees, pay only for what you use.',
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

            {/* Main Pricing Display */}
            <div className="mx-auto mt-20 max-w-2xl text-center">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-7xl font-bold tracking-tight text-neutral-900">$0.001</span>
                <span className="text-2xl text-neutral-500">/email</span>
              </div>

              <motion.a
                href={`${DASHBOARD_URI}/auth/signup`}
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                className={
                  'mx-auto mt-10 inline-block rounded-lg bg-neutral-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800'
                }
              >
                Get started for free
              </motion.a>
            </div>

            {/* Features Grid */}
            <div className="mx-auto mt-20 max-w-5xl">
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
