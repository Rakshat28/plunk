import {motion} from 'framer-motion';
import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

/**
 * Reusable code block component with syntax highlighting styling
 */
export function CodeBlock({code, language = 'javascript', title}: CodeBlockProps) {
  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
      className={'overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50'}
    >
      {title && (
        <div className={'border-b border-neutral-200 bg-white px-6 py-3'}>
          <span className={'text-sm font-medium text-neutral-900'}>{title}</span>
        </div>
      )}
      <pre className={'overflow-x-auto p-6'}>
        <code className={'font-mono text-sm text-neutral-900'}>{code}</code>
      </pre>
    </motion.div>
  );
}
