/**
 * Theme Manager Component - Admin interface for managing platform themes.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  listThemes,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
} from '@/lib/api/theme';
import type { Theme, ThemeCreate, ThemeUpdate } from '@modele/types';
import { ThemeEditor } from './ThemeEditor';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, Edit, Trash2, CheckCircle2, Power } from 'lucide-react';

export interface ThemeManagerProps {
  authToken: string;
}

export function AdminThemeManager({ authToken }: ThemeManagerProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listThemes(authToken);
      // Ensure we have themes - if empty, the backend should create a default one
      if (response.themes && response.themes.length > 0) {
        setThemes(response.themes);
      } else {
        // If no themes returned, try to reload after a short delay
        // The backend should have created a default theme
        setTimeout(async () => {
          try {
            const retryResponse = await listThemes(authToken);
            if (retryResponse.themes && retryResponse.themes.length > 0) {
              setThemes(retryResponse.themes);
            } else {
              setError('No themes found. Please create a theme.');
            }
          } catch (retryErr) {
            setError('Failed to load themes. Please refresh the page.');
          }
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
      // Try to reload themes once more
      setTimeout(async () => {
        try {
          const retryResponse = await listThemes(authToken);
          if (retryResponse.themes && retryResponse.themes.length > 0) {
            setThemes(retryResponse.themes);
            setError(null);
          }
        } catch {
          // Ignore retry errors
        }
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTheme = async (themeData: ThemeCreate) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createTheme(themeData, authToken);
      await loadThemes();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTheme = async (themeId: number, themeData: ThemeUpdate) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateTheme(themeId, themeData, authToken);
      await loadThemes();
      setEditingTheme(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateTheme = async (themeId: number) => {
    try {
      setError(null);
      await activateTheme(themeId, authToken);
      await loadThemes();
      // Refresh the page to apply the new theme
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate theme');
    }
  };

  const handleDeleteTheme = async (themeId: number) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    try {
      setError(null);
      await deleteTheme(themeId, authToken);
      await loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete theme');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading themes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Thèmes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créez et gérez les thèmes globaux de la plateforme
          </p>
        </div>
        {!showCreateForm && !editingTheme && (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un thème
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <ThemeEditor
          onSubmit={(data) => handleCreateTheme(data as ThemeCreate)}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Edit Form */}
      {editingTheme && (
        <ThemeEditor
          theme={editingTheme}
          onSubmit={(data) => handleUpdateTheme(editingTheme.id, data)}
          onCancel={() => setEditingTheme(null)}
          isLoading={isSubmitting}
        />
      )}

      {/* Themes List */}
      {!showCreateForm && !editingTheme && (
        <>
          {themes.length === 0 && !isLoading && (
            <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200">
                Aucun thème trouvé. Le thème par défaut devrait être créé automatiquement.
                Veuillez rafraîchir la page ou créer un nouveau thème.
              </p>
            </Card>
          )}

          {themes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {themes.map((theme) => {
                const config = theme.config || {};
                const primaryColor = config.primary || '#3b82f6';
                
                return (
                  <Card
                    key={theme.id}
                    className={`p-6 transition-all hover:shadow-lg ${
                      theme.is_active ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{theme.display_name}</h3>
                            {theme.is_active && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Actif
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {theme.name}
                          </p>
                          {theme.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              {theme.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Color Preview */}
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: typeof primaryColor === 'string' ? primaryColor : '#3b82f6' }}
                          title="Couleur principale"
                        />
                        {typeof config.secondary === 'string' && config.secondary && (
                          <div
                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: config.secondary }}
                            title="Couleur secondaire"
                          />
                        )}
                        {typeof config.danger === 'string' && config.danger && (
                          <div
                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: config.danger }}
                            title="Couleur danger"
                          />
                        )}
                        {typeof config.warning === 'string' && config.warning && (
                          <div
                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: config.warning }}
                            title="Couleur avertissement"
                          />
                        )}
                        {typeof config.info === 'string' && config.info && (
                          <div
                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: config.info }}
                            title="Couleur information"
                          />
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div>Mode: {typeof config.mode === 'string' ? config.mode : 'system'}</div>
                        {config.typography && typeof config.typography === 'object' && 'fontFamily' in config.typography && typeof config.typography.fontFamily === 'string' && (
                          <div>Police: {config.typography.fontFamily.split(',')[0]}</div>
                        )}
                        <div className="mt-1">
                          Mis à jour: {new Date(theme.updated_at).toLocaleString('fr-FR')}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {!theme.is_active && (
                          <Button
                            onClick={() => handleActivateTheme(theme.id)}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                          >
                            <Power className="w-4 h-4 mr-1" />
                            Activer
                          </Button>
                        )}
                        <Button
                          onClick={() => setEditingTheme(theme)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        {!theme.is_active && (
                          <Button
                            onClick={() => handleDeleteTheme(theme.id)}
                            variant="danger"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


