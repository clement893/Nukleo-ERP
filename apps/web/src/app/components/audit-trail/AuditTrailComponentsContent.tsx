/**
 * Audit Trail Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { AuditTrailViewer } from '@/components/audit-trail';

export default function AuditTrailComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Audit Trail"
        description="Security audit log viewer with filtering and export"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Audit Trail' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Audit Trail Viewer">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View security audit logs with filtering by event type, severity, and date range. Export to CSV.
          </p>
          <AuditTrailViewer />
        </Section>
      </div>
    </PageContainer>
  );
}



