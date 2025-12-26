/**
 * Menu Management Page
 * 
 * Page for managing navigation menus.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MenuBuilder } from '@/components/cms';
import type { Menu } from '@/components/cms';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';

export default function MenusPage() {
  const t = useTranslations('menus');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual menu API endpoint when available
      // const response = await apiClient.get('/v1/menus');
      // setMenu(response.data);
      
      setMenu(null);
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load menu', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load menu. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedMenu: Menu) => {
    try {
      // TODO: Replace with actual menu API endpoint when available
      // await apiClient.put(`/v1/menus/${updatedMenu.id}`, updatedMenu);
      logger.info('Saving menu', { menuId: updatedMenu.id, menuName: updatedMenu.name });
      setMenu(updatedMenu);
    } catch (error) {
      logger.error('Failed to save menu', error instanceof Error ? error : new Error(String(error)));
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
          title={t('title') || 'Menu Management'}
          description={t('description') || 'Build and manage navigation menus'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.menus') || 'Menus' },
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
          <MenuBuilder menu={menu || undefined} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}

