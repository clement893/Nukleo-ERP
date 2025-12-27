/**
 * General Settings Page
 * 
 * Page for managing general application settings including language, timezone, theme, etc.
 * Accessible via settings hub navigation.
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { GeneralSettings } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export default function GeneralSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.general');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    language: 'en',
    timezone: 'UTC',
    theme: 'system' as 'light' | 'dark' | 'system',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h' as '12h' | '24h',
    weekStartsOn: 'monday' as 'monday' | 'sunday',
    enableNotifications: true,
    enableEmailNotifications: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadSettings();
  }, [isAuthenticated, router]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Load settings from API
      // For now, use default settings
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load general settings', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (data: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStartsOn: 'monday' | 'sunday';
    enableNotifications: boolean;
    enableEmailNotifications: boolean;
  }) => {
    try {
      setError(null);
      // TODO: Save settings to API
      setSettings(data);
      logger.info('General settings saved successfully');
      // Show success message (could use toast)
    } catch (error: unknown) {
      logger.error('Failed to save general settings', error instanceof Error ? error : new Error(String(error)));
      const errorMessage = getErrorMessage(error) || t('errors.saveFailed') || 'Failed to save settings. Please try again.';
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
          title={t('title') || 'General Settings'}
          description={t('description') || 'Manage general application settings and preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.general') || 'General' },
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
          <GeneralSettings settings={settings} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}


