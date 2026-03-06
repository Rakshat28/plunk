import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import React from 'react';
import Link from 'next/link';
import {ArrowRight, Code2, Eye, Mail, Palette, Sparkles, Type, Zap} from 'lucide-react';
import Head from 'next/head';

const features = [
  {
    icon: <Type className="h-5 w-5" />,
    title: 'Visual WYSIWYG Editor',
    description:
      'Rich text editing with formatting toolbar. Bold, italic, headings, lists, links, images, and tables. No code required.',
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: 'Full HTML Editor',
    description:
      'Syntax highlighting, auto-completion, and bracket matching. Write custom HTML when you need complete control.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Smart Mode Switching',
    description:
      'Automatically detects complex HTML and switches to code mode. Warns you before changes that would lose custom formatting.',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Powerful Variables',
    description:
      'Autocomplete with {{variable}} syntax. Supports fallbacks, nested properties, and custom contact fields.',
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'Live Preview',
    description: 'Preview with real contact data. Test on desktop, tablet, and mobile views before sending.',
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: 'Email-Safe HTML',
    description: 'Automatic CSS inlining and email-client-friendly code generation. Yes, even in Outlook.',
  },
];

const useCases = [
  {
    icon: <Code2 className="h-6 w-6" />,
    title: 'For Developers',
    description:
      'Full HTML control when you need it. Powerful variable system with autocomplete and fallbacks. Use templates in API calls, workflows, and campaigns.',
    example: 'Password resets → API-triggered alerts → Webhook notifications → Those cat meme attachments',
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: 'For Marketers',
    description:
      'Visual editor for quick changes. Live preview with real customer data. Create professional emails without waiting for developers.',
    example: 'Product announcements → Newsletter campaigns → Promotional emails → Customer onboarding',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'For Teams',
    description:
      'One tool for everyone. Developers can code, marketers can design, everyone can preview. Reusable templates across campaigns and workflows.',
    example: 'Launch announcements → Feature updates → User engagement → Lifecycle emails',
  },
];

/**
 *
 */
export default function EmailEditorFeature() {
  return (
    <>
      <Head>
        <title>Email Editor - Create Beautiful Emails Without Fighting Your Tools | Plunk</title>
        <meta
          name="description"
          content="The email editor that speaks both languages. Switch seamlessly between visual and code editing, preview with real data, and create templates that work everywhere."
        />
        <meta
          property="og:title"
          content="Email Editor - Create Beautiful Emails Without Fighting Your Tools | Plunk"
        />
        <meta
          property="og:description"
          content="The email editor that speaks both languages. Switch seamlessly between visual and code editing, preview with real data, and create templates that work everywhere."
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
              <Mail className="h-4 w-4 text-neutral-600" />
              <span className={'font-medium text-neutral-600'}>Email Editor & Templates</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl text-balance'}>
              The Email Editor
              <br />
              That Speaks Both Languages
            </h1>
            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Switch seamlessly between visual and code editing. Preview with real customer data. Create templates that
              work everywhere.
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
                  Try the editor free
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
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>
              Two editors, one experience
            </h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Visual editing for speed, code editing for control</p>
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

        {/* How It Works */}
        <section className={'py-20'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'mx-auto max-w-4xl text-center'}
          >
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>
              From first draft to send
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>Create, preview, and deploy templates in minutes</p>
          </motion.div>

          <div className={'mx-auto mt-16 max-w-5xl'}>
            <div className={'grid gap-12 lg:grid-cols-3'}>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
              >
                <div className={'mb-5 flex items-center gap-4'}>
                  <div className={'flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-xl font-bold text-neutral-900'}>
                    1
                  </div>
                </div>
                <h3 className={'text-lg font-semibold text-neutral-900'}>Create your template</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                  Use the visual editor for quick formatting or write custom HTML. Add variables with autocomplete.
                </p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
              >
                <div className={'mb-5 flex items-center gap-4'}>
                  <div className={'flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-xl font-bold text-neutral-900'}>
                    2
                  </div>
                </div>
                <h3 className={'text-lg font-semibold text-neutral-900'}>Preview with real data</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                  Select any contact and see exactly what they'll receive. Test on desktop, tablet, and mobile. No
                  surprises.
                </p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1]}}
              >
                <div className={'mb-5 flex items-center gap-4'}>
                  <div className={'flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-xl font-bold text-neutral-900'}>
                    3
                  </div>
                </div>
                <h3 className={'text-lg font-semibold text-neutral-900'}>Use everywhere</h3>
                <p className={'mt-2 text-sm leading-relaxed text-neutral-600'}>
                  Use your template in campaigns, workflows, and API calls. One template, unlimited uses.
                </p>
              </motion.div>
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
            <h2 className={'text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl text-balance'}>Built for every team</h2>
            <p className={'mt-4 text-lg text-neutral-600'}>Whether you're a developer, marketer, or founder</p>
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
                    <div className={'mt-4 rounded-lg bg-neutral-50 p-4'}>
                      <p className={'text-sm text-neutral-700'}>{useCase.example}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
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
              Build your first template today
            </h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              1,000 emails free every month. Then $0.001 per email. No contact limits, no credit card required.
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
                  Get started for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
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
