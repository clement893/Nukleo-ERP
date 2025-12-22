'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Subscription {
  id: number;
  plan_id: number;
  plan: {
    id: number;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      loadSubscription();
    }
  }, [status, router]);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/v1/subscriptions/me');
      setSubscription(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No active subscription found');
      } else {
        setError('Failed to load subscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const returnUrl = `${window.location.origin}/subscriptions`;
      const response = await api.post('/v1/subscriptions/portal', null, {
        params: { return_url: returnUrl },
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError('Failed to open billing portal');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.')) {
      return;
    }

    setIsCanceling(true);
    try {
      await api.post('/v1/subscriptions/cancel');
      await loadSubscription();
    } catch (err) {
      setError('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  if (status === 'loading' || isLoading) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Subscription Management</h1>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
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
              {formatPrice(subscription.plan.amount)} / {subscription.plan.interval}
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

