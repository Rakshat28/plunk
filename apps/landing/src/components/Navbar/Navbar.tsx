import Link from 'next/link';
import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {DASHBOARD_URI, WIKI_URI} from '../../lib/constants';
import Image from 'next/image';
import logo from '../../../public/assets/logo.svg';

/**
 *
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={'relative top-0 z-40 mx-auto max-w-7xl px-8 xl:px-0'}>
      <div className={'z-40 py-6'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex flex-shrink-0 items-center">
              <Link href={'/'} className={'flex items-center gap-x-3'}>
                <div className={'relative h-8 w-8'}>
                  <Image src={logo} alt={'Plunk logo'} fill className={'object-contain'} />
                </div>
                <span className={'sr-only'}>Plunk</span>
              </Link>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <Link
                href={'/made-by-humans'}
                className={'text-sm font-medium text-neutral-600 transition hover:text-neutral-900'}
              >
                By humans
              </Link>

              <Link
                href={'/pricing'}
                className={'text-sm font-medium text-neutral-600 transition hover:text-neutral-900'}
              >
                Pricing
              </Link>

              <Link
                href={'/guides'}
                className={'text-sm font-medium text-neutral-600 transition hover:text-neutral-900'}
              >
                Guides
              </Link>

              <Link
                href={WIKI_URI}
                target={'_blank'}
                rel={'noreferrer'}
                className={
                  'flex items-center gap-x-1.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-900'
                }
              >
                Docs
                <svg className={'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V14.75"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.25 9.25V4.75H14.75" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 5L11.75 12.25" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a
              href={`${DASHBOARD_URI}/auth/login`}
              className={'text-sm font-medium text-neutral-600 transition hover:text-neutral-900'}
            >
              Sign in
            </a>
            <motion.a
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              href={`${DASHBOARD_URI}/auth/signup`}
              className={
                'rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800'
              }
            >
              Get started
            </motion.a>
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>

              <svg
                className={`${mobileOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>

              <svg
                className={`${!mobileOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{height: 0, opacity: 0}}
            animate={{height: 'auto', opacity: 1}}
            exit={{height: 0, opacity: 0}}
            transition={{duration: 0.2}}
            className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-neutral-200 bg-white shadow-lg backdrop-blur-sm sm:hidden"
          >
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
              className="space-y-1 p-4"
            >
              <Link
                href={'/made-by-humans'}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                By humans
              </Link>

              <Link
                href={'/pricing'}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                Pricing
              </Link>

              <Link
                href={'/guides'}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                Guides
              </Link>

              <a
                href={WIKI_URI}
                target={'_blank'}
                rel={'noreferrer'}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                Docs
              </a>

              <div className="border-t border-neutral-200 pt-4">
                <a
                  href={`${DASHBOARD_URI}/auth/login`}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  Sign in
                </a>
                <a
                  href={`${DASHBOARD_URI}/auth/signup`}
                  className="mt-2 block rounded-lg bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Get started
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
