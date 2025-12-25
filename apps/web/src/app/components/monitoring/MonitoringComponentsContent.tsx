/**
 * Monitoring Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import {
  AlertsPanel,
  ErrorTrackingDashboard,
  HealthStatus,
  LogsViewer,
  MetricsChart,
  SystemPerformanceDashboard,
  PerformanceProfiler,
  SystemMetrics,
} from '@/components/monitoring';

export default function MonitoringComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants de Monitoring"
        description="Composants pour le monitoring système, métriques et santé de l'application"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Monitoring' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="System Performance Dashboard">
          <SystemPerformanceDashboard />
        </Section>

        <Section title="Health Status">
          <HealthStatus />
        </Section>

        <Section title="System Metrics">
          <SystemMetrics />
        </Section>

        <Section title="Metrics Chart">
          <MetricsChart metricName="requests" title="Request Metrics" />
        </Section>

        <Section title="Error Tracking Dashboard">
          <ErrorTrackingDashboard />
        </Section>

        <Section title="Alerts Panel">
          <AlertsPanel />
        </Section>

        <Section title="Logs Viewer">
          <LogsViewer />
        </Section>

        <Section title="Performance Profiler">
          <PerformanceProfiler />
        </Section>
      </div>
    </PageContainer>
  );
}
