/**
 * Preferences Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { PreferencesManager } from '@/components/preferences';

export default function PreferencesComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="User Preferences"
        description="Manage user preferences and settings"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Preferences' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Preferences Manager">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            User preferences system with theme, language, and custom settings.
          </p>
          <PreferencesManager />
        </Section>
      </div>
    </PageContainer>
  );
}



