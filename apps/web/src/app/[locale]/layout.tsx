/**
 * Locale-based Layout
 * Wraps the app with next-intl provider and RTL support
 */

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import AppProviders from '@/components/providers/AppProviders';
import { App } from '../app';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';
import { PerformanceScripts } from '@/components/performance/PerformanceScripts';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import RTLProvider from '@/components/i18n/RTLProvider';
import type { Locale } from '@/i18n/routing';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MODELE-NEXTJS-FULLSTACK',
  description: 'Full-stack template with Next.js 16 frontend and FastAPI backend',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: 'var(--color-primary-500)',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Get API URL for resource hints
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_DEFAULT_API_URL || 'http://localhost:8000';
  const apiHost = apiUrl.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        {/* Resource hints for performance */}
        {apiHost && (
          <>
            <link rel="dns-prefetch" href={`//${apiHost}`} />
            <link rel="preconnect" href={`//${apiHost}`} crossOrigin="anonymous" />
          </>
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <RTLProvider>
            <PerformanceScripts />
            <ErrorBoundary>
              <AppProviders>
                <App>
                  {children}
                </App>
              </AppProviders>
            </ErrorBoundary>
            <WebVitalsReporter />
          </RTLProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

