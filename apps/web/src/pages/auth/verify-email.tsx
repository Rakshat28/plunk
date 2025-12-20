import {AuthenticationSchemas} from '@plunk/shared';
import {Button, Card, CardContent} from '@plunk/ui';
import {AnimatePresence, motion} from 'framer-motion';
import {NextSeo} from 'next-seo';
import Link from 'next/link';
import {useRouter} from 'next/router';
import React, {useEffect, useRef, useState} from 'react';

import {network} from '../../lib/network';

export default function VerifyEmail() {
  const router = useRouter();
  const {token} = router.query;

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');
  const processedToken = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Wait for router to be ready before processing
    if (!router.isReady) {
      return;
    }

    const normalizedToken = typeof token === 'string' ? token : undefined;

    if (processedToken.current === normalizedToken) {
      return;
    }

    processedToken.current = normalizedToken;

    // If no token, show the pending verification state
    if (!token || typeof token !== 'string') {
      setStatus('pending');
      return;
    }

    setStatus('verifying');

    async function verifyEmail() {
      try {
        const response = await network.fetch<{success: boolean}, typeof AuthenticationSchemas.verifyEmail>(
          'POST',
          '/auth/verify-email',
          {token: token as string},
        );

        if (response.success) {
          setStatus('success');
          setTimeout(() => {
            void router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('Invalid or expired verification link');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      }
    }

    void verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, token]);

  async function handleResend() {
    setIsResending(true);
    setResendMessage('');
    try {
      const response = await network.fetch<{success: boolean}>('POST', '/auth/request-verification');

      if (response.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage('Failed to send verification email. Please try again.');
      }
    } catch {
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <>
      <NextSeo title="Verify Email" />
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12">
        <div className="flex flex-col gap-6 max-w-md w-full px-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col gap-6 text-center">
                <AnimatePresence mode="wait">
                  {status === 'pending' && (
                    <motion.div
                      key="pending"
                      initial={{opacity: 0, scale: 0.95}}
                      animate={{opacity: 1, scale: 1}}
                      exit={{opacity: 0}}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
                      <p className="text-neutral-600">
                        Please check your inbox for a verification link. Click the link in the email to verify your
                        account.
                      </p>

                      <div className="flex flex-col gap-3 w-full mt-4">
                        <Button onClick={handleResend} disabled={isResending} className="w-full">
                          {isResending ? 'Sending...' : 'Resend verification email'}
                        </Button>

                        {resendMessage && (
                          <p
                            className={`text-sm ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-500'}`}
                          >
                            {resendMessage}
                          </p>
                        )}

                        <Link href="/auth/login">
                          <Button variant="outline" className="w-full">
                            Back to login
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {status === 'verifying' && (
                    <motion.div
                      key="verifying"
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
                        <svg
                          className="h-8 w-8 animate-spin text-neutral-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight">Verifying your email...</h1>
                      <p className="text-neutral-600">Please wait while we verify your email address.</p>
                    </motion.div>
                  )}

                  {status === 'success' && (
                    <motion.div
                      key="success"
                      initial={{opacity: 0, scale: 0.95}}
                      animate={{opacity: 1, scale: 1}}
                      exit={{opacity: 0}}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight text-green-600">Email verified!</h1>
                      <p className="text-neutral-600">
                        Your email has been successfully verified. Redirecting to dashboard...
                      </p>
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div
                      key="error"
                      initial={{opacity: 0, scale: 0.95}}
                      animate={{opacity: 1, scale: 1}}
                      exit={{opacity: 0}}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight text-red-600">Verification failed</h1>
                      <p className="text-neutral-600">{errorMessage}</p>

                      <div className="flex flex-col gap-3 w-full mt-4">
                        <Button onClick={handleResend} disabled={isResending} className="w-full">
                          {isResending ? 'Sending...' : 'Resend verification email'}
                        </Button>

                        {resendMessage && (
                          <p
                            className={`text-sm ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-500'}`}
                          >
                            {resendMessage}
                          </p>
                        )}

                        <Link href="/auth/login">
                          <Button variant="outline" className="w-full">
                            Back to login
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
