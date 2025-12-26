/**
 * Backups Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { BackupManager } from '@/components/backups';

export default function BackupsComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Backup & Restore"
        description="Database and file backup management with restore operations"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Backups' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Backup Manager">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage backups with restore operations, expiration handling, and status tracking.
          </p>
          <BackupManager />
        </Section>
      </div>
    </PageContainer>
  );
}



