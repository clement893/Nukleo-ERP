'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, getErrorDetail } from '@/lib/error-utils';
import { useMySubscription, useSubscriptionPayments, useCreateCheckoutSession, useCancelSubscription } from '@/lib/query/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Since this page uses useSearchParams (which requires dynamic rendering),
// and it's a Client Component, it will be rendered dynamically automatically.

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  billing_period: 'month' | 'year';
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  invoice_url?: string;
}

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use React Query hooks for data fetching
  const { data: subscriptionData, isLoading: subscriptionLoading, error: subscriptionError } = useMySubscription();
  const { data: paymentsData, isLoading: paymentsLoading } = useSubscriptionPayments();
  const createCheckoutMutation = useCreateCheckoutSession();
  const cancelSubscriptionMutation = useCancelSubscription();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleSubscribe = useCallback(async (planId: string, period: 'month' | 'year') => {
    try {
      setError('');
      const response = await createCheckoutMutation.mutateAsync({
        plan_id: parseInt(planId, 10),
        success_url: `${window.location.origin}/subscriptions/success?plan=${planId}&period=${period}`,
        cancel_url: `${window.location.origin}/subscriptions`,
      });
      
      // Redirect to checkout URL if provided, otherwise to success page
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        router.push(`/subscriptions/success?plan=${planId}&period=${period}`);
      }
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error subscribing to plan'));
    }
  }, [router, createCheckoutMutation]);

  // Transform subscription data from React Query
  useEffect(() => {
    if (subscriptionData?.data) {
      const sub = subscriptionData.data;
      setSubscription({
        id: String(sub.id),
        plan_id: String(sub.plan_id),
        plan_name: sub.plan?.name || 'Unknown Plan',
        status: sub.status.toLowerCase() as 'active' | 'cancelled' | 'expired' | 'trial',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        amount: sub.plan?.amount ? sub.plan.amount / 100 : 0, // Convert from cents
        currency: sub.plan?.currency?.toUpperCase() || 'USD',
        billing_period: (sub.plan?.interval?.toLowerCase() === 'year' ? 'year' : 'month') as 'month' | 'year',
      });
    } else if (!subscriptionLoading && !subscriptionData) {
      setSubscription(null);
    }
  }, [subscriptionData, subscriptionLoading]);

  // Transform payments data from React Query
  useEffect(() => {
    if (paymentsData?.data) {
      setPayments(paymentsData.data.map((payment: {
        id: string | number;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
        invoice_url?: string;
      }) => ({
        id: String(payment.id),
        amount: payment.amount / 100, // Convert from cents
        currency: payment.currency.toUpperCase(),
        status: payment.status.toLowerCase() as 'paid' | 'pending' | 'failed',
        date: payment.created_at,
        invoice_url: payment.invoice_url,
      })));
    } else if (!paymentsLoading && !paymentsData) {
      setPayments([]);
    }
  }, [paymentsData, paymentsLoading]);

  // Update loading state based on React Query
  useEffect(() => {
    setLoading(subscriptionLoading || paymentsLoading);
  }, [subscriptionLoading, paymentsLoading]);

  // Handle errors from React Query
  useEffect(() => {
    if (subscriptionError) {
      setError(getErrorDetail(subscriptionError) || getErrorMessage(subscriptionError, 'Error loading subscription'));
    }
  }, [subscriptionError]);

  useEffect(() => {
    // Check if coming from pricing page
    const planId = searchParams.get('plan');
    const period = searchParams.get('period') as 'month' | 'year' | null;
    
    if (planId && period) {
      // Redirect to subscription creation flow
      handleSubscribe(planId, period);
    }
  }, [router, searchParams, handleSubscribe]);

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the current period.')) {
      return;
    }

    try {
      setError('');
      await cancelSubscriptionMutation.mutateAsync();
      // React Query will automatically refetch subscription data
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error canceling subscription'));
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      // Note: Resume subscription may require creating a new checkout session
      // or calling a specific resume endpoint if available
      // If resume endpoint exists:
      // const { subscriptionsAPI } = await import('@/lib/api');
      // await subscriptionsAPI.resumeSubscription();
      // Otherwise, redirect to pricing to resubscribe
      router.push('/pricing');
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error resuming subscription'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'error' | 'default'> = {
      active: 'success',
      cancelled: 'error',
      expired: 'error',
      trial: 'default',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Active',
      cancelled: 'Cancelled',
      expired: 'Expired',
      trial: 'Trial',
    };
    return labels[status] || status;
  };

  return (
    <div className="py-12">
      <Container>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your subscription and payments</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : subscription ? (
        <>
          {/* Current Subscription */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{subscription.plan_name}</h2>
                  <Badge variant={getStatusBadge(subscription.status)}>
                    {getStatusLabel(subscription.status)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {subscription.amount}€
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    /{subscription.billing_period === 'month' ? 'month' : 'year'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Period</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Next Payment</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <Alert variant="warning" className="mb-6">
                  Your subscription will be canceled on {new Date(subscription.current_period_end).toLocaleDateString()}.
                </Alert>
              )}

              <div className="flex gap-3">
                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <Button variant="outline" onClick={handleCancelSubscription} className="border-red-500 text-red-600 hover:bg-red-50">
                    Cancel Subscription
                  </Button>
                )}
                {subscription.cancel_at_period_end && (
                  <Button onClick={handleResumeSubscription}>
                    Resume Subscription
                  </Button>
                )}
                <Link href="/pricing">
                  <Button variant="outline">
                    Change Plan
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Payment History */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Payment History</h2>
              {payments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No payments yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {new Date(payment.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.amount}€
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'error' : 'default'}>
                              {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Failed'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {payment.invoice_url && (
                              <a
                                href={payment.invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                              >
                                Download Invoice
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have an active subscription</p>
            <Link href="/pricing">
              <Button>View Plans</Button>
            </Link>
          </div>
        </Card>
      )}
      </Container>
    </div>
  );
}

function SubscriptionsPageContent() {
  return (
    <Suspense
      fallback={
        <div className="py-12">
          <Container>
            <Card>
              <div className="py-12 text-center">
                <Loading />
              </div>
            </Card>
          </Container>
        </div>
      }
    >
      <SubscriptionsContent />
    </Suspense>
  );
}

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <SubscriptionsPageContent />
    </ProtectedRoute>
  );
}
