import {zodResolver} from '@hookform/resolvers/zod';
import {AuthenticationSchemas} from '@plunk/shared';
import {
  Button,
  Card,
  CardContent,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@plunk/ui';
import {AnimatePresence, motion} from 'framer-motion';
import {NextSeo} from 'next-seo';
import Link from 'next/link';
import {useRouter} from 'next/router';
import React, {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import type {z} from 'zod';

import {network} from '../../lib/network';

export default function ResetPassword() {
  const router = useRouter();
  const {token} = router.query;

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const form = useForm<z.infer<typeof AuthenticationSchemas.resetPassword>>({
    resolver: zodResolver(AuthenticationSchemas.resetPassword),
    defaultValues: {
      token: '',
      newPassword: '',
    },
  });

  // Update form token when router is ready
  useEffect(() => {
    if (token && typeof token === 'string') {
      form.setValue('token', token);
    }
  }, [token, form]);

  async function onSubmit(values: z.infer<typeof AuthenticationSchemas.resetPassword>) {
    try {
      const response = await network.fetch<{success: boolean}, typeof AuthenticationSchemas.resetPassword>(
        'POST',
        '/auth/reset-password',
        values,
      );

      if (response.success) {
        setStatus('success');
        setTimeout(() => {
          void router.push('/auth/login');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage('Failed to reset password. The link may be invalid or expired.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  }

  if (!token) {
    return (
      <>
        <NextSeo title="Reset Password" />
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12">
          <div className="flex flex-col gap-6 max-w-md w-full px-4">
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-red-600">Invalid reset link</h1>
                  <p className="text-neutral-600">
                    This password reset link is invalid. Please request a new one from the login page.
                  </p>
                  <Link href="/auth/login">
                    <Button className="w-full mt-4">Back to login</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NextSeo title="Reset Password" />
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12">
        <div className="flex flex-col gap-6 max-w-md w-full px-4">
          <Card>
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{opacity: 0, scale: 0.95}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0}}
                    className="p-8"
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight text-green-600">Password reset!</h1>
                      <p className="text-neutral-600">
                        Your password has been successfully reset. Redirecting to login...
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{opacity: 1}} exit={{opacity: 0}} className="p-8">
                    <Form {...form}>
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          void form.handleSubmit(onSubmit)(e);
                        }}
                      >
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
                            <p className="text-neutral-600">Enter your new password below</p>
                          </div>

                          <div className="grid gap-2">
                            <FormField
                              control={form.control}
                              name="newPassword"
                              render={({field}) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter new password" type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <AnimatePresence>
                            {status === 'error' && (
                              <motion.p
                                initial={{opacity: 0, y: -10}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -10}}
                                className="text-sm font-medium text-red-500"
                              >
                                {errorMessage}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                              <>
                                <svg
                                  className="h-4 w-4 animate-spin"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </>
                            ) : (
                              'Reset password'
                            )}
                          </Button>

                          <div className="text-center text-sm text-neutral-500">
                            Remember your password?{' '}
                            <Link href="/auth/login" className="underline underline-offset-4 hover:text-neutral-900">
                              Back to login
                            </Link>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
