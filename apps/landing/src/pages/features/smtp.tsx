import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {ArrowRight, Code2, Lock, Mail, Server, Settings, Shield} from 'lucide-react';
import Head from 'next/head';

const features = [
  {
    icon: <Settings className="h-5 w-5" />,
    title: 'Simple Configuration',
    description: 'Quick setup with your project credentials. Works with any email client or application.',
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Secure Connections',
    description: 'TLS/SSL encryption on ports 465 and 587. Your emails are always transmitted securely.',
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Universal Compatibility',
    description:
      'Works with Outlook, Thunderbird, Apple Mail, or any SMTP-compatible application. Even that ancient email client from 2005.',
  },
  {
    icon: <Server className="h-5 w-5" />,
    title: 'Domain Validation',
    description: 'Automatic verification that your sender domain is verified before accepting emails.',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Full Feature Support',
    description:
      'Attachments, custom headers, HTML emails, and multiple recipients. Send those cat memes with confidence.',
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: 'Same Infrastructure',
    description: 'SMTP emails use the same reliable delivery infrastructure as API emails with full tracking.',
  },
];

const comparisonData = [
  {feature: 'Protocol', traditional: 'SMTP', plunkSMTP: 'SMTP', plunkAPI: 'HTTP/REST'},
  {feature: 'Setup Complexity', traditional: 'Medium', plunkSMTP: 'Easy', plunkAPI: 'Easy'},
  {feature: 'Tracking & Analytics', traditional: '✗', plunkSMTP: '✓', plunkAPI: '✓'},
  {feature: 'Works with Email Clients', traditional: '✓', plunkSMTP: '✓', plunkAPI: '✗'},
  {feature: 'Domain Verification', traditional: 'Manual', plunkSMTP: 'Automatic', plunkAPI: 'Automatic'},
  {feature: 'Attachments', traditional: '✓', plunkSMTP: '✓', plunkAPI: '✓'},
  {feature: 'Template Support', traditional: '✗', plunkSMTP: '✗', plunkAPI: '✓'},
  {feature: 'Workflow Automation', traditional: '✗', plunkSMTP: '✗', plunkAPI: '✓'},
];

const useCases = [
  {
    icon: <Settings className="h-6 w-6" />,
    title: 'Legacy System Integration',
    description:
      'Already have applications using SMTP? No need to rewrite code. Just swap your SMTP credentials and keep everything else the same. Your PM will love you.',
    benefit: 'Zero code changes required',
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'Email Client Sending',
    description:
      'Marketing teams can send emails directly from Outlook, Thunderbird, or Apple Mail using familiar tools without learning new APIs.',
    benefit: 'No technical knowledge needed',
  },
  {
    icon: <Code2 className="h-6 w-6" />,
    title: 'Framework Compatibility',
    description:
      'Works with any framework or language that supports SMTP. Perfect for older systems or platforms without HTTP API support.',
    benefit: 'Universal protocol support',
  },
];

/**
 *
 */
export default function SMTPFeature() {
  return (
    <>
      <Head>
        <title>SMTP Email Sending - Send via SMTP or API | Plunk</title>
        <meta
          name="description"
          content="Send emails via SMTP or API. Works with any email client or application. Secure TLS/SSL connections with automatic domain validation and full tracking."
        />
        <meta property="og:title" content="SMTP Email Sending - Flexible Sending Options | Plunk" />
        <meta
          property="og:description"
          content="Send emails via SMTP or API. Works with any email client or application. Secure TLS/SSL connections with automatic domain validation and full tracking."
        />
      </Head>

      <Navbar />

      <main className={'mx-auto max-w-7xl px-8 sm:px-0'}>
        {/* Hero Section */}
        <section className={'relative py-20 sm:py-32'}>
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
            <div className={'mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm'}>
              <Server className="h-4 w-4 text-neutral-600" />
              <span className={'font-medium text-neutral-600'}>SMTP Email Sending</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Send via SMTP
              <br />
              or API
            </h1>
            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Choose your preferred sending method. Use our HTTP API for modern apps or SMTP for email clients and
              legacy systems. Both options deliver the same great results.
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
                  Get SMTP credentials
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

        {/* Features Grid */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>Enterprise-ready SMTP</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>All the features you expect from a modern email platform</p>
          </motion.div>

          <div className={'grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3'}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'group bg-white p-10 transition hover:bg-neutral-50'}
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

        {/* SMTP Configuration */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl'}
          >
            <div className={'mb-12 text-center'}>
              <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>
                Simple SMTP configuration
              </h2>
              <p className={'mt-4 text-lg text-neutral-600'}>Everything you need to configure your email client</p>
            </div>

            <div className={'rounded-2xl border border-neutral-200 bg-white p-8 sm:p-12'}>
              <div className={'space-y-6'}>
                <div className={'flex items-start justify-between border-b border-neutral-200 pb-6'}>
                  <div>
                    <p className={'text-sm font-medium text-neutral-500'}>SMTP Server</p>
                    <p className={'mt-1 font-mono text-lg text-neutral-900'}>smtp.yourdomain.com</p>
                  </div>
                </div>
                <div className={'grid gap-6 border-b border-neutral-200 pb-6 sm:grid-cols-2'}>
                  <div>
                    <p className={'text-sm font-medium text-neutral-500'}>Port (STARTTLS)</p>
                    <p className={'mt-1 font-mono text-lg text-neutral-900'}>587</p>
                  </div>
                  <div>
                    <p className={'text-sm font-medium text-neutral-500'}>Port (TLS/SSL)</p>
                    <p className={'mt-1 font-mono text-lg text-neutral-900'}>465</p>
                  </div>
                </div>
                <div className={'grid gap-6 sm:grid-cols-2'}>
                  <div>
                    <p className={'text-sm font-medium text-neutral-500'}>Username</p>
                    <p className={'mt-1 font-mono text-lg text-neutral-900'}>plunk</p>
                  </div>
                  <div>
                    <p className={'text-sm font-medium text-neutral-500'}>Password</p>
                    <p className={'mt-1 font-mono text-lg text-neutral-900'}>sk_your_secret_key</p>
                  </div>
                </div>
              </div>
              <div className={'mt-8 rounded-lg bg-neutral-50 p-4'}>
                <p className={'text-sm text-neutral-600'}>
                  Find your SMTP credentials in your dashboard under Settings → SMTP. Your password is your project
                  secret key.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Comparison Table */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-12 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>SMTP vs API</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Choose the right option for your use case</p>
          </motion.div>

          <div className={'mx-auto max-w-4xl'}>
            <div className={'overflow-hidden rounded-xl border border-neutral-200 bg-white'}>
              <table className={'w-full'}>
                <thead className={'bg-neutral-50'}>
                  <tr>
                    <th className={'px-6 py-4 text-left text-sm font-semibold text-neutral-900'}>Feature</th>
                    <th className={'px-6 py-4 text-center text-sm font-semibold text-neutral-900'}>Traditional SMTP</th>
                    <th className={'bg-neutral-100 px-6 py-4 text-center text-sm font-semibold text-neutral-900'}>
                      Plunk SMTP
                    </th>
                    <th className={'px-6 py-4 text-center text-sm font-semibold text-neutral-900'}>Plunk API</th>
                  </tr>
                </thead>
                <tbody className={'divide-y divide-neutral-200'}>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className={'transition hover:bg-neutral-50'}>
                      <td className={'px-6 py-4 text-sm text-neutral-900'}>{row.feature}</td>
                      <td className={'px-6 py-4 text-center text-sm text-neutral-600'}>{row.traditional}</td>
                      <td className={'bg-neutral-50 px-6 py-4 text-center text-sm font-medium text-neutral-900'}>
                        {row.plunkSMTP}
                      </td>
                      <td className={'px-6 py-4 text-center text-sm text-neutral-600'}>{row.plunkAPI}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={'mt-6 rounded-lg bg-neutral-50 p-4 text-center'}>
              <p className={'text-sm text-neutral-600'}>
                <strong>Recommendation:</strong> Use API for modern applications with workflow automation. Use SMTP for
                email clients and legacy systems.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>When to use SMTP</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Perfect for these scenarios</p>
          </motion.div>

          <div className={'mx-auto max-w-5xl space-y-8'}>
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'rounded-xl border border-neutral-200 bg-white p-8'}
              >
                <div className={'flex items-start gap-6'}>
                  <div
                    className={
                      'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white'
                    }
                  >
                    {useCase.icon}
                  </div>
                  <div className={'flex-1'}>
                    <h3 className={'text-xl font-semibold text-neutral-900'}>{useCase.title}</h3>
                    <p className={'mt-2 text-neutral-600'}>{useCase.description}</p>
                    <div className={'mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2'}>
                      <div className={'h-2 w-2 rounded-full bg-green-500'} />
                      <span className={'text-sm font-medium text-neutral-700'}>{useCase.benefit}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={'border-t border-neutral-200 py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl'}>Start sending via SMTP</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              Get your SMTP credentials and start sending emails from any client or application. No credit card
              required.
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
                Get started for free
              </motion.a>
              <Link
                href={'/pricing'}
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
