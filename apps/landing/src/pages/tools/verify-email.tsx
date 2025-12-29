import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI} from '../../lib/constants';
import React, {useState} from 'react';
import {NextSeo} from 'next-seo';
import {ArrowRight, CheckCircle, Loader2, Search} from 'lucide-react';
import {type EmailVerificationResult as VerificationResult, verifyEmail} from '../../lib/emailVerification';
import {EmailVerificationResult} from '../../components/tools/EmailVerificationResult';
import {Button, Input} from '@plunk/ui';
import {EMAIL_VERIFICATION_FEATURES} from '../../lib/toolsContent';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const verificationResult = await verifyEmail(email);
      setResult(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NextSeo
        title="Free Email Verification Tool | Check Email Validity | Plunk"
        description="Verify email addresses instantly. Check for typos, disposable domains, MX records, and more. Free email validation tool with detailed results."
        canonical="https://www.useplunk.com/tools/verify-email"
        openGraph={{
          title: 'Free Email Verification Tool | Check Email Validity | Plunk',
          description: 'Verify email addresses instantly. Check for typos, disposable domains, MX records, and more.',
          url: 'https://www.useplunk.com/tools/verify-email',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk Email Verification Tool'}],
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
              <Search className="h-4 w-4 text-neutral-600" />
              <span className={'text-sm text-neutral-600'}>Free Tool</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl'}>
              Email Verification
              <br />
              Tool
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Verify email addresses instantly. Check for typos, disposable domains, DNS configuration, and more. Get
              detailed verification results in seconds.
            </p>
          </motion.div>
        </section>

        {/* Verification Tool Section */}
        <section className={'pb-16'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-2xl'}
          >
            {/* Input Form */}
            <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-lg">
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <Button type="submit" disabled={loading || !email} className="w-full gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Verify Email
                    </>
                  )}
                </Button>
              </form>

              {/* Error Display */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Results Display */}
            {result && (
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="mt-8"
              >
                <EmailVerificationResult result={result} />
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Educational Content */}
        <section className={'border-t border-neutral-200 py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mb-16 text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>Why verify email addresses?</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>
              Email verification helps improve deliverability and protect your sender reputation.
            </p>
          </motion.div>

          <div className={'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'}>
            {EMAIL_VERIFICATION_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{opacity: 0, y: 20}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1]}}
                  className={
                    'group block h-full rounded-2xl border border-neutral-200 bg-white p-8 transition hover:border-neutral-300 hover:shadow-lg'
                  }
                >
                  <div
                    className={'flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white mb-4'}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={'text-xl font-semibold text-neutral-900 mb-2'}>{feature.title}</h3>
                  <p className={'text-sm text-neutral-600 leading-relaxed'}>{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className={'border-t border-neutral-200 py-32'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-3xl text-center'}
          >
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900'}>
              Ready for production-grade email verification?
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              This tool is great for testing individual emails, but Plunk offers bulk verification, real-time
              validation, and seamless integration with your email workflows. Start free, no credit card required.
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
                  Start with Plunk
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.a>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
