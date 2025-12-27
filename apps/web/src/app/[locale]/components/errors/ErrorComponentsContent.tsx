/**
 * Error Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/errors';
import { ErrorDisplay } from '@/components/errors';
import ErrorReporting from '@/components/errors/ErrorReporting';
import { ApiError } from '@/components/errors';
import { ErrorCode } from '@/lib/errors';
import { Button, Card } from '@/components/ui';

// Component that throws an error for testing ErrorBoundary
function ErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary demonstration');
  }
  
  return (
    <Button onClick={() => setShouldThrow(true)} variant="danger">
      Trigger Error Boundary
    </Button>
  );
}

export default function ErrorComponentsContent() {
  const [apiError, setApiError] = useState<{
    status: number;
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);

  const simulateApiError = () => {
    setApiError({
      status: 500,
      message: 'Internal Server Error',
      details: {
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Gestion d'Erreurs"
        description="Composants pour la gestion, l'affichage et le signalement des erreurs"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Erreurs' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Error Boundary">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              ErrorBoundary catches React component errors and displays a fallback UI. Click the button below to trigger an error.
            </p>
            <ErrorBoundary showDetails>
              <ErrorThrower />
            </ErrorBoundary>
          </Card>
        </Section>

        <Section title="Error Display">
          <ErrorDisplay
            error={new Error('Failed to load user data')}
            code={ErrorCode.NETWORK_ERROR}
            statusCode={404}
            details={{
              endpoint: '/api/users/123',
              method: 'GET',
            }}
            onRetry={() => {
              logger.info('Retrying failed operation');
            }}
            onReset={() => {
              logger.info('Error dismissed');
            }}
          />
        </Section>

        <Section title="API Error">
          <div className="space-y-4">
            <Button onClick={simulateApiError} variant="primary">
              Simulate API Error
            </Button>
            {apiError && (
              <ApiError
                error={apiError}
                onRetry={() => {
                  setApiError(null);
                  logger.info('Retrying API call');
                }}
                onReset={() => {
                  setApiError(null);
                }}
              />
            )}
          </div>
        </Section>

        <Section title="Error Reporting">
          <div className="max-w-2xl">
            <ErrorReporting
              onSubmit={async (data) => {
                logger.info('Error report submitted:', { data });
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
            />
          </div>
        </Section>

        <Section title="Error States Examples">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-2">404 Not Found</h4>
              <ErrorDisplay
                error={new Error('Resource not found')}
                code={ErrorCode.NOT_FOUND}
                statusCode={404}
                onRetry={() => logger.info('Retry 404')}
              />
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2">500 Server Error</h4>
              <ErrorDisplay
                error={new Error('Internal server error')}
                code={ErrorCode.INTERNAL_SERVER_ERROR}
                statusCode={500}
                onRetry={() => logger.info('Retry 500')}
              />
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2">403 Forbidden</h4>
              <ErrorDisplay
                error={new Error('You do not have permission to access this resource')}
                code={ErrorCode.FORBIDDEN}
                statusCode={403}
                onRetry={() => logger.info('Retry 403')}
              />
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2">Network Error</h4>
              <ErrorDisplay
                error={new Error('Network request failed')}
                code={ErrorCode.NETWORK_ERROR}
                statusCode={0}
                details={{
                  reason: 'Connection timeout',
                }}
                onRetry={() => logger.info('Retry network')}
              />
            </Card>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

