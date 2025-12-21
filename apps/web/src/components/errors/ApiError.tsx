/**
 * API Error Component
 * Displays API errors with retry functionality
 */

'use client';

import { type ReactNode } from 'react';
import { handleApiError, isNetworkError, isServerError } from '@/lib/errors/api';
import { ErrorDisplay } from './ErrorDisplay';
import { logger } from '@/lib/logger';

interface ApiErrorProps {
  error: unknown;
  onRetry?: () => void;
  onReset?: () => void;
  showDetails?: boolean;
  children?: ReactNode;
}

export function ApiError({
  error,
  onRetry,
  onReset,
  showDetails = false,
  children,
}: ApiErrorProps) {
  const appError = handleApiError(error);

  // Log error with context
  logger.error('API error', appError, {
    code: appError.code,
    statusCode: appError.statusCode,
    details: appError.details,
  });

  // Determine if retry makes sense
  const canRetry = isNetworkError(appError) || isServerError(appError);

  return (
    <ErrorDisplay
      error={appError}
      onRetry={canRetry ? onRetry : undefined}
      onReset={onReset}
      showDetails={showDetails}
    >
      {children}
      {isNetworkError(appError) && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please check your internet connection and try again.
          </p>
        </div>
      )}
      {isServerError(appError) && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            Our servers are experiencing issues. Please try again later.
          </p>
        </div>
      )}
    </ErrorDisplay>
  );
}

