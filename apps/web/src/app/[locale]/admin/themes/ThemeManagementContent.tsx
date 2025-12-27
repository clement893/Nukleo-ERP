'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listThemes, activateTheme, createTheme, deleteTheme, getActiveTheme } from '@/lib/api/theme';
import type { Theme, ThemeCreate, ThemeListResponse } from '@modele/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import { 
  Palette, 
  Plus, 
  Check, 
  Trash2, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';

export function ThemeManagementContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state for creating new theme
  const [newTheme, setNewTheme] = useState<ThemeCreate>({
    name: '',
    display_name: '',
    description: '',
    config: {
      primary_color: '#3b82f6',
      secondary_color: '#8b5cf6',
      danger_color: '#ef4444',
      warning_color: '#f59e0b',
      info_color: '#06b6d4',
      success_color: '#10b981',
      font_family: 'Inter',
      border_radius: '8px',
      mode: 'system', // Add mode field
    },
  });

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ThemeListResponse = await listThemes();
      setThemes(response.themes || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load themes';
      setError(errorMessage);
      logger.error('Failed to fetch themes', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleActivateTheme = async (themeId: number) => {
    try {
      setActivatingId(themeId);
      await activateTheme(themeId);
      await fetchThemes(); // Refresh list
      showToast({
        title: 'Thème activé',
        message: 'Le thème a été activé avec succès.',
        variant: 'success',
      });
      // Refresh active theme in the app
      await getActiveTheme();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate theme';
      showToast({
        title: 'Erreur',
        message: errorMessage,
        variant: 'error',
      });
      logger.error('Failed to activate theme', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setActivatingId(null);
    }
  };

  const handleCreateTheme = async () => {
    try {
      // Validate form
      if (!newTheme.name || !newTheme.display_name) {
        showToast({
          title: 'Erreur de validation',
          message: 'Le nom et le nom d\'affichage sont requis.',
          variant: 'error',
        });
        return;
      }

      await createTheme(newTheme);
      setShowCreateModal(false);
      // Reset form
      setNewTheme({
        name: '',
        display_name: '',
        description: '',
        config: {
          primary_color: '#3b82f6',
          secondary_color: '#8b5cf6',
          danger_color: '#ef4444',
          warning_color: '#f59e0b',
          info_color: '#06b6d4',
          success_color: '#10b981',
          font_family: 'Inter',
          border_radius: '8px',
          mode: 'system',
        },
      });
      await fetchThemes(); // Refresh list
      showToast({
        title: 'Thème créé',
        message: 'Le nouveau thème a été créé avec succès.',
        variant: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create theme';
      showToast({
        title: 'Erreur',
        message: errorMessage,
        variant: 'error',
      });
      logger.error('Failed to create theme', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDeleteTheme = async () => {
    if (!themeToDelete) return;

    try {
      setDeletingId(themeToDelete.id);
      await deleteTheme(themeToDelete.id);
      setShowDeleteModal(false);
      setThemeToDelete(null);
      await fetchThemes(); // Refresh list
      showToast({
        title: 'Thème supprimé',
        message: 'Le thème a été supprimé avec succès.',
        variant: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete theme';
      showToast({
        title: 'Erreur',
        message: errorMessage,
        variant: 'error',
      });
      logger.error('Failed to delete theme', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteModal = (theme: Theme) => {
    if (theme.is_active) {
      showToast({
        title: 'Impossible de supprimer',
        message: 'Vous ne pouvez pas supprimer le thème actif. Activez un autre thème d\'abord.',
        variant: 'error',
      });
      return;
    }
    setThemeToDelete(theme);
    setShowDeleteModal(true);
  };

  const handleVisualizeTheme = (themeId: number) => {
    router.push(`/admin/theme-visualisation?themeId=${themeId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des thèmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-8 h-8" />
            Gestion des Thèmes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les thèmes de la plateforme. Activez un thème pour l'appliquer à tous les utilisateurs.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer un thème
        </Button>
      </div>

      {error && (
        <Alert variant="error" title="Erreur" className="mb-6">
          {error}
          <Button onClick={fetchThemes} className="mt-4" variant="secondary" size="sm">
            Réessayer
          </Button>
        </Alert>
      )}

      {/* Themes Grid */}
      {themes.length === 0 ? (
        <Card className="text-center py-12">
          <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun thème trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Créez votre premier thème pour commencer.
          </p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Créer un thème
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className={`relative transition-all hover:shadow-lg ${
                theme.is_active ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {theme.is_active && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    <Check className="w-3 h-3 mr-1" />
                    Actif
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {theme.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {theme.name}
                  </p>
                </div>

                {theme.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {theme.description}
                  </p>
                )}

                {/* Color Preview */}
                <div className="flex gap-2">
                  {theme.config.primary_color && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: theme.config.primary_color }}
                      title="Primary"
                    />
                  )}
                  {theme.config.secondary_color && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: theme.config.secondary_color }}
                      title="Secondary"
                    />
                  )}
                  {theme.config.danger_color && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: theme.config.danger_color }}
                      title="Danger"
                    />
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {!theme.is_active && (
                    <Button
                      onClick={() => handleActivateTheme(theme.id)}
                      variant="primary"
                      size="sm"
                      disabled={activatingId === theme.id}
                      className="flex-1"
                    >
                      {activatingId === theme.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Activer
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleVisualizeTheme(theme.id)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                  {theme.id !== 32 && !theme.is_active && (
                    <Button
                      onClick={() => openDeleteModal(theme)}
                      variant="danger"
                      size="sm"
                      disabled={deletingId === theme.id}
                    >
                      {deletingId === theme.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Theme Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau thème"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom technique"
            value={newTheme.name}
            onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
            placeholder="mon-theme"
            required
            helperText="Identifiant unique (minuscules, tirets, underscores uniquement)"
          />

          <Input
            label="Nom d'affichage"
            value={newTheme.display_name}
            onChange={(e) => setNewTheme({ ...newTheme, display_name: e.target.value })}
            placeholder="Mon Thème"
            required
          />

          <Textarea
            label="Description"
            value={newTheme.description || ''}
            onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
            placeholder="Description du thème..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur principale
              </label>
              <input
                type="color"
                value={newTheme.config.primary_color}
                onChange={(e) =>
                  setNewTheme({
                    ...newTheme,
                    config: { ...newTheme.config, primary_color: e.target.value },
                  })
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur secondaire
              </label>
              <input
                type="color"
                value={newTheme.config.secondary_color}
                onChange={(e) =>
                  setNewTheme({
                    ...newTheme,
                    config: { ...newTheme.config, secondary_color: e.target.value },
                  })
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danger
              </label>
              <input
                type="color"
                value={newTheme.config.danger_color}
                onChange={(e) =>
                  setNewTheme({
                    ...newTheme,
                    config: { ...newTheme.config, danger_color: e.target.value },
                  })
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Warning
              </label>
              <input
                type="color"
                value={newTheme.config.warning_color}
                onChange={(e) =>
                  setNewTheme({
                    ...newTheme,
                    config: { ...newTheme.config, warning_color: e.target.value },
                  })
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          <Input
            label="Police de caractères"
            value={newTheme.config.font_family || ''}
            onChange={(e) =>
              setNewTheme({
                ...newTheme,
                config: { ...newTheme.config, font_family: e.target.value },
              })
            }
            placeholder="Inter"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
            >
              Annuler
            </Button>
            <Button onClick={handleCreateTheme} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Créer le thème
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setThemeToDelete(null);
        }}
        title="Supprimer le thème"
        size="md"
      >
        {themeToDelete && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Êtes-vous sûr de vouloir supprimer le thème{' '}
              <strong>{themeToDelete.display_name}</strong> ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Cette action est irréversible. Le thème sera définitivement supprimé de la base de données.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setThemeToDelete(null);
                }}
                variant="secondary"
              >
                Annuler
              </Button>
              <Button onClick={handleDeleteTheme} variant="danger" disabled={deletingId !== null}>
                {deletingId ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

