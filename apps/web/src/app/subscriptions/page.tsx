'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Button, Alert } from '@/components/ui';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDate, formatPrice, formatInterval } from '@/utils/subscriptions';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors/api';

export default function SubscriptionsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { subscription, isLoading, error, refresh } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleManageBilling = useCallback(async () => {
    setActionError(null);
    try {
      const returnUrl = `${window.location.origin}/subscriptions`;
      const response = await api.post('/v1/subscriptions/portal', null, {
        params: { return_url: returnUrl },
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Failed to open billing portal';
      setActionError(errorMessage);
      logger.error('Failed to open billing portal', appError);
    }
  }, []);

  const handleCancel = useCallback(async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.')) {
      return;
    }

    setIsCanceling(true);
    setActionError(null);
    try {
      await api.post('/v1/subscriptions/cancel');
      await refresh();
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Failed to cancel subscription';
      setActionError(errorMessage);
      logger.error('Failed to cancel subscription', appError);
    } finally {
      setIsCanceling(false);
    }
  }, [refresh]);

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">No Active Subscription</h1>
          <p className="text-gray-600 mb-6">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <Button onClick={() => router.push('/pricing')}>
            View Plans
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Subscription Management</h1>

      {(error || actionError) && (
        <Alert variant="error" className="mb-6">
          {actionError || error}
        </Alert>
      )}

      <Card className="p-8 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Current Plan</h2>
            <p className="text-2xl font-bold">{subscription.plan.name}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Status</h2>
            <p className="text-2xl font-bold capitalize">{subscription.status}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Price</h2>
            <p className="text-2xl font-bold">
              {formatPrice(subscription.plan.amount, subscription.plan.currency)}
              {formatInterval(subscription.plan.interval)}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Next Billing Date</h2>
            <p className="text-2xl font-bold">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        {subscription.cancel_at_period_end && (
          <Alert variant="warning" className="mb-6">
            Your subscription will be canceled on {formatDate(subscription.current_period_end)}.
            You can reactivate it before then.
          </Alert>
        )}

        <div className="flex gap-4">
          <Button onClick={handleManageBilling}>
            Manage Billing
          </Button>
          {!subscription.cancel_at_period_end && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCanceling}
            >
              {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

