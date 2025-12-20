import {motion} from 'framer-motion';
import Script from 'next/script';
import React from 'react';

export interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  schemaId?: string;
}

/**
 * Reusable FAQ section component with structured data support
 */
export function FAQSection({faqs, schemaId = 'faq-schema'}: FAQSectionProps) {
  return (
    <>
      <Script
        id={schemaId}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faqs.map(faq => ({
              '@type': 'Question',
              'name': faq.question,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
              },
            })),
          }),
        }}
      />

      <section className={'py-32'}>
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
          className={'mx-auto max-w-4xl'}
        >
          <h2 className={'mb-16 text-center text-5xl font-bold tracking-tight text-neutral-900'}>
            Frequently asked questions
          </h2>

          <div className={'space-y-8'}>
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1]}}
                className={'border-b border-neutral-200 pb-8 last:border-b-0'}
              >
                <h3 className={'text-xl font-semibold text-neutral-900'}>{faq.question}</h3>
                <p className={'mt-4 leading-relaxed text-neutral-600'}>{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
