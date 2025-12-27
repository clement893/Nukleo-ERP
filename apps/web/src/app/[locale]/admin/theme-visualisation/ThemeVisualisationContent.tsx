'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActiveTheme, getTheme, updateTheme } from '@/lib/api/theme';
import { uploadFont, listFonts, deleteFont } from '@/lib/api/theme-font';
import type { ThemeFont } from '@modele/types';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme/default-theme-config';
import type { ThemeConfigResponse, ThemeConfig, ThemeUpdate } from '@modele/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import ColorPicker from '@/components/ui/ColorPicker';
import TextareaComponent from '@/components/ui/Textarea';
import { RefreshCw, Palette, Type, Layout, Sparkles, Save, Edit2, Download, Code, Upload, Trash2 } from 'lucide-react';
import Select from '@/components/ui/Select';

export function ThemeVisualisationContent() {
  const searchParams = useSearchParams();
  const themeIdParam = searchParams.get('themeId');
  const { refreshTheme } = useGlobalTheme();
  const [theme, setTheme] = useState<ThemeConfigResponse | null>(null);
  const [editedConfig, setEditedConfig] = useState<ThemeConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [uploadedFonts, setUploadedFonts] = useState<ThemeFont[]>([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [selectedFontFile, setSelectedFontFile] = useState<File | null>(null);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      let themeData: ThemeConfigResponse;
      
      // If themeId is provided, fetch that specific theme
      if (themeIdParam) {
        const themeId = parseInt(themeIdParam, 10);
        if (isNaN(themeId)) {
          throw new Error('Invalid theme ID');
        }
        const themeResponse = await getTheme(themeId);
        // Convert Theme to ThemeConfigResponse format
        themeData = {
          id: themeResponse.id,
          name: themeResponse.name,
          display_name: themeResponse.display_name,
          config: themeResponse.config,
          is_active: themeResponse.is_active,
        };
      } else {
        // Otherwise, fetch the active theme
        themeData = await getActiveTheme();
      }
      
      setTheme(themeData);
      setEditedConfig(themeData.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!theme || !editedConfig) {
      setError('Aucun thème ou configuration à sauvegarder.');
      return;
    }

    // Validate JSON if jsonInput is set and different from editedConfig
    if (jsonInput.trim()) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setError('Le JSON doit être un objet valide. Veuillez corriger le JSON avant de sauvegarder.');
          return;
        }
        // Use parsed JSON if valid
        setEditedConfig(parsed as ThemeConfig);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(`JSON invalide : ${errorMessage}. Veuillez corriger le JSON avant de sauvegarder.`);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Use the latest editedConfig (which may have been updated from JSON)
      const configToSave = jsonInput.trim() 
        ? (JSON.parse(jsonInput) as ThemeConfig)
        : editedConfig;

      const updateData: ThemeUpdate = {
        config: configToSave as Partial<ThemeConfig>,
      };

      await updateTheme(theme.id, updateData);
      
      setSuccessMessage(`Thème "${theme.display_name}" mis à jour avec succès !`);
      setIsEditing(false);
      
      // Refresh theme data
      await fetchTheme();
      
      // Refresh global theme immediately to apply changes site-wide if this is the active theme
      await refreshTheme();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (theme) {
      setEditedConfig(theme.config);
    }
    setIsEditing(false);
    setError(null);
  };

  const handleResetToDefault = async () => {
    if (!theme) {
      setError('Aucun thème à réinitialiser.');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir restaurer le thème par défaut ? Toutes les modifications seront perdues.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Reset to default theme configuration
      const defaultConfig = DEFAULT_THEME_CONFIG;
      const updateData: ThemeUpdate = {
        config: defaultConfig as Partial<ThemeConfig>,
      };

          await updateTheme(theme.id, updateData);
      
      setSuccessMessage('Thème restauré aux valeurs par défaut avec succès !');
      setIsEditing(false);
      
      // Refresh theme data
      await fetchTheme();
      
      // Refresh global theme immediately to apply changes site-wide
      await refreshTheme();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset theme');
    } finally {
      setSaving(false);
    }
  };

  const updateConfigField = (path: string[], value: any) => {
    if (!editedConfig) return;

    const newConfig = { ...editedConfig };
    let current: any = newConfig;

    // Navigate to the nested path
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!key) continue; // Skip if key is undefined
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the final value
    const lastKey = path[path.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
    setEditedConfig(newConfig);
  };

  useEffect(() => {
    fetchTheme();
  }, [themeIdParam]); // Re-fetch when themeId changes

  // Update JSON input when editedConfig changes (always keep in sync when editing)
  useEffect(() => {
    if (editedConfig && isEditing) {
      setJsonInput(JSON.stringify(editedConfig, null, 2));
    }
  }, [editedConfig, isEditing]);

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

  // Allow editing all themes
  const canEdit = true;
  const config = isEditing && editedConfig ? editedConfig : theme.config;
  const typography = (config as any).typography || {};
  const effects = (config as any).effects || {};

  // Extract color values - support both flat and nested color structures
  const colorsConfig = (config as any).colors || {};
  const colors = {
    primary: config.primary_color || colorsConfig.primary || '#3b82f6',
    secondary: config.secondary_color || colorsConfig.secondary || '#8b5cf6',
    danger: config.danger_color || colorsConfig.destructive || colorsConfig.danger || '#ef4444',
    warning: config.warning_color || colorsConfig.warning || '#f59e0b',
    info: config.info_color || colorsConfig.info || '#06b6d4',
    success: config.success_color || colorsConfig.success || '#10b981',
  };

  // Extract font family - support both flat and nested typography structures
  const fontFamily = config.font_family || typography.fontFamily || typography['font-family']?.sans || 'Inter, sans-serif';
  const fontFamilyHeading = typography.fontFamilyHeading || typography['font-family']?.heading || fontFamily;
  const fontFamilySubheading = typography.fontFamilySubheading || typography['font-family']?.subheading || fontFamily;

  // Extract border radius - support both flat and nested structures
  const borderRadiusConfig = (config as any).borderRadius || (config as any)['border-radius'] || {};
  const borderRadius = config.border_radius || borderRadiusConfig.base || borderRadiusConfig.lg || '8px';
  
  // Extract spacing if available
  const spacing = (config as any).spacing || {};
  
  // Extract shadows if available
  const shadows = (config as any).shadow || effects.shadows || {};

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
            {canEdit && (
              <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">
                Thème éditable
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && !isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="primary" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier le thème
              </Button>
              <Button onClick={handleResetToDefault} variant="outline" size="sm" disabled={saving}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retour au thème par défaut
              </Button>
            </>
          )}
          <Button onClick={fetchTheme} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" title="Succès">
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      )}

      {/* Theme Editor */}
      {canEdit && isEditing && editedConfig && (
        <Card title={`Éditer le thème: ${theme.display_name}`}>
          <div className="space-y-6">
            <Alert variant="info" title="Information">
              Modifiez les propriétés du thème "{theme.display_name}" (ID: {theme.id}). Les changements seront appliqués immédiatement.
              {theme.is_active && (
                <span className="block mt-2 font-semibold text-primary-600 dark:text-primary-400">
                  ⚠️ Ce thème est actuellement actif. Les modifications seront visibles sur tout le site.
                </span>
              )}
            </Alert>

            {/* Colors Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Couleurs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['primary', 'secondary', 'danger', 'warning', 'info', 'success'] as const).map((colorName) => {
                  const colorKey = `${colorName}_color` as keyof ThemeConfig;
                  const colorKeyString = String(colorKey); // Convert to string for path array
                  const colorValue = config[colorKey] as string || '#3b82f6';
                  return (
                    <div key={colorName} className="space-y-2">
                      <label className="block text-sm font-medium capitalize">
                        {colorName}
                      </label>
                      <div className="flex gap-2">
                        <ColorPicker
                          value={colorValue}
                          onChange={(color) => updateConfigField([colorKeyString], color)}
                          showInput={true}
                          fullWidth
                        />
                        <Input
                          value={colorValue}
                          onChange={(e) => updateConfigField([colorKeyString], e.target.value)}
                          className="w-32"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Typography Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typographie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Police principale</label>
                  <Select
                    options={[
                      { label: 'Inter', value: 'Inter, sans-serif' },
                      { label: 'Roboto', value: 'Roboto, sans-serif' },
                      { label: 'Poppins', value: 'Poppins, sans-serif' },
                      { label: 'Open Sans', value: '"Open Sans", sans-serif' },
                      { label: 'Lato', value: 'Lato, sans-serif' },
                      { label: 'Montserrat', value: 'Montserrat, sans-serif' },
                      { label: 'Raleway', value: 'Raleway, sans-serif' },
                      { label: 'Nunito', value: 'Nunito, sans-serif' },
                      { label: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
                      { label: 'Ubuntu', value: 'Ubuntu, sans-serif' },
                      { label: 'Oswald', value: 'Oswald, sans-serif' },
                      { label: 'Noto Sans', value: '"Noto Sans", sans-serif' },
                      { label: 'Playfair Display', value: '"Playfair Display", serif' },
                      { label: 'Merriweather', value: 'Merriweather, serif' },
                      { label: 'Lora', value: 'Lora, serif' },
                      { label: 'Roboto Mono', value: '"Roboto Mono", monospace' },
                      { label: 'Source Code Pro', value: '"Source Code Pro", monospace' },
                      { label: 'Fira Code', value: '"Fira Code", monospace' },
                      { label: 'Personnalisée', value: 'custom' },
                    ]}
                    value={config.font_family || typography.fontFamily || 'Inter, sans-serif'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'custom') {
                        // Keep current value, user can type custom font
                        return;
                      }
                      // Try to update typography.fontFamily first, fallback to font_family
                      if (typography.fontFamily !== undefined || (config as any).typography) {
                        updateConfigField(['typography', 'fontFamily'], value);
                        // Also update font_family for compatibility
                        if (!config.font_family) {
                          updateConfigField(['font_family'], value);
                        }
                      } else {
                        updateConfigField(['font_family'], value);
                      }
                      // Auto-generate Google Fonts URL if it's a Google Font
                      if (value && value.trim()) {
                        const fontParts = value.split(',');
                        const fontName = fontParts[0]?.replace(/['"]/g, '').trim();
                        if (fontName && !typography.fontUrl) {
                          const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
                          if (!(config as any).typography) {
                            updateConfigField(['typography'], {});
                          }
                          updateConfigField(['typography', 'fontUrl'], fontUrl);
                        }
                      }
                    }}
                  />
                </div>
                <Input
                  label="Police personnalisée (si sélectionnée)"
                  value={config.font_family || typography.fontFamily || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Try to update typography.fontFamily first, fallback to font_family
                    if (typography.fontFamily !== undefined || (config as any).typography) {
                      updateConfigField(['typography', 'fontFamily'], value);
                      // Also update font_family for compatibility
                      if (!config.font_family) {
                        updateConfigField(['font_family'], value);
                      }
                    } else {
                      updateConfigField(['font_family'], value);
                    }
                  }}
                  placeholder="Inter, sans-serif"
                />
                <Input
                  label="URL de la police (Google Fonts)"
                  value={typography.fontUrl || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!(config as any).typography) {
                      updateConfigField(['typography'], {});
                    }
                    updateConfigField(['typography', 'fontUrl'], value);
                  }}
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                />
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Border Radius
              </h3>
              <Input
                label="Border Radius"
                value={config.border_radius || '8px'}
                onChange={(e) => updateConfigField(['border_radius'], e.target.value)}
                placeholder="8px"
              />
            </div>

            {/* JSON Editor Section - Always visible when editing */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Éditeur JSON
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (editedConfig) {
                        const jsonStr = JSON.stringify(editedConfig, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `theme-${theme?.id || 'config'}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setSuccessMessage('Configuration exportée avec succès !');
                        setTimeout(() => setSuccessMessage(null), 3000);
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter JSON
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (editedConfig) {
                        setJsonInput(JSON.stringify(editedConfig, null, 2));
                        setSuccessMessage('JSON réinitialisé depuis la configuration actuelle.');
                        setTimeout(() => setSuccessMessage(null), 3000);
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réinitialiser depuis config
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">
                    Modifier la configuration JSON directement
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (Les modifications sont appliquées en temps réel)
                    </span>
                  </label>
                  <TextareaComponent
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      // Try to parse and update editedConfig in real-time
                      try {
                        if (e.target.value.trim()) {
                          const parsed = JSON.parse(e.target.value);
                          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                            setEditedConfig(parsed as ThemeConfig);
                            setError(null);
                          }
                        }
                      } catch (err) {
                        // Don't show error for incomplete JSON while typing
                        // Error will be shown when saving if JSON is invalid
                      }
                    }}
                    className="font-mono text-sm"
                    rows={20}
                    placeholder={`{
  "primary_color": "#3b82f6",
  "secondary_color": "#8b5cf6",
  "danger_color": "#ef4444",
  "warning_color": "#f59e0b",
  "info_color": "#06b6d4",
  "success_color": "#10b981",
  "font_family": "Inter, sans-serif",
  "border_radius": "8px",
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "fontUrl": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  },
  "effects": {
    "glassmorphism": {
      "enabled": true,
      "blur": "10px",
      "opacity": 0.1,
      "borderOpacity": 0.2,
      "saturation": "180%"
    },
    "shadows": {
      "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
    },
    "gradients": {
      "enabled": true,
      "direction": "to bottom right",
      "intensity": 0.3
    }
  }
}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        try {
                          if (!jsonInput.trim()) {
                            setError('Le JSON ne peut pas être vide.');
                            return;
                          }
                          
                          const parsed = JSON.parse(jsonInput);
                          
                          // Validate that it's an object
                          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                            setError('Le JSON doit être un objet valide.');
                            return;
                          }
                          
                          // Update editedConfig with parsed JSON
                          setEditedConfig(parsed as ThemeConfig);
                          setSuccessMessage('Configuration JSON appliquée avec succès !');
                          setTimeout(() => setSuccessMessage(null), 3000);
                          setError(null);
                        } catch (err) {
                          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
                          if (errorMessage.includes('JSON')) {
                            setError(`JSON invalide : ${errorMessage}. Veuillez vérifier la syntaxe (virgules, guillemets, accolades).`);
                          } else {
                            setError(`Erreur lors de l'application : ${errorMessage}`);
                          }
                        }
                      }}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Appliquer JSON
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Astuce : Modifiez le JSON directement pour changer toutes les propriétés du thème. Les modifications sont appliquées en temps réel. Cliquez sur "Appliquer JSON" pour valider et appliquer les changements.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={saving}
                loading={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="secondary"
                disabled={saving}
              >
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}


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

          {/* Font Sizes */}
          {typography.fontSize && (
            <div>
              <p className="text-sm font-medium mb-3">Tailles de police</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(typography.fontSize).map(([size, value]) => (
                  <div key={size} className="text-center">
                    <div
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      style={{ fontSize: value as string }}
                    >
                      <p className="font-medium">Aa</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                      {size}: {value as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Font Weights */}
          {typography.fontWeight && (
            <div>
              <p className="text-sm font-medium mb-3">Poids de police</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(typography.fontWeight).map(([weight, value]) => (
                  <div key={weight} className="text-center">
                    <div
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      style={{ fontWeight: value as string }}
                    >
                      <p>Exemple</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                      {weight}: {value as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Font URL */}
          {(typography.fontUrl || (config as any).font_url) && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">URL de la police</p>
              <code className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm break-all">
                {typography.fontUrl || (config as any).font_url}
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
          
          {/* Show all border radius values if available */}
          {Object.keys(borderRadiusConfig).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Toutes les valeurs</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(borderRadiusConfig).map(([size, value]) => (
                  <div key={size} className="text-center">
                    <div
                      className="w-16 h-16 mx-auto flex items-center justify-center text-white font-semibold text-xs"
                      style={{ 
                        borderRadius: value as string,
                        backgroundColor: 'var(--color-primary-500, #3b82f6)'
                      }}
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                      {size}: {value as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Spacing Section */}
      {Object.keys(spacing).length > 0 && (
        <Card
          header={
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              <span>Espacement</span>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(spacing).map(([size, value]) => (
              <div key={size} className="text-center">
                <div className="flex items-center justify-center h-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div
                    className="bg-primary-500 rounded"
                    style={{ 
                      width: value as string,
                      height: value as string,
                      backgroundColor: 'var(--color-primary-500, #3b82f6)'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                  {size}: {value as string}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

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
            {(effects.shadows || Object.keys(shadows).length > 0) && (
              <div>
                <p className="text-sm font-medium mb-3">Ombres</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(effects.shadows || shadows).map(([name, shadow]) => (
                    <div key={name} className="text-center">
                      <div
                        className="w-full h-20 bg-white dark:bg-gray-800 rounded-lg mb-2"
                        style={{ boxShadow: shadow as string }}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {name}
                      </p>
                      <code className="text-xs text-gray-500 dark:text-gray-400 mt-1 block break-all">
                        {String(shadow).substring(0, 30)}...
                      </code>
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

