/**
 * Email Templates Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { EmailTemplateManager } from '@/components/email-templates';

export default function EmailTemplatesComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Email Templates"
        description="Email template management with versioning and variable rendering"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Email Templates' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Email Template Manager">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage email templates with HTML/text versions, variables, and version history.
          </p>
          <EmailTemplateManager />
        </Section>
      </div>
    </PageContainer>
  );
}



