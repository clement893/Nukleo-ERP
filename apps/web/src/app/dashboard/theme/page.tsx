'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/lib/store';
import { ThemeToggle, ThemeToggleWithIcon } from '@/components/ui';
import { Palette, Moon, Sun, Monitor, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { getActiveTheme, updateActiveThemeMode } from '@/lib/api/theme';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const dynamic = 'force-dynamic';

function ThemeSettingsContent() {
  const { resolvedTheme } = useTheme();
  const { token, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    setMounted(true);
    
    // Check if user is superadmin (you'll need to implement this check)
    // For now, we'll check if user has is_admin flag
    setIsSuperAdmin(user?.is_admin || false);
    
    // Load current theme mode
    const loadThemeMode = async () => {
      try {
        const response = await getActiveTheme();
        const mode = (response.config?.mode as 'light' | 'dark' | 'system') || 'system';
        setCurrentThemeMode(mode);
      } catch (err) {
        console.error('Failed to load theme mode:', err);
      }
    };
    
    loadThemeMode();
  }, [user]);

  const handleThemeChange = async (newMode: 'light' | 'dark' | 'system') => {
    if (!isSuperAdmin || !token) {
      setError('Seuls les superadmins peuvent modifier le thème global');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateActiveThemeMode(newMode, token);
      setCurrentThemeMode(newMode);
      setSuccess('Thème global mis à jour avec succès ! Le changement sera visible pour tous les utilisateurs.');
      // Reload page after 2 seconds to apply new theme
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du thème');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Mode clair pour tous les utilisateurs',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Mode sombre pour tous les utilisateurs',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Suit les préférences système de chaque utilisateur',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Thème Global de la Plateforme"
        description={
          isSuperAdmin
            ? "Modifiez le thème global qui s'applique à tous les utilisateurs. Seuls les superadmins peuvent modifier ce paramètre."
            : "Le thème global de la plateforme. Seuls les superadmins peuvent le modifier."
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Thème' },
        ]}
      />

      <div className="space-y-8">
        {/* Admin Notice */}
        {!isSuperAdmin && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Accès Restreint
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Seuls les superadmins peuvent modifier le thème global de la plateforme.
                  Le thème actuel s'applique à tous les utilisateurs.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Theme Status */}
        <Section title="Thème Actuel">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Mode du thème global:
                </span>
                <Badge variant="info">{currentThemeMode}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Thème résolu actuel:
                </span>
                <Badge variant={resolvedTheme === 'dark' ? 'default' : 'info'}>
                  {resolvedTheme}
                </Badge>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Note :</strong> Ce thème s'applique à tous les utilisateurs de la plateforme.
                  {!isSuperAdmin && ' Seuls les superadmins peuvent le modifier.'}
                </p>
              </div>
            </div>
          </Card>
        </Section>

        {/* Theme Selection - Only for Superadmins */}
        {isSuperAdmin && (
          <Section title="Modifier le Thème Global">
            <Card>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Modification du Thème Global
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Les modifications du thème global affecteront tous les utilisateurs de la plateforme.
                        Le changement sera appliqué immédiatement.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = currentThemeMode === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value)}
                        disabled={loading}
                        className={clsx(
                          'p-6 rounded-lg border-2 transition-all text-left',
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
                          loading && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={clsx(
                              'p-3 rounded-lg',
                              isSelected
                                ? 'bg-primary-100 dark:bg-primary-900/40'
                                : 'bg-gray-100 dark:bg-gray-700'
                            )}
                          >
                            <Icon
                              className={clsx(
                                'w-6 h-6',
                                isSelected
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={clsx(
                                'font-semibold mb-1',
                                isSelected
                                  ? 'text-primary-900 dark:text-primary-100'
                                  : 'text-gray-900 dark:text-white'
                              )}
                            >
                              {option.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {option.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </Section>
        )}

        {/* Quick Toggle - Read Only for Non-Admins */}
        <Section title="Aperçu du Thème">
          <Card>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Composants de bascule rapide (lecture seule pour les utilisateurs non-admin):
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Toggle Simple
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ThemeToggleWithIcon />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Toggle avec Icône
                  </span>
                </div>
              </div>
              {!isSuperAdmin && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Ces composants sont en lecture seule. Seuls les superadmins peuvent modifier le thème global.
                </p>
              )}
            </div>
          </Card>
        </Section>

        {/* Messages */}
        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">Erreur</h4>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">Succès</h4>
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Information */}
        <Section title="Informations">
          <Card>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  À propos du Thème Global:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Le thème global s'applique à tous les utilisateurs de la plateforme
                  </li>
                  <li>
                    Seuls les superadmins peuvent modifier le thème global
                  </li>
                  <li>
                    Les modifications sont appliquées immédiatement pour tous les utilisateurs
                  </li>
                  <li>
                    Le mode "System" permet à chaque utilisateur de suivre ses préférences système
                  </li>
                  <li>
                    Le thème est chargé automatiquement depuis la base de données au démarrage
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}

export default function ThemeSettingsPage() {
  return (
    <ProtectedRoute>
      <ThemeSettingsContent />
    </ProtectedRoute>
  );
}
