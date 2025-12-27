/**
 * Profile Security Page
 * 
 * User security settings page including 2FA, password, API keys, and active sessions.
 * Accessible via profile navigation.
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { usersAPI } from '@/lib/api';
import { SecuritySettings, APIKeys } from '@/components/settings';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

interface UserData {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  two_factor_enabled?: boolean;
}

export default function ProfileSecurityPage() {
  const router = useRouter();
  const t = useTranslations('profile.security');
  const { isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('security');
  interface APIKey {
    id: number | string;
    name: string;
    key_prefix: string;
    created_at: string;
    last_used_at?: string;
    [key: string]: unknown;
  }
  
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadUser();
    loadAPIKeys();
  }, [isAuthenticated, router]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getMe();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      logger.error('Failed to load user security info', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load security settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAPIKeys = async () => {
    try {
      // TODO: Add API keys API call when available
      // const response = await apiKeysAPI.getMyKeys();
      // setApiKeys(response.data || []);
    } catch (error) {
      logger.error('Failed to load API keys', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleSecuritySettingsSave = async (data: {
    twoFactorEnabled: boolean;
    sessionTimeout?: number;
    passwordExpiry?: number;
    requireStrongPassword: boolean;
    loginNotifications: boolean;
    suspiciousActivityAlerts: boolean;
  }) => {
    try {
      // TODO: Implement security settings save
      logger.info('Security settings saved', { data });
    } catch (error: unknown) {
      logger.error('Failed to save security settings', error instanceof Error ? error : new Error(String(error)));
      const errorMessage = getErrorMessage(error) || t('errors.updateFailed') || 'Failed to update security settings. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  const handleEnable2FA = async () => {
    try {
      // TODO: Implement 2FA enable flow
      logger.info('2FA enable requested');
      router.push('/profile/security/2fa/setup');
    } catch (error) {
      logger.error('Failed to enable 2FA', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleDisable2FA = async () => {
    try {
      // TODO: Implement 2FA disable flow
      logger.info('2FA disable requested');
    } catch (error) {
      logger.error('Failed to disable 2FA', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleChangePassword = () => {
    router.push('/profile/security/password');
  };

  const handleCreateAPIKey = async (name: string, scopes: string[]) => {
    try {
      // TODO: Implement API key creation
      logger.info('API key creation requested', { name, scopes });
      // const response = await apiKeysAPI.create({ name, scopes });
      // return response.data;
      return {
        id: `key-${Date.now()}`,
        name,
        // SECURITY: This is a placeholder for UI display only, not a real API key
        key: 'sk_test_' + 'PLACEHOLDER_KEY_DO_NOT_USE',
        prefix: 'sk_test_',
        createdAt: new Date().toISOString(),
        scopes,
      };
    } catch (error) {
      logger.error('Failed to create API key', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleDeleteAPIKey = async (id: string) => {
    try {
      // TODO: Implement API key deletion
      logger.info('API key deletion requested', { id });
      // await apiKeysAPI.delete(id);
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
    } catch (error) {
      logger.error('Failed to delete API key', error instanceof Error ? error : new Error(String(error)));
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

  if (!user) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <PageHeader title={t('title') || 'Security'} description={t('description') || 'Manage your security settings'} />
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('errors.loadFailed') || 'Failed to load security settings'}</p>
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Security'}
          description={t('description') || 'Manage your security settings, 2FA, and API keys'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.profile') || 'Profile', href: '/profile' },
            { label: t('breadcrumbs.security') || 'Security' },
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
          <Tabs defaultTab={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="security">{t('tabs.security') || 'Security'}</Tab>
              <Tab value="api-keys">{t('tabs.apiKeys') || 'API Keys'}</Tab>
            </TabList>

            <TabPanels>
              {/* Security Settings Tab */}
              <TabPanel value="security">
                <Section title={t('sections.security') || 'Security Settings'} className="mt-6">
                  <SecuritySettings
                    settings={{
                      twoFactorEnabled: user.two_factor_enabled || false,
                      requireStrongPassword: true,
                      loginNotifications: true,
                      suspiciousActivityAlerts: true,
                    }}
                    onSave={handleSecuritySettingsSave}
                    onEnable2FA={handleEnable2FA}
                    onDisable2FA={handleDisable2FA}
                    onChangePassword={handleChangePassword}
                  />
                </Section>
              </TabPanel>

              {/* API Keys Tab */}
              <TabPanel value="api-keys">
                <Section title={t('sections.apiKeys') || 'API Keys'} className="mt-6">
                  <APIKeys
                    apiKeys={apiKeys.map((key) => ({
                      id: String(key.id),
                      name: key.name,
                      key: (key as { key?: string }).key || '',
                      prefix: key.key_prefix,
                      lastUsed: key.last_used_at,
                      createdAt: key.created_at,
                      expiresAt: (key as { expires_at?: string }).expires_at,
                      scopes: (key as { scopes?: string[] }).scopes || [],
                    }))}
                    onCreate={handleCreateAPIKey}
                    onDelete={handleDeleteAPIKey}
                  />
                </Section>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}

