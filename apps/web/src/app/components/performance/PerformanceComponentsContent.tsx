'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import OfflineSupport from '@/components/performance/OfflineSupport';
import OptimisticUpdates from '@/components/performance/OptimisticUpdates';
import PerformanceDashboard from '@/components/performance/PerformanceDashboard';
import ErrorReporting from '@/components/errors/ErrorReporting';

export default function PerformanceComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants de Performance"
        description="Composants pour le monitoring, l'optimisation et la gestion des performances"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Performance' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Performance Monitoring Dashboard">
          <PerformanceDashboard />
        </Section>

        <Section title="Offline Support">
          <OfflineSupport showDetails={true} />
        </Section>

        <Section title="Optimistic Updates">
          <OptimisticUpdates />
        </Section>

        <Section title="Error Reporting">
          <ErrorReporting
            onSubmit={async (data) => {
              console.log('Error Report Submitted:', data);
              // In a real app, this would send to your error reporting service
              await new Promise(resolve => setTimeout(resolve, 1000));
            }}
          />
        </Section>
      </div>
    </PageContainer>
  );
}

