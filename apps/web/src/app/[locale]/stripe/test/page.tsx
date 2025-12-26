'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button, Card, Input, Alert, Badge, Tabs, TabList, Tab, Container, Loading } from '@/components/ui';
import { subscriptionsAPI } from '@/lib/api';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

interface Plan {
  id: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
}

function StripeTestContent() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [mySubscription, setMySubscription] = useState<any>(null);

  useEffect(() => {
    loadPlans();
    loadMySubscription();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await subscriptionsAPI.getPlans(true);
      if (response.data?.plans) {
        setPlans(response.data.plans);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const loadMySubscription = async () => {
    try {
      const response = await subscriptionsAPI.getMySubscription();
      if (response.data) {
        setMySubscription(response.data);
      }
    } catch (err) {
      // Subscription might not exist, that's okay
      setMySubscription(null);
    }
  };

  const handleCreateCheckout = async (planId: number) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setCheckoutUrl(null);

      const baseUrl = window.location.origin;
      const response = await subscriptionsAPI.createCheckoutSession({
        plan_id: planId,
        success_url: `${baseUrl}/stripe/test?success=true`,
        cancel_url: `${baseUrl}/stripe/test?canceled=true`,
      });

      if (response.data?.url) {
        setCheckoutUrl(response.data.url);
        setSuccess('Checkout session created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = response.data.url;
        }, 2000);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortal = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setPortalUrl(null);

      const baseUrl = window.location.origin;
      const response = await subscriptionsAPI.createPortalSession(`${baseUrl}/stripe/test`);

      if (response.data?.url) {
        setPortalUrl(response.data.url);
        setSuccess('Portal session created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = response.data.url;
        }, 2000);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to create portal session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Stripe Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test Stripe integration for subscriptions and payments
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Current Subscription */}
      {mySubscription && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Plan:</span>
              <Badge variant="default">{mySubscription.plan?.name || 'N/A'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <Badge variant={mySubscription.status === 'ACTIVE' ? 'success' : 'default'}>
                {mySubscription.status}
              </Badge>
            </div>
            {mySubscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Period End:</span>
                <span>{new Date(mySubscription.current_period_end).toLocaleDateString()}</span>
              </div>
            )}
            <div className="mt-4">
              <Button onClick={handleCreatePortal} disabled={loading}>
                Open Customer Portal
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        {loading && !plans.length ? (
          <div className="py-12 text-center">
            <Loading />
          </div>
        ) : plans.length === 0 ? (
          <Alert variant="info">
            No plans available. Please configure plans in the backend.
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>
                )}
                <div className="mb-4">
                  <span className="text-2xl font-bold">
                    {(plan.amount / 100).toFixed(2)} {plan.currency.toUpperCase()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {' '}/ {plan.interval.toLowerCase()}
                  </span>
                </div>
                <Button
                  onClick={() => handleCreateCheckout(plan.id)}
                  disabled={loading}
                  fullWidth
                  variant="primary"
                >
                  Subscribe
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <h2 className="text-xl font-semibold mb-4">How to Test</h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">1. Check Configuration</h3>
            <p>Verify that Stripe API keys are configured in environment variables:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>STRIPE_SECRET_KEY</li>
              <li>STRIPE_PUBLISHABLE_KEY (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">2. Test Checkout</h3>
            <p>Click "Subscribe" on a plan to create a Stripe checkout session. Use test card:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Card: 4242 4242 4242 4242</li>
              <li>Expiry: Any future date</li>
              <li>CVC: Any 3 digits</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">3. Customer Portal</h3>
            <p>If you have an active subscription, use "Open Customer Portal" to test the Stripe customer portal.</p>
          </div>
          <Alert variant="warning" title="⚠️ Important" className="mt-4">
            Make sure you're using Stripe test mode keys. Never use production keys in development.
          </Alert>
        </div>
      </Card>
    </Container>
  );
}

export default function StripeTestPage() {
  return (
    <ProtectedRoute>
      <StripeTestContent />
    </ProtectedRoute>
  );
}

