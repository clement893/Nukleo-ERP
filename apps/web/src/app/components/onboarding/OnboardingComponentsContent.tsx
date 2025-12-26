/**
 * Onboarding Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { OnboardingWizard } from '@/components/onboarding';
import { useState } from 'react';

export default function OnboardingComponentsContent() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <PageContainer>
      <PageHeader
        title="Onboarding Flow"
        description="User onboarding wizard with multi-step progress tracking"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Onboarding' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Onboarding Wizard">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Multi-step onboarding wizard with progress tracking and skip functionality.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Show Onboarding Wizard
          </button>
          {showWizard && (
            <OnboardingWizard onComplete={() => setShowWizard(false)} />
          )}
        </Section>
      </div>
    </PageContainer>
  );
}



