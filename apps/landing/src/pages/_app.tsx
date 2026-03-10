import '../styles/globals.css';
import React, {useEffect} from 'react';
import Head from 'next/head';
import {AppProps} from 'next/app';
import {toast, Toaster} from 'sonner';
import {SWRConfig} from 'swr';
import {network} from '../lib/network';
import {DefaultSeo} from 'next-seo';
import Script from 'next/script';

/**
 * Main app component
 * @param props Props
 * @param props.Component App component
 * @param props.pageProps
 */
function App({Component, pageProps}: AppProps) {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const message = searchParams.get('message');

    if (message) {
      toast(message, {duration: 10000});
    }
  }, []);

  return (
    <>
      <Head>
        <title>Plunk | The Open-Source Email Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" key={'viewport'} />
      </Head>
      <Toaster position={'top-right'} />

      <Component {...pageProps} />
    </>
  );
}

/**
 * Main app root component that houses all components
 * @param props Default nextjs props
 */
export default function WithProviders(props: AppProps) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => network.fetch('GET', url),
        revalidateOnFocus: true,
      }}
    >
      <DefaultSeo
        defaultTitle={'Plunk | The Open-Source Email Platform'}
        title={'Plunk | The Open-Source Email Platform'}
        description={
          'Open-source email automation platform with workflows, segments, and developer API. Scale from 0 to millions of emails at $0.001 per email. Self-hostable and privacy-first.'
        }
        twitter={{cardType: 'summary_large_image', handle: '@useplunk', site: '@useplunk'}}
        openGraph={{
          title: 'Plunk | The Open-Source Email Platform',
          description:
            'Open-source email automation platform with workflows, segments, and developer API. Scale from 0 to millions of emails at $0.001 per email. Self-hostable and privacy-first.',
          images: [{url: 'https://next.useplunk.com/assets/card.png', alt: 'Plunk'}],
        }}
        additionalMetaTags={[{property: 'title', content: 'Plunk | The Open-Source Email Platform'}]}
      />

      <Script
        defer
        src="https://analytics.driaug.com/script.js"
        data-website-id="6ed9fa6c-3a75-4926-ad4d-f607557f79f1"
        data-domains="www.useplunk.com"
      />

      <App {...props} />
    </SWRConfig>
  );
}
