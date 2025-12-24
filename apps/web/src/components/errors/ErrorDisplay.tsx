/**
 * Error Display Component
 * Reusable component for displaying errors
 */

'use client';

import { type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { AppError } from '@/lib/errors/AppError';
import { type ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface ErrorDisplayProps {
  error?: AppError | Error;
  title?: string;
  message?: string;
  code?: ErrorCode;
  statusCode?: number;
  details?: Record<string, unknown>;
  onRetry?: () => void;
  onReset?: () => void;
  showDetails?: boolean;
  children?: ReactNode;
}

export function ErrorDisplay({
  error,
  title,
  message,
  code,
  statusCode,
  details,
  onRetry,
  onReset,
  showDetails = false,
  children,
}: ErrorDisplayProps) {
  // Extract error information
  const errorTitle = title ?? (error instanceof AppError ? getErrorTitle(error.code) : 'Error');
  const errorMessage =
    message ?? error?.message ?? 'An unexpected error occurred';
  const errorCode = code ?? (error instanceof AppError ? error.code : undefined);
  const errorStatusCode =
    statusCode ?? (error instanceof AppError ? error.statusCode : undefined);
  const errorDetails = details ?? (error instanceof AppError ? error.details : undefined);

  // Log error
  if (error) {
    logger.error('Error displayed', error, {
      code: errorCode,
      statusCode: errorStatusCode,
      details: errorDetails,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Container>
        <Card className="max-w-md w-full mx-auto text-center">
          <div className="p-8">
            <div className="mb-6">
              <div className="text-6xl font-bold text-red-600 dark:text-red-400 mb-4">
                {errorStatusCode ?? '!'}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {errorTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{errorMessage}</p>
            </div>

            {errorCode && (
              <div className="mb-4">
                <Badge variant="error">Code: {errorCode}</Badge>
              </div>
            )}

            {showDetails && errorDetails && Object.keys(errorDetails).length > 0 && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Details:
                </h3>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            )}

            {children}

            <div className="flex gap-4 justify-center">
              {onRetry && (
                <Button onClick={onRetry} variant="primary">
                  Try Again
                </Button>
              )}
              {onReset && (
                <Button onClick={onReset} variant="secondary">
                  Go Back
                </Button>
              )}
              {!onRetry && !onReset && (
                <Button onClick={() => window.location.href = '/'} variant="primary">
                  Go Home
                </Button>
              )}
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}

function getErrorTitle(code: ErrorCode): string {
  switch (code) {
    case 'BAD_REQUEST':
      return 'Bad Request';
    case 'UNAUTHORIZED':
      return 'Unauthorized';
    case 'FORBIDDEN':
      return 'Forbidden';
    case 'NOT_FOUND':
      return 'Not Found';
    case 'CONFLICT':
      return 'Conflict';
    case 'VALIDATION_ERROR':
      return 'Validation Error';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate Limit Exceeded';
    case 'INTERNAL_SERVER_ERROR':
      return 'Internal Server Error';
    case 'SERVICE_UNAVAILABLE':
      return 'Service Unavailable';
    case 'NETWORK_ERROR':
      return 'Network Error';
    case 'TIMEOUT':
      return 'Request Timeout';
    default:
      return 'Error';
  }
}

