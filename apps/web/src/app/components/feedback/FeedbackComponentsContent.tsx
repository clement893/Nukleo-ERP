/**
 * Feedback Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { FeedbackForm, FeedbackList } from '@/components/feedback';

export default function FeedbackComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Feedback & Support"
        description="User feedback and support ticket system"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Feedback' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Feedback Form">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Submit feedback with different types (bug reports, feature requests, questions, etc.).
          </p>
          <FeedbackForm />
        </Section>

        <Section title="Feedback List">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View and manage user feedback with status tracking.
          </p>
          <FeedbackList />
        </Section>
      </div>
    </PageContainer>
  );
}



