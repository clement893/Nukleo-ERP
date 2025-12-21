/**
 * Global Error Page
 * Next.js error page for unhandled errors
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';
import { logger } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error
    logger.error('Global error page', error, {
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <ErrorDisplay
      error={undefined}
      onRetry={reset}
      onReset={() => window.location.href = '/'}
      showDetails={process.env.NODE_ENV === 'development'}
    />
  );
}