/**
 * Scheduled Tasks Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { TaskManager } from '@/components/scheduled-tasks';

export default function ScheduledTasksComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Scheduled Tasks"
        description="Background tasks and scheduled jobs management"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Scheduled Tasks' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Task Manager">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage scheduled tasks with recurrence, status tracking, and execution logs.
          </p>
          <TaskManager />
        </Section>
      </div>
    </PageContainer>
  );
}



