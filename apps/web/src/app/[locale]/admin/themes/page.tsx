'use client';

/**
 * Theme Management Page
 * Main page for superadmin theme management
 */

import { useState } from 'react';
import { PageHeader, PageContainer } from '@/components/layout';
import { ThemeList } from './components/ThemeList';
import { ThemeEditor } from './components/ThemeEditor';
import { createTheme, updateTheme } from '@/lib/api/theme';
import { clearThemeCache } from '@/lib/theme/theme-cache';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';
import type { Theme, ThemeConfig } from '@modele/types';
import type { ThemeFormData } from './types';

function ThemesPageContent() {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { refreshTheme } = useGlobalTheme();

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setIsCreating(true);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setIsCreating(false);
  };

  const handleDeleteTheme = (theme: Theme) => {
    // Already handled in ThemeList with modal
    console.log('Delete theme:', theme);
  };

  const handleActivateTheme = (theme: Theme) => {
    // Already handled in ThemeList with modal
    console.log('Activate theme:', theme);
  };

  const handleDuplicateTheme = (theme: Theme) => {
    // Will be implemented in Batch 14
    console.log('Duplicate theme:', theme);
  };

  const handleSave = async (config: ThemeConfig, formData: ThemeFormData) => {
    try {
      if (editingTheme) {
        // Update existing theme
        await updateTheme(editingTheme.id, {
          display_name: formData.display_name,
          description: formData.description || undefined,
          config,
        });
        
        // Clear cache and refresh if active
        clearThemeCache();
        if (editingTheme.is_active) {
          await refreshTheme();
        }
      } else {
        // Create new theme
        await createTheme({
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description || undefined,
          config,
        });
      }
      
      // Close editor and refresh list
      setEditingTheme(null);
      setIsCreating(false);
      
      // Reload page to refresh theme list
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      throw new Error(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingTheme(null);
    setIsCreating(false);
  };

  const showEditor = editingTheme !== null || isCreating;

  return (
    <PageContainer>
      <PageHeader
        title="Gestion des Thèmes"
        description="Créez, modifiez et activez les thèmes de la plateforme"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Thèmes' },
        ]}
      />

      <div className="mt-6 space-y-6">
        {showEditor ? (
          <ThemeEditor
            theme={editingTheme}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ThemeList
            onCreateTheme={handleCreateTheme}
            onEditTheme={handleEditTheme}
            onDeleteTheme={handleDeleteTheme}
            onActivateTheme={handleActivateTheme}
            onDuplicateTheme={handleDuplicateTheme}
          />
        )}
      </div>
    </PageContainer>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ThemesPage() {
  return (
    <ProtectedSuperAdminRoute>
      <ThemesPageContent />
    </ProtectedSuperAdminRoute>
  );
}

