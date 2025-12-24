import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import ThemeManagerProvider from '@/components/providers/ThemeManagerProvider';
import { GlobalThemeProvider } from '@/lib/theme/global-theme-provider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { App } from './app';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';
import { PerformanceScripts } from '@/components/performance/PerformanceScripts';

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
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <PerformanceScripts />
      </head>
      <body className={inter.className}>
        <GlobalThemeProvider>
          <ThemeProvider>
            <ThemeManagerProvider>
              <QueryProvider>
                <SessionProvider>
                  <App>
                    {children}
                  </App>
                </SessionProvider>
              </QueryProvider>
            </ThemeManagerProvider>
          </ThemeProvider>
        </GlobalThemeProvider>
        <WebVitalsReporter />
      </body>
    </html>
  );
}