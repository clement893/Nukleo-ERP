import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppProviders from '@/components/providers/AppProviders';
import { App } from './app';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';
import { PerformanceScripts } from '@/components/performance/PerformanceScripts';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

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
      </head>
      <body className={inter.className}>
        <PerformanceScripts />
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