'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Loading, Alert } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { listThemes, getActiveTheme, updateActiveThemeMode, activateTheme } from '@/lib/api/theme';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import type { Theme, ThemeConfigResponse } from '@modele/types';
import ClientOnly from '@/components/ui/ClientOnly';

function AdminThemeSectionContent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState<ThemeConfigResponse | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadThemeData();
    }
  }, [isSuperAdmin]);

  const checkSuperAdmin = async () => {
    try {
      const token = TokenStorage.getToken();
      if (!token) {
        setIsSuperAdmin(false);
        return;
      }
      const status = await checkMySuperAdminStatus(token);
      setIsSuperAdmin(status.is_superadmin || false);
    } catch (err) {
      setIsSuperAdmin(false);
    }
  };

  const loadThemeData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = TokenStorage.getToken();
      
      if (!token) {
        setError('Authentification requise');
        return;
      }

      // Load active theme
      const activeThemeData = await getActiveTheme();
      setActiveTheme(activeThemeData);

      // Load all themes
      const themesResponse = await listThemes(token);
      setThemes(themesResponse.themes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du thème');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (mode: 'light' | 'dark' | 'system') => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);
      
      const token = TokenStorage.getToken();
      if (!token) {
        setError('Authentification requise');
        return;
      }

      // Update the active theme mode in the database
      await updateActiveThemeMode(mode, token);
      
      // Update local theme state
      setTheme(mode);
      localStorage.setItem('theme', mode);
      
      setSuccess(`Thème changé en mode ${mode === 'light' ? 'clair' : mode === 'dark' ? 'sombre' : 'système'}`);
      
      // Reload theme data
      await loadThemeData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification du thème');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivateTheme = async (themeId: number) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);
      
      const token = TokenStorage.getToken();
      if (!token) {
        setError('Authentification requise');
        return;
      }

      await activateTheme(themeId, token);
      setSuccess('Thème activé avec succès');
      
      // Reload theme data
      await loadThemeData();
      
      // Reload page to apply new theme
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'activation du thème');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isSuperAdmin) {
    return null; // Don't show theme section if not superadmin
  }

  if (isLoading) {
    return (
      <Card className="mt-6">
        <div className="p-6">
          <Loading />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Thème Actuel" className="mt-6">
      <div className="space-y-4">
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success">
            {success}
          </Alert>
        )}

        {/* Current Theme Info */}
        {activeTheme && (() => {
          const config = activeTheme.config || {};
          const mode = config.mode ? String(config.mode) : null;
          const primary = config.primary ? String(config.primary) : null;
          const secondary = config.secondary ? String(config.secondary) : null;
          
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{activeTheme.display_name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nom: {activeTheme.name}
                  </p>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>
              
              {(mode || primary || secondary) && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2">Configuration actuelle:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {mode && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Mode:</span>{' '}
                        <span className="font-medium">
                          {mode === 'light' ? 'Clair' : mode === 'dark' ? 'Sombre' : 'Système'}
                        </span>
                      </div>
                    )}
                    {primary && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Primaire:</span>{' '}
                        <span className="font-medium">{primary}</span>
                      </div>
                    )}
                    {secondary && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Secondaire:</span>{' '}
                        <span className="font-medium">{secondary}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Theme Mode Selector */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Changer le mode du thème:</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('light')}
              disabled={isUpdating || theme === 'light'}
            >
              Clair
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('dark')}
              disabled={isUpdating || theme === 'dark'}
            >
              Sombre
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('system')}
              disabled={isUpdating || theme === 'system'}
            >
              Système
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Mode actuel: <strong>{resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}</strong>
            {theme === 'system' && ' (basé sur les préférences système)'}
          </p>
        </div>

        {/* Available Themes List */}
        {themes.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Thèmes disponibles:</h4>
            <div className="space-y-2">
              {themes.map((themeItem) => (
                <div
                  key={themeItem.id}
                  className={`p-3 rounded-lg border ${
                    themeItem.is_active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{themeItem.display_name}</h5>
                      {themeItem.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {themeItem.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {themeItem.is_active ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActivateTheme(themeItem.id)}
                          disabled={isUpdating}
                        >
                          Activer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to full theme management */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/admin/themes'}
          >
            Gérer tous les thèmes
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AdminThemeSection() {
  return (
    <ClientOnly>
      <AdminThemeSectionContent />
    </ClientOnly>
  );
}

