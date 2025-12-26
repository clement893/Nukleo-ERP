'use client';

import { useEffect, useState } from 'react';
import { getActiveTheme } from '@/lib/api/theme';
import type { ThemeConfigResponse } from '@modele/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { RefreshCw, Palette, Type, Layout, Sparkles } from 'lucide-react';

export function ThemeVisualisationContent() {
  const [theme, setTheme] = useState<ThemeConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeTheme = await getActiveTheme();
      setTheme(activeTheme);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw 
            className="w-8 h-8 animate-spin mx-auto mb-4" 
            style={{ color: 'var(--color-primary-500, #3b82f6)' }}
          />
          <p className="text-gray-600 dark:text-gray-400">Chargement du thème...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Erreur" className="mb-6">
        {error}
        <Button onClick={fetchTheme} className="mt-4" variant="primary">
          Réessayer
        </Button>
      </Alert>
    );
  }

  if (!theme) {
    return (
      <Alert variant="warning" title="Aucun thème trouvé">
        Aucun thème actif n'a été trouvé.
      </Alert>
    );
  }

  const config = theme.config;
  const typography = (config as any).typography || {};
  const effects = (config as any).effects || {};

  // Extract color values
  const colors = {
    primary: config.primary_color || '#3b82f6',
    secondary: config.secondary_color || '#8b5cf6',
    danger: config.danger_color || '#ef4444',
    warning: config.warning_color || '#f59e0b',
    info: config.info_color || '#06b6d4',
    success: config.success_color || '#10b981',
  };

  // Extract font family
  const fontFamily = config.font_family || typography.fontFamily || 'Inter, sans-serif';
  const fontFamilyHeading = typography.fontFamilyHeading || fontFamily;
  const fontFamilySubheading = typography.fontFamilySubheading || fontFamily;

  // Extract border radius
  const borderRadius = config.border_radius || '8px';

  // Get computed CSS variables
  const getComputedColor = (varName: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(varName);
    return value.trim() || fallback;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Visualisation du Thème Actif
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thème: <span className="font-semibold">{theme.display_name}</span> (ID: {theme.id})
          </p>
        </div>
        <Button onClick={fetchTheme} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Theme Info Card */}
      <Card title="Informations du Thème">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nom</p>
            <p className="font-semibold">{theme.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nom d'affichage</p>
            <p className="font-semibold">{theme.display_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ID</p>
            <p className="font-semibold">{theme.id}</p>
          </div>
        </div>
      </Card>

      {/* Colors Section */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span>Couleurs</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(colors).map(([name, color]) => (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                  {name}
                </span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {color}
                </code>
              </div>
              <div
                className="h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                style={{ backgroundColor: color }}
              />
              {/* Show color shades if available */}
              <div className="flex gap-1">
                {[100, 300, 500, 700, 900].map((shade) => {
                  const shadeColor = getComputedColor(
                    `--color-${name}-${shade}`,
                    color
                  );
                  return (
                    <div
                      key={shade}
                      className="flex-1 h-8 rounded border border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: shadeColor }}
                      title={`${name}-${shade}: ${shadeColor}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Typography Section */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            <span>Typographie</span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Font Families */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Police principale</p>
              <div
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ fontFamily }}
              >
                <p className="text-lg font-medium">Exemple de texte</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {fontFamily}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Police des titres</p>
              <div
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ fontFamily: fontFamilyHeading }}
              >
                <h3 className="text-xl font-bold">Titre d'exemple</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {fontFamilyHeading}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Police des sous-titres</p>
              <div
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ fontFamily: fontFamilySubheading }}
              >
                <h4 className="text-lg font-semibold">Sous-titre</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {fontFamilySubheading}
                </p>
              </div>
            </div>
          </div>

          {/* Font URL */}
          {typography.fontUrl && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">URL de la police</p>
              <code className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm break-all">
                {typography.fontUrl}
              </code>
            </div>
          )}
        </div>
      </Card>

      {/* Border Radius Section */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            <span>Border Radius</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 flex items-center justify-center text-white font-semibold"
              style={{ 
                borderRadius,
                backgroundColor: 'var(--color-primary-500, #3b82f6)'
              }}
            >
              Exemple
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valeur</p>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {borderRadius}
              </code>
            </div>
          </div>
        </div>
      </Card>

      {/* Effects Section */}
      {(effects.glassmorphism || effects.shadows || effects.gradients) && (
        <Card
          header={
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Effets</span>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Glassmorphism */}
            {effects.glassmorphism?.enabled && (
              <div>
                <p className="text-sm font-medium mb-3">Glassmorphism</p>
                <div
                  className="p-6 rounded-lg border border-white/20 backdrop-blur-md"
                  style={{
                    backgroundColor: `rgba(255, 255, 255, ${effects.glassmorphism.opacity || 0.1})`,
                    backdropFilter: `blur(${effects.glassmorphism.blur || '10px'}) saturate(${effects.glassmorphism.saturation || '180%'})`,
                  }}
                >
                  <p className="text-gray-800 dark:text-gray-200">
                    Exemple d'effet glassmorphism
                  </p>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Blur: {effects.glassmorphism.blur || '10px'} | 
                    Opacité: {effects.glassmorphism.opacity || 0.1} | 
                    Saturation: {effects.glassmorphism.saturation || '180%'}
                  </div>
                </div>
              </div>
            )}

            {/* Shadows */}
            {effects.shadows && (
              <div>
                <p className="text-sm font-medium mb-3">Ombres</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(effects.shadows).map(([name, shadow]) => (
                    <div key={name} className="text-center">
                      <div
                        className="w-full h-20 bg-white dark:bg-gray-800 rounded-lg mb-2"
                        style={{ boxShadow: shadow as string }}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gradients */}
            {effects.gradients?.enabled && (
              <div>
                <p className="text-sm font-medium mb-3">Dégradés</p>
                <div
                  className="w-full h-32 rounded-lg"
                  style={{
                    background: `linear-gradient(${effects.gradients.direction || 'to-br'}, ${colors.primary}, ${colors.secondary})`,
                    opacity: effects.gradients.intensity || 0.3,
                  }}
                />
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Direction: {effects.gradients.direction || 'to-br'} | 
                  Intensité: {effects.gradients.intensity || 0.3}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Component Preview */}
      <Card title="Aperçu des Composants">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Boutons</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Alertes</p>
            <div className="space-y-2">
              <Alert variant="success" title="Succès">
                Message de succès avec le thème actif
              </Alert>
              <Alert variant="error" title="Erreur">
                Message d'erreur avec le thème actif
              </Alert>
              <Alert variant="warning" title="Avertissement">
                Message d'avertissement avec le thème actif
              </Alert>
              <Alert variant="info" title="Information">
                Message d'information avec le thème actif
              </Alert>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Carte</p>
            <Card title="Exemple de carte" subtitle="Sous-titre de la carte">
              <p className="text-gray-700 dark:text-gray-300">
                Ceci est un exemple de carte utilisant le thème actif. 
                Les couleurs, polices et styles sont appliqués automatiquement.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      {/* Raw Config */}
      <Card title="Configuration Complète (JSON)">
        <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto text-xs">
          {JSON.stringify(config, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

