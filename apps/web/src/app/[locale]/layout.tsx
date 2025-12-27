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
import { ResourceHints } from '@/lib/performance/resourceHints';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { SchemaMarkup } from '@/components/seo';
import { GoogleAnalytics } from '@/components/marketing/GoogleAnalytics';
import RTLProvider from '@/components/i18n/RTLProvider';
import SkipLink from '@/components/ui/SkipLink';
import type { Locale } from '@/i18n/routing';
import { themeInlineScript } from '@/lib/theme/theme-inline-script';

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

  // Generate default Open Graph metadata
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MODELE-NEXTJS-FULLSTACK';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Full-stack template with Next.js 16 frontend and FastAPI backend';

  return (
    <html lang={locale} className={inter.variable} data-api-url={apiUrl}>
      <head>
        {/* Critical theme styles - applied immediately to prevent color flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                /* Apply default theme colors immediately - prevents flash */
                --color-primary-50: #e9effd;
                --color-primary-100: #d3e0fb;
                --color-primary-200: #a8c1f7;
                --color-primary-300: #7ca1f3;
                --color-primary-400: #5182ef;
                --color-primary-500: #2563eb;
                --color-primary-600: #1e4fbc;
                --color-primary-700: #163b8d;
                --color-primary-800: #0f285e;
                --color-primary-900: #07142f;
                --color-primary-950: #040a17;
                --color-primary-rgb: 37, 99, 235;
                
                --color-secondary-50: #eff0fe;
                --color-secondary-100: #e0e0fc;
                --color-secondary-200: #c1c2f9;
                --color-secondary-300: #a1a3f7;
                --color-secondary-400: #8285f4;
                --color-secondary-500: #6366f1;
                --color-secondary-600: #4f52c1;
                --color-secondary-700: #3b3d91;
                --color-secondary-800: #282960;
                --color-secondary-900: #141430;
                --color-secondary-950: #0a0a18;
                --color-secondary-rgb: 99, 102, 241;
                
                --color-info-50: #ecfeff;
                --color-info-100: #cffafe;
                --color-info-200: #a5f3fc;
                --color-info-300: #67e8f9;
                --color-info-400: #22d3ee;
                --color-info-500: #0891b2;
                --color-info-600: #0e7490;
                --color-info-700: #155e75;
                --color-info-800: #164e63;
                --color-info-900: #083344;
                --color-info-950: #041a22;
                
                --color-success-50: #ecfdf5;
                --color-success-100: #d1fae5;
                --color-success-200: #a7f3d0;
                --color-success-300: #6ee7b7;
                --color-success-400: #34d399;
                --color-success-500: #059669;
                --color-success-600: #047857;
                --color-success-700: #065f46;
                --color-success-800: #064e3b;
                --color-success-900: #022c22;
                --color-success-950: #011611;
                --color-success-rgb: 5, 150, 105;
                
                --color-danger-50: #fef2f2;
                --color-danger-100: #fee2e2;
                --color-danger-200: #fecaca;
                --color-danger-300: #fca5a5;
                --color-danger-400: #f87171;
                --color-danger-500: #dc2626;
                --color-danger-600: #b91c1c;
                --color-danger-700: #991b1b;
                --color-danger-800: #7f1d1d;
                --color-danger-900: #450a0a;
                --color-danger-950: #220505;
                --color-danger-rgb: 220, 38, 38;
                
                --color-warning-50: #fffbeb;
                --color-warning-100: #fef3c7;
                --color-warning-200: #fde68a;
                --color-warning-300: #fcd34d;
                --color-warning-400: #fbbf24;
                --color-warning-500: #d97706;
                --color-warning-600: #b45309;
                --color-warning-700: #92400e;
                --color-warning-800: #78350f;
                --color-warning-900: #451a03;
                --color-warning-950: #230d02;
                
                --font-family: Inter, system-ui, -apple-system, sans-serif;
                --font-family-heading: Inter, system-ui, -apple-system, sans-serif;
                --font-family-subheading: Inter, system-ui, -apple-system, sans-serif;
                --border-radius: 8px;
              }
              
              /* Apply background colors immediately to prevent flash */
              body {
                background-color: #ffffff;
                color: #0f172a;
              }
              
              @media (prefers-color-scheme: dark) {
                body {
                  background-color: #0f172a;
                  color: #f1f5f9;
                }
              }
            `,
          }}
        />
        
        {/* Theme inline script - loads theme before React hydration to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeInlineScript.replace(
              'http://localhost:8000',
              apiUrl
            ),
          }}
        />
        
        {/* Resource hints for performance */}
        {apiHost && (
          <>
            <link rel="dns-prefetch" href={`//${apiHost}`} />
            <link rel="preconnect" href={`//${apiHost}`} crossOrigin="anonymous" />
          </>
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Open Graph tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={appName} />
        <meta property="og:locale" content={locale === 'fr' ? 'fr_FR' : locale === 'ar' ? 'ar_SA' : locale === 'he' ? 'he_IL' : 'en_US'} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`} style={{ fontFamily: 'var(--font-family, Inter, system-ui, sans-serif)' }}>
        <SkipLink />
        <SchemaMarkup
          type="organization"
          data={{
            name: appName,
            url: baseUrl,
            description: appDescription,
          }}
        />
        <SchemaMarkup
          type="website"
          data={{
            name: appName,
            url: baseUrl,
            description: appDescription,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/search?q={search_term_string}`,
              },
            },
          }}
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <NextIntlClientProvider messages={messages}>
          <RTLProvider>
            <PerformanceScripts />
            <ResourceHints />
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

