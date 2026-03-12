import {Footer, Navbar} from '../../components';
import {motion} from 'framer-motion';
import {DASHBOARD_URI} from '../../lib/constants';
import React, {useMemo, useState} from 'react';
import {NextSeo} from 'next-seo';
import {ArrowRight, Check, Code2, Copy, Sparkles} from 'lucide-react';
import {MarkdownEmailEditor} from '../../components/tools/MarkdownEmailEditor';
import {convertToCompleteEmailHtml} from '../../lib/emailHtmlConverter';
import {Button} from '@plunk/ui';

export default function MarkdownToEmail() {
  const [editorContent, setEditorContent] = useState('<p>Hello!</p><p>Try editing this text...</p>');
  const [copied, setCopied] = useState(false);

  // Convert editor content to complete, ready-to-send email HTML
  const emailSafeHtml = useMemo(() => {
    return convertToCompleteEmailHtml(editorContent);
  }, [editorContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emailSafeHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <NextSeo
        title="Free Markdown to Email HTML Converter | Plunk"
        description="Convert markdown and rich text to email-safe HTML instantly. Free online tool with live preview. Perfect for email developers and marketers."
        canonical="https://www.useplunk.com/tools/markdown-to-email"
        openGraph={{
          title: 'Free Markdown to Email HTML Converter | Plunk',
          description:
            'Convert markdown and rich text to email-safe HTML instantly. Free online tool with live preview.',
          url: 'https://www.useplunk.com/tools/markdown-to-email',
          images: [{url: 'https://www.useplunk.com/assets/card.png', alt: 'Plunk Email HTML Converter'}],
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
              <Sparkles className="h-4 w-4 text-neutral-600" />
              <span className={'text-sm text-neutral-600'}>Free Tool</span>
            </div>

            <h1 className={'text-6xl font-bold tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl text-balance'}>
              Markdown to Email
              <br />
              HTML Converter
            </h1>

            <p className={'mx-auto mt-8 max-w-2xl text-xl text-neutral-600'}>
              Create beautiful, email-safe HTML instantly. Format your text with our visual editor and get
              production-ready HTML with inlined styles that works across all email clients.
            </p>
          </motion.div>
        </section>

        {/* Editor Section */}
        <section className={'py-16'}>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
            className={'grid gap-6 lg:grid-cols-2'}
          >
            {/* Left: Editor */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Visual Editor</h2>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Code2 className="h-4 w-4" />
                  <span>Format your content</span>
                </div>
              </div>
              <MarkdownEmailEditor value={editorContent} onChange={setEditorContent} />
            </div>

            {/* Right: Email-Safe HTML Output */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Email-Safe HTML</h2>
                <Button onClick={handleCopy} size="sm" variant="outline" className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                <pre className="p-4 text-xs font-mono overflow-x-auto min-h-[500px] max-h-[500px] overflow-y-auto">
                  <code className="text-neutral-700">{emailSafeHtml}</code>
                </pre>
              </div>
            </div>
          </motion.div>
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
            <h2 className={'text-5xl font-bold tracking-tight text-neutral-900 text-balance'}>Ready to send great emails?</h2>
            <p className={'mt-6 text-lg text-neutral-600'}>
              This tool is great for creating email HTML, but Plunk handles everything: templates, sending, tracking,
              and deliverability. Start free, no credit card required.
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
