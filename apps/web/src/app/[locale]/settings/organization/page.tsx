/**
 * Organization Settings Page
 * 
 * Page for managing organization settings including name, logo, domain, etc.
 * Uses existing OrganizationSettings component.
 */

'use client';

// Note: Client Components are automatically dynamic in Next.js App Router
// No need for export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { OrganizationSettings } from '@/components/settings';
import type { OrganizationSettingsData } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.organization');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    timezone?: string;
    locale?: string;
  }>({
    id: '1',
    name: '',
    slug: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadOrganization();
  }, [isAuthenticated, router]);

  const loadOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Load organization from API
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load organization settings', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load organization settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (data: OrganizationSettingsData) => {
    try {
      setError(null);
      // TODO: Save organization to API
      setOrganization({
        id: organization.id,
        ...data,
      });
      logger.info('Organization settings saved successfully');
    } catch (error: unknown) {
      logger.error('Failed to save organization settings', error instanceof Error ? error : new Error(String(error)));
      const errorMessage = getErrorMessage(error) || t('errors.saveFailed') || 'Failed to save organization settings. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Organization Settings'}
          description={t('description') || 'Manage your organization settings and configuration'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.organization') || 'Organization' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <OrganizationSettings organization={organization} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}

