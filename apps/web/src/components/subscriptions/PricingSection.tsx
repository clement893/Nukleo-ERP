'use client';

import React, { useEffect, useState } from 'react';
import { PricingCard, Plan } from './PricingCard';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert } from '@/components/ui/Alert';

export function PricingSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<number | undefined>();

  useEffect(() => {
    loadPlans();
    if (session) {
      loadCurrentSubscription();
    }
  }, [session]);

  const loadPlans = async () => {
    try {
      const response = await api.get('/v1/subscriptions/plans');
      setPlans(response.data.plans || []);
    } catch (err) {
      setError('Failed to load plans');
      console.error(err);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const response = await api.get('/v1/subscriptions/me');
      setCurrentPlanId(response.data.plan_id);
    } catch (err) {
      // User may not have a subscription
      console.log('No subscription found');
    }
  };

  const handleSelectPlan = async (planId: number) => {
    if (!session) {
      router.push('/auth/signin?redirect=/pricing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const successUrl = `${window.location.origin}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/pricing`;

      const response = await api.post('/v1/subscriptions/checkout', {
        plan_id: planId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create checkout session');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your needs
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelectPlan}
            isLoading={isLoading}
            currentPlanId={currentPlanId}
          />
        ))}
      </div>
    </div>
  );
}

