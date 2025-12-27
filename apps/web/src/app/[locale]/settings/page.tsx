/**
 * Settings Hub Page
 * 
 * Main settings page that displays navigation cards to different settings sections.
 * Acts as a hub for accessing all settings pages.
 * Accessible via dashboard navigation and sitemap.
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

'use client';

import { useTranslations } from 'next-intl';
import { PageHeader, PageContainer } from '@/components/layout';
import { SettingsNavigation } from '@/components/settings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Settings'}
          description={t('description') || 'Manage your application settings and preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings' },
          ]}
        />

        <div className="mt-8">
          <SettingsNavigation />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}


