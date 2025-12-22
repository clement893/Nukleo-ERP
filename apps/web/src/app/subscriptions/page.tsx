'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

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
  const { isAuthenticated } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleSubscribe = useCallback(async (planId: string, period: 'month' | 'year') => {
    try {
      // TODO: Replace with actual API call
      // await subscriptionsAPI.create({ plan_id: planId, billing_period: period });
      // Redirect to success page
      router.push(`/subscriptions/success?plan=${planId}&period=${period}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la souscription');
    }
  }, [router]);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // TODO: Replace with actual API call when backend is ready
      // const response = await subscriptionsAPI.getCurrent();
      // setSubscription(response.data);
      
      // Mock data for now
      setSubscription({
        id: '1',
        plan_id: 'professional',
        plan_name: 'Professional',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        cancel_at_period_end: false,
        amount: 79,
        currency: 'EUR',
        billing_period: 'month',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await subscriptionsAPI.getPayments();
      // setPayments(response.data);
      
      // Mock data
      setPayments([
        {
          id: '1',
          amount: 79,
          currency: 'EUR',
          status: 'paid',
          date: '2024-01-01T00:00:00Z',
          invoice_url: '#',
        },
        {
          id: '2',
          amount: 79,
          currency: 'EUR',
          status: 'paid',
          date: '2023-12-01T00:00:00Z',
          invoice_url: '#',
        },
      ]);
    } catch (err: any) {
      console.error('Error loading payments:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Check if coming from pricing page
    const planId = searchParams.get('plan');
    const period = searchParams.get('period') as 'month' | 'year' | null;
    
    if (planId && period) {
      // Redirect to subscription creation flow
      handleSubscribe(planId, period);
    } else {
      loadSubscription();
      loadPayments();
    }
  }, [isAuthenticated, router, searchParams, handleSubscribe, loadSubscription, loadPayments]);

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu\'à la fin de la période en cours.')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await subscriptionsAPI.cancel();
      await loadSubscription();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const handleResumeSubscription = async () => {
    try {
      // TODO: Replace with actual API call
      // await subscriptionsAPI.resume();
      await loadSubscription();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la reprise');
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

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
      active: 'Actif',
      cancelled: 'Annulé',
      expired: 'Expiré',
      trial: 'Essai',
    };
    return labels[status] || status;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Abonnements</h1>
        <p className="text-gray-600">Gérez votre abonnement et vos paiements</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <div className="text-gray-500">Chargement...</div>
          </div>
        </Card>
      ) : subscription ? (
        <>
          {/* Current Subscription */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{subscription.plan_name}</h2>
                  <Badge variant={getStatusBadge(subscription.status)}>
                    {getStatusLabel(subscription.status)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {subscription.amount}€
                  </div>
                  <div className="text-sm text-gray-600">
                    /{subscription.billing_period === 'month' ? 'mois' : 'an'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Période actuelle</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')} - {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Prochain paiement</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    Votre abonnement sera annulé le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <Button variant="outline" onClick={handleCancelSubscription} className="border-red-500 text-red-600 hover:bg-red-50">
                    Annuler l'abonnement
                  </Button>
                )}
                {subscription.cancel_at_period_end && (
                  <Button onClick={handleResumeSubscription}>
                    Reprendre l'abonnement
                  </Button>
                )}
                <Link href="/pricing">
                  <Button variant="outline">
                    Changer de plan
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Payment History */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Historique des paiements</h2>
              {payments.length === 0 ? (
                <p className="text-gray-600">Aucun paiement pour le moment</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Montant</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Statut</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {payment.amount}€
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'error' : 'default'}>
                              {payment.status === 'paid' ? 'Payé' : payment.status === 'pending' ? 'En attente' : 'Échoué'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {payment.invoice_url && (
                              <a
                                href={payment.invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Télécharger la facture
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
            <p className="text-gray-600 mb-6">Vous n'avez pas d'abonnement actif</p>
            <Link href="/pricing">
              <Button>Voir les plans</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <Card>
            <div className="py-12 text-center">
              <div className="text-gray-500">Chargement...</div>
            </div>
          </Card>
        </div>
      }
    >
      <SubscriptionsContent />
    </Suspense>
  );
}
