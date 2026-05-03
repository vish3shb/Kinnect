import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import { useEffect } from "react";
import '../styles/globals.css';
import dynamic from 'next/dynamic';
const SOSAlertBanner = dynamic(() => import('../components/SOSAlertBanner'), { ssr: false });

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kinnect" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <link rel="icon" href="/icon-512.png" />
        <title>Kinnect</title>
      </Head>
      <SOSAlertBanner />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

