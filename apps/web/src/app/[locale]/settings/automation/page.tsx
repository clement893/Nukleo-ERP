/**
 * Automation Settings Page
 * 
 * Page for managing automation rules and scheduled tasks.
 * Accessible via settings hub navigation.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader, PageContainer } from '@/components/layout';
import { AutomationSettings } from '@/components/settings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

export default function AutomationSettingsPage() {
  const t = useTranslations('settings.automation');

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Automatisation'}
          description={t('description') || 'Gérez vos automatisations et tâches planifiées'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Paramètres', href: '/settings' },
            { label: t('breadcrumbs.automation') || 'Automatisation' },
          ]}
        />

        <div className="mt-8">
          <ErrorBoundary>
            <AutomationSettings />
          </ErrorBoundary>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
