'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listThemes, activateTheme, createTheme, deleteTheme, ThemeValidationError } from '@/lib/api/theme';
import { formatValidationErrors } from '@/lib/api/theme-errors';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme/default-theme-config';
import { validateThemeConfig, getValidationSummary } from '@/lib/theme/theme-validator';
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
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';

export function ThemeManagementContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshTheme } = useGlobalTheme();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form state for creating new theme - use comprehensive default config
  const [newTheme, setNewTheme] = useState<ThemeCreate>({
    name: '',
    display_name: '',
    description: '',
    config: {
      ...DEFAULT_THEME_CONFIG,
      // Override with user-selected colors
      primary_color: DEFAULT_THEME_CONFIG.primary_color,
      secondary_color: DEFAULT_THEME_CONFIG.secondary_color,
      danger_color: DEFAULT_THEME_CONFIG.danger_color,
      warning_color: DEFAULT_THEME_CONFIG.warning_color,
      info_color: DEFAULT_THEME_CONFIG.info_color,
      success_color: DEFAULT_THEME_CONFIG.success_color,
    },
    is_active: false, // Don't activate by default
  });

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ThemeListResponse = await listThemes();
      setThemes(response.themes || []);
    } catch (err) {
      // Handle 401/403 errors gracefully - user might not be superadmin
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized'))) {
        setError('Vous n\'avez pas les permissions nécessaires pour accéder à cette page. Cette fonctionnalité nécessite un compte superadmin.');
        logger.warn('Unauthorized access attempt to themes management');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load themes';
        setError(errorMessage);
        logger.error('Failed to fetch themes', err instanceof Error ? err : new Error(String(err)));
      }
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
      
      // Refresh global theme immediately to apply changes site-wide
      await refreshTheme();
      
      showToast({
        message: 'Le thème a été activé avec succès.',
        type: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate theme';
      showToast({
        message: errorMessage,
        type: 'error',
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
          message: 'Le nom et le nom d\'affichage sont requis.',
          type: 'error',
        });
        return;
      }

      // Validate name format (lowercase, dashes, underscores only)
      const nameRegex = /^[a-z0-9_-]+$/;
      if (!nameRegex.test(newTheme.name)) {
        showToast({
          message: 'Le nom technique doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores.',
          type: 'error',
        });
        return;
      }

      // Ensure config has all required fields from default config
      const themeToCreate: ThemeCreate = {
        ...newTheme,
        config: {
          ...DEFAULT_THEME_CONFIG,
          ...newTheme.config,
          // Ensure colors are set in both formats for compatibility
          primary_color: newTheme.config.primary_color || DEFAULT_THEME_CONFIG.primary_color,
          secondary_color: newTheme.config.secondary_color || DEFAULT_THEME_CONFIG.secondary_color,
          danger_color: newTheme.config.danger_color || DEFAULT_THEME_CONFIG.danger_color,
          warning_color: newTheme.config.warning_color || DEFAULT_THEME_CONFIG.warning_color,
          info_color: newTheme.config.info_color || DEFAULT_THEME_CONFIG.info_color,
          success_color: newTheme.config.success_color || DEFAULT_THEME_CONFIG.success_color,
          colors: {
            ...DEFAULT_THEME_CONFIG.colors,
            primary: newTheme.config.primary_color || DEFAULT_THEME_CONFIG.primary_color,
            secondary: newTheme.config.secondary_color || DEFAULT_THEME_CONFIG.secondary_color,
            danger: newTheme.config.danger_color || DEFAULT_THEME_CONFIG.danger_color,
            warning: newTheme.config.warning_color || DEFAULT_THEME_CONFIG.warning_color,
            info: newTheme.config.info_color || DEFAULT_THEME_CONFIG.info_color,
            success: newTheme.config.success_color || DEFAULT_THEME_CONFIG.success_color,
          },
        },
      };

      // Validate theme configuration before submission
      const validation = validateThemeConfig(themeToCreate.config, {
        strictContrast: false,
        logWarnings: false,
      });

      if (!validation.valid) {
        const errors: string[] = [];
        
        // Add color format errors
        if (validation.colorFormatErrors.length > 0) {
          errors.push(`Erreurs de format de couleur (${validation.colorFormatErrors.length}):`);
          validation.colorFormatErrors.forEach(error => {
            errors.push(`  • ${error.field}: ${error.message}`);
          });
        }
        
        // Add critical contrast issues
        const criticalIssues = validation.contrastIssues.filter(issue => issue.level === 'fail');
        if (criticalIssues.length > 0) {
          errors.push(`Problèmes de contraste critiques (${criticalIssues.length}):`);
          criticalIssues.forEach(issue => {
            errors.push(`  • ${issue.element}: ${issue.message}`);
          });
        }
        
        setValidationErrors(errors);
        showToast({
          message: `Erreurs de validation détectées. Veuillez corriger les problèmes avant de continuer.`,
          type: 'error',
          duration: 10000,
        });
        return;
      }

      // Clear validation errors if validation passes
      setValidationErrors([]);

      setCreating(true);
      await createTheme(themeToCreate);
      setShowCreateModal(false);
      
      // Reset form to default
      setNewTheme({
        name: '',
        display_name: '',
        description: '',
        config: {
          ...DEFAULT_THEME_CONFIG,
          primary_color: DEFAULT_THEME_CONFIG.primary_color,
          secondary_color: DEFAULT_THEME_CONFIG.secondary_color,
          danger_color: DEFAULT_THEME_CONFIG.danger_color,
          warning_color: DEFAULT_THEME_CONFIG.warning_color,
          info_color: DEFAULT_THEME_CONFIG.info_color,
          success_color: DEFAULT_THEME_CONFIG.success_color,
        },
        is_active: false,
      });
      
      await fetchThemes(); // Refresh list
      
      // If the new theme was set as active, refresh global theme
      if (themeToCreate.is_active) {
        await refreshTheme();
      }
      
      showToast({
        message: 'Le nouveau thème a été créé avec succès.',
        type: 'success',
      });
    } catch (err) {
      // Handle ThemeValidationError specifically
      if (err instanceof ThemeValidationError) {
        const formattedErrors = formatValidationErrors(err.parsedError.validationErrors);
        setValidationErrors(formattedErrors);
        showToast({
          message: 'Erreurs de validation détectées par le serveur. Veuillez corriger les problèmes.',
          type: 'error',
          duration: 10000,
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Échec de la création du thème';
        showToast({
          message: errorMessage,
          type: 'error',
          duration: 10000,
        });
        logger.error('Failed to create theme', err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setCreating(false);
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
        message: 'Le thème a été supprimé avec succès.',
        type: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete theme';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      logger.error('Failed to delete theme', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteModal = (theme: Theme) => {
    if (theme.is_active) {
      showToast({
        message: 'Vous ne pouvez pas supprimer le thème actif. Activez un autre thème d\'abord.',
        type: 'error',
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
                  {(theme.config.primary_color || (theme.config as any).colors?.primary) && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: theme.config.primary_color || (theme.config as any).colors?.primary }}
                      title="Primary"
                    />
                  )}
                  {(theme.config.secondary_color || (theme.config as any).colors?.secondary) && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: theme.config.secondary_color || (theme.config as any).colors?.secondary }}
                      title="Secondary"
                    />
                  )}
                  {(theme.config.danger_color || (theme.config as any).colors?.danger || (theme.config as any).colors?.destructive) && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: theme.config.danger_color || (theme.config as any).colors?.danger || (theme.config as any).colors?.destructive }}
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
        onClose={() => {
          setShowCreateModal(false);
          setValidationErrors([]);
        }}
        title="Créer un nouveau thème"
        size="lg"
      >
        <div className="space-y-4">
          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <Alert variant="error" title="Erreurs de validation" className="mb-4">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index} className={error.startsWith('  •') ? 'ml-4' : 'font-semibold'}>
                    {error}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
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

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Couleurs</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Info
                </label>
                <input
                  type="color"
                  value={newTheme.config.info_color || DEFAULT_THEME_CONFIG.info_color}
                  onChange={(e) =>
                    setNewTheme({
                      ...newTheme,
                      config: { ...newTheme.config, info_color: e.target.value },
                    })
                  }
                  className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Success
                </label>
                <input
                  type="color"
                  value={newTheme.config.success_color || DEFAULT_THEME_CONFIG.success_color}
                  onChange={(e) =>
                    setNewTheme({
                      ...newTheme,
                      config: { ...newTheme.config, success_color: e.target.value },
                    })
                  }
                  className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Typographie</h3>
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
              helperText="Exemple: Inter, Roboto, sans-serif"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Apparence</h3>
            <Input
              label="Border Radius"
              value={newTheme.config.border_radius || DEFAULT_THEME_CONFIG.border_radius}
              onChange={(e) =>
                setNewTheme({
                  ...newTheme,
                  config: { ...newTheme.config, border_radius: e.target.value },
                })
              }
              placeholder="8px"
              helperText="Exemple: 8px, 0.5rem, 4px"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
              disabled={creating}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateTheme} 
              variant="primary"
              disabled={creating}
              loading={creating}
            >
              <Plus className="w-4 h-4 mr-2" />
              {creating ? 'Création...' : 'Créer le thème'}
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

