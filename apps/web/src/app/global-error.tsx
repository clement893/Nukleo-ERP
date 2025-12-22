/**
 * Global Error Boundary for Next.js App Router
 * This file must be a Client Component and handles errors that occur in the root layout
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';
import Button from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Global error caught:', error);
    
    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const { captureException } = require('@/lib/sentry/client');
        captureException(error, {
          tags: {
            errorBoundary: 'global-error',
          },
        });
      } catch (e) {
        // Sentry not available, continue without it
        console.warn('Sentry not available:', e);
      }
    }
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={error}
              message={error.message || "Une erreur inattendue s'est produite"}
              statusCode={500}
              details={{
                digest: error.digest,
              }}
              onReset={reset}
            />
            <div className="mt-6 flex gap-4 justify-center">
              <Button onClick={reset} variant="primary">
                Reessayer
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Retour a l'accueil
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
