'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors/api';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verifySubscription = useCallback(async () => {
    try {
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await api.get('/v1/subscriptions/me');
      if (response.data) {
        setIsLoading(false);
      } else {
        setError('Subscription not found. Please wait a moment and refresh.');
        setIsLoading(false);
      }
    } catch (err) {
      const appError = handleApiError(err);
      if (appError.statusCode === 404) {
        // Subscription might not be created yet, wait and retry
        setTimeout(async () => {
          try {
            await api.get('/v1/subscriptions/me');
            setIsLoading(false);
          } catch (retryErr) {
            const retryError = handleApiError(retryErr);
            setError('Subscription verification failed. Please check your subscription status.');
            logger.error('Subscription verification retry failed', retryError);
            setIsLoading(false);
          }
        }, 3000);
      } else {
        setError('Failed to verify subscription');
        logger.error('Failed to verify subscription', appError);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('Missing session ID');
      setIsLoading(false);
      return;
    }

    verifySubscription();
  }, [searchParams, verifySubscription]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-6">{error}</p>
          <Button onClick={() => router.push('/pricing')}>
            Back to Pricing
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Subscription Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your subscription has been activated. You can now access all premium features.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push('/subscriptions')}>
            Manage Subscription
          </Button>
        </div>
      </Card>
    </div>
  );
}

