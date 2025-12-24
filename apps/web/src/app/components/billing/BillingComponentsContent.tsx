/**
 * Billing Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import {
  BillingDashboard,
  InvoiceList,
  InvoiceViewer,
  PaymentMethodForm,
  PaymentHistory,
  SubscriptionPlans,
  UsageMeter,
  BillingSettings,
} from '@/components/billing';
import Card from '@/components/ui/Card';
import { logger } from '@/lib/logger';
import { useState } from 'react';

export default function BillingComponentsContent() {
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    number: string;
    date: string;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  } | null>(null);

  const sampleInvoices = [
    {
      id: '1',
      number: 'INV-2024-001',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      amount: 99.00,
      currency: 'USD',
      status: 'paid' as const,
      description: 'Monthly Subscription',
      paymentMethod: 'Visa •••• 4242',
    },
    {
      id: '2',
      number: 'INV-2024-002',
      date: '2024-02-15',
      dueDate: '2024-03-15',
      amount: 99.00,
      currency: 'USD',
      status: 'paid' as const,
      description: 'Monthly Subscription',
      paymentMethod: 'Visa •••• 4242',
    },
    {
      id: '3',
      number: 'INV-2024-003',
      date: '2024-03-15',
      dueDate: '2024-04-15',
      amount: 149.00,
      currency: 'USD',
      status: 'pending' as const,
      description: 'Monthly Subscription (Upgraded)',
      paymentMethod: 'Visa •••• 4242',
    },
  ];

  const samplePayments = [
    {
      id: '1',
      date: '2024-03-15T10:30:00Z',
      amount: 149.00,
      currency: 'USD',
      status: 'completed' as const,
      description: 'Monthly Subscription',
      paymentMethod: 'Visa •••• 4242',
      transactionId: 'txn_1234567890',
    },
    {
      id: '2',
      date: '2024-02-15T10:30:00Z',
      amount: 99.00,
      currency: 'USD',
      status: 'completed' as const,
      description: 'Monthly Subscription',
      paymentMethod: 'Visa •••• 4242',
      transactionId: 'txn_0987654321',
    },
  ];

  const samplePlans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      currency: 'USD',
      interval: 'month' as const,
      features: [
        { name: '10 projects', included: true },
        { name: '5 team members', included: true },
        { name: 'Basic support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'API access', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing teams',
      price: 29,
      currency: 'USD',
      interval: 'month' as const,
      popular: true,
      features: [
        { name: 'Unlimited projects', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'API access', included: true },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      price: 99,
      currency: 'USD',
      interval: 'month' as const,
      features: [
        { name: 'Everything in Pro', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'SLA guarantee', included: true },
        { name: 'On-premise deployment', included: true },
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Facturation"
        description="Composants pour la gestion de la facturation, des abonnements et des paiements"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Facturation' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Billing Dashboard">
          <BillingDashboard
            subscription={{
              plan: 'Pro',
              status: 'active',
              currentPeriodEnd: '2024-04-15',
              amount: 29,
              currency: 'USD',
            }}
            usage={{
              current: 750,
              limit: 1000,
              unit: 'API calls',
            }}
            upcomingInvoice={{
              amount: 29,
              currency: 'USD',
              date: '2024-04-15',
            }}
            paymentMethod={{
              type: 'card',
              last4: '4242',
              brand: 'Visa',
            }}
          />
        </Section>

        <Section title="Subscription Plans">
          <SubscriptionPlans
            plans={samplePlans}
            currentPlanId="pro"
            onSelectPlan={(plan) => {
              logger.info('Plan selected:', { planId: plan.id });
            }}
          />
        </Section>

        <Section title="Usage Meter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageMeter
              label="API Calls"
              current={750}
              limit={1000}
              unit="calls"
              thresholds={{ warning: 70, critical: 90 }}
            />
            <UsageMeter
              label="Storage"
              current={8.5}
              limit={10}
              unit="GB"
              thresholds={{ warning: 80, critical: 95 }}
            />
            <UsageMeter
              label="Team Members"
              current={12}
              limit={15}
              unit="members"
              thresholds={{ warning: 80, critical: 90 }}
            />
          </div>
        </Section>

        <Section title="Invoice List">
          <InvoiceList
            invoices={sampleInvoices}
            onViewInvoice={(invoice) => {
              setSelectedInvoice({
                id: invoice.id,
                number: invoice.number,
                date: invoice.date,
                dueDate: invoice.dueDate,
                status: invoice.status,
                subtotal: invoice.amount * 0.9,
                tax: invoice.amount * 0.1,
                total: invoice.amount,
                currency: invoice.currency,
                items: [
                  {
                    description: invoice.description,
                    quantity: 1,
                    unitPrice: invoice.amount * 0.9,
                    total: invoice.amount * 0.9,
                  },
                ],
              });
            }}
            onDownloadInvoice={(invoice) => {
              logger.info('Download invoice:', { invoiceId: invoice.id });
            }}
          />
        </Section>

        {selectedInvoice && (
          <Section title="Invoice Viewer">
            <InvoiceViewer
              invoice={{
                ...selectedInvoice,
                customer: {
                  name: 'John Doe',
                  email: 'john@example.com',
                  address: '123 Main St\nNew York, NY 10001',
                },
                company: {
                  name: 'Your Company',
                  address: '456 Business Ave\nSan Francisco, CA 94102',
                  taxId: 'TAX123456789',
                },
              }}
              onBack={() => setSelectedInvoice(null)}
              onDownload={() => logger.info('Download invoice PDF')}
              onPrint={() => logger.info('Print invoice')}
            />
          </Section>
        )}

        <Section title="Payment History">
          <PaymentHistory
            payments={samplePayments}
            onDownloadReceipt={(payment) => {
              logger.info('Download receipt:', { paymentId: payment.id });
            }}
          />
        </Section>

        <Section title="Payment Method Form">
          <div className="max-w-2xl">
            <PaymentMethodForm
              onSubmit={async (data) => {
                logger.info('Payment method submitted:', { data });
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
              onCancel={() => logger.info('Payment method form cancelled')}
            />
          </div>
        </Section>

        <Section title="Billing Settings">
          <div className="max-w-4xl">
            <BillingSettings
              settings={{
                autoRenewal: true,
                emailNotifications: true,
                invoiceEmail: 'billing@example.com',
                taxId: 'TAX123456789',
                billingAddress: {
                  line1: '123 Main Street',
                  line2: 'Suite 100',
                  city: 'New York',
                  state: 'NY',
                  postalCode: '10001',
                  country: 'United States',
                },
                currency: 'USD',
                language: 'en',
              }}
              onSave={async (settings) => {
                logger.info('Billing settings saved:', { settings });
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
            />
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

