import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppProviders from '@/components/providers/AppProviders';
import { App } from './app';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';
import { PerformanceScripts } from '@/components/performance/PerformanceScripts';
import { ResourceHints } from '@/lib/performance/resourceHints';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { SchemaMarkup } from '@/components/seo';
import { GoogleAnalytics } from '@/components/marketing/GoogleAnalytics';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Note: Removed force-dynamic to enable static generation for better performance
// Use 'export const dynamic = "force-dynamic"' only on pages that need dynamic data

export const metadata: Metadata = {
  title: 'MODELE-NEXTJS-FULLSTACK',
  description: 'Full-stack template with Next.js 16 frontend and FastAPI backend',
  icons: {
    icon: '/favicon.ico',
  },
  // Resource hints for performance
  other: {
    'dns-prefetch': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: 'var(--color-primary-500)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get API URL for resource hints
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_DEFAULT_API_URL || 'http://localhost:8000';
  const apiHost = apiUrl.replace(/^https?:\/\//, '').split('/')[0];
  
  // Generate default Open Graph metadata
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MODELE-NEXTJS-FULLSTACK';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Full-stack template with Next.js 16 frontend and FastAPI backend';

  return (
    <html lang="fr" className={inter.variable}>
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
        
        {/* Open Graph tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={appName} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}