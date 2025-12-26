/**
 * Advanced Theme Editor Component
 * Provides visual controls for creating and editing themes with fine-grained control
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import ColorPicker from '@/components/ui/ColorPicker';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import type { Theme, ThemeCreate, ThemeUpdate } from '@modele/types';
import { Palette, Type, Layout, Eye, Save, X } from 'lucide-react';

// Font options with preview
const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif' },
  { label: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Monaco', value: 'Monaco, monospace' },
];

const MODE_OPTIONS = [
  { label: 'Système (auto)', value: 'system' },
  { label: 'Clair', value: 'light' },
  { label: 'Sombre', value: 'dark' },
];

interface ThemeEditorProps {
  theme?: Theme;
  onSubmit: (data: ThemeCreate | ThemeUpdate) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ThemeConfig {
  mode: string;
  primary: string;
  secondary: string;
  danger: string;
  warning: string;
  info: string;
  success: string;
  colors?: {
    background?: string;
    foreground?: string;
    muted?: string;
    mutedForeground?: string;
    border?: string;
    accent?: string;
  };
  typography?: {
    fontFamily?: string;
    fontFamilyHeading?: string;
    fontFamilySubheading?: string;
    textHeading?: string;
    textSubheading?: string;
    textBody?: string;
    textSecondary?: string;
    textLink?: string;
  };
  spacing?: {
    unit?: string;
  };
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export function ThemeEditor({ theme, onSubmit, onCancel, isLoading = false }: ThemeEditorProps) {
  const [name, setName] = useState(theme?.name || '');
  const [displayName, setDisplayName] = useState(theme?.display_name || '');
  const [description, setDescription] = useState(theme?.description || '');
  const [activeTab, setActiveTab] = useState('colors');
  
  // Parse existing config or use defaults
  const initialConfig: ThemeConfig = theme?.config || {
    mode: 'system',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
    success: '#10b981',
  };

  const [config, setConfig] = useState<ThemeConfig>(initialConfig);

  // Update config helper
  const updateConfig = (path: string, value: string) => {
    setConfig((prev) => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const getConfigValue = (path: string, defaultValue: string = ''): string => {
    const keys = path.split('.');
    let current: any = config;
    
    for (const key of keys) {
      if (current?.[key] === undefined) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current || defaultValue;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme && !name.trim()) {
      return;
    }
    if (!displayName.trim()) {
      return;
    }

    const themeData = theme
      ? ({
          display_name: displayName,
          description: description || null,
          config,
        } as ThemeUpdate)
      : ({
          name: name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
          display_name: displayName,
          description: description || null,
          config,
        } as ThemeCreate);

    await onSubmit(themeData);
  };

  // Preview styles
  const previewStyles = useMemo(() => {
    return {
      '--preview-primary': config.primary,
      '--preview-secondary': config.secondary,
      '--preview-danger': config.danger,
      '--preview-warning': config.warning,
      '--preview-info': config.info,
      '--preview-success': config.success,
      '--preview-font-family': config.typography?.fontFamily || 'Inter, sans-serif',
      '--preview-font-heading': config.typography?.fontFamilyHeading || config.typography?.fontFamily || 'Inter, sans-serif',
    } as React.CSSProperties;
  }, [config]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold">
              {theme ? 'Modifier le thème' : 'Créer un nouveau thème'}
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || (!theme && !name.trim()) || !displayName.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Enregistrement...' : theme ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!theme && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom technique <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="mon-theme"
                  required
                  helperText="Identifiant unique (lettres, chiffres, tirets et underscores uniquement)"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom d'affichage <span className="text-red-500">*</span>
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Mon Thème"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="Description du thème..."
              />
            </div>
          </div>

          {/* Tabs for organized sections */}
          <Tabs defaultTab={activeTab} onChange={setActiveTab}>
            <TabList className="border-b border-gray-200 dark:border-gray-700">
              <Tab value="colors">
                <Palette className="w-4 h-4 mr-2" />
                Couleurs
              </Tab>
              <Tab value="typography">
                <Type className="w-4 h-4 mr-2" />
                Typographie
              </Tab>
              <Tab value="advanced">
                <Layout className="w-4 h-4 mr-2" />
                Avancé
              </Tab>
              <Tab value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="colors">
                <div className="space-y-6 mt-4">
                  {/* Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Mode du thème</label>
                    <Select
                      options={MODE_OPTIONS}
                      value={config.mode}
                      onChange={(e) => updateConfig('mode', e.target.value)}
                    />
                  </div>

                  {/* Primary Colors */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Couleurs principales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <ColorPicker
                        label="Couleur principale"
                        value={config.primary}
                        onChange={(color) => updateConfig('primary', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Couleur secondaire"
                        value={config.secondary}
                        onChange={(color) => updateConfig('secondary', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Danger / Erreur"
                        value={config.danger}
                        onChange={(color) => updateConfig('danger', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Avertissement"
                        value={config.warning}
                        onChange={(color) => updateConfig('warning', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Information"
                        value={config.info}
                        onChange={(color) => updateConfig('info', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Succès"
                        value={config.success || '#10b981'}
                        onChange={(color) => updateConfig('success', color)}
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* Background & Text Colors */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Couleurs de fond et texte</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <ColorPicker
                        label="Fond principal"
                        value={getConfigValue('colors.background', '#ffffff')}
                        onChange={(color) => updateConfig('colors.background', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Texte principal"
                        value={getConfigValue('colors.foreground', '#000000')}
                        onChange={(color) => updateConfig('colors.foreground', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Fond atténué"
                        value={getConfigValue('colors.muted', '#f3f4f6')}
                        onChange={(color) => updateConfig('colors.muted', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Texte atténué"
                        value={getConfigValue('colors.mutedForeground', '#6b7280')}
                        onChange={(color) => updateConfig('colors.mutedForeground', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Bordure"
                        value={getConfigValue('colors.border', '#e5e7eb')}
                        onChange={(color) => updateConfig('colors.border', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Accent"
                        value={getConfigValue('colors.accent', config.primary)}
                        onChange={(color) => updateConfig('colors.accent', color)}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel value="typography">
                <div className="space-y-6 mt-4">
                  {/* Font Families */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Polices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Police principale</label>
                        <Select
                          options={FONT_OPTIONS}
                          value={getConfigValue('typography.fontFamily', 'Inter, sans-serif')}
                          onChange={(e) => updateConfig('typography.fontFamily', e.target.value)}
                        />
                        <div
                          className="mt-2 p-3 border rounded-lg text-sm"
                          style={{
                            fontFamily: getConfigValue('typography.fontFamily', 'Inter, sans-serif'),
                          }}
                        >
                          Aperçu de la police principale
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Police des titres</label>
                        <Select
                          options={FONT_OPTIONS}
                          value={getConfigValue('typography.fontFamilyHeading', getConfigValue('typography.fontFamily', 'Inter, sans-serif'))}
                          onChange={(e) => updateConfig('typography.fontFamilyHeading', e.target.value)}
                        />
                        <div
                          className="mt-2 p-3 border rounded-lg text-sm font-semibold"
                          style={{
                            fontFamily: getConfigValue('typography.fontFamilyHeading', getConfigValue('typography.fontFamily', 'Inter, sans-serif')),
                          }}
                        >
                          Aperçu des titres
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Police des sous-titres</label>
                        <Select
                          options={FONT_OPTIONS}
                          value={getConfigValue('typography.fontFamilySubheading', getConfigValue('typography.fontFamily', 'Inter, sans-serif'))}
                          onChange={(e) => updateConfig('typography.fontFamilySubheading', e.target.value)}
                        />
                        <div
                          className="mt-2 p-3 border rounded-lg text-sm"
                          style={{
                            fontFamily: getConfigValue('typography.fontFamilySubheading', getConfigValue('typography.fontFamily', 'Inter, sans-serif')),
                          }}
                        >
                          Aperçu des sous-titres
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Colors */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Couleurs de texte</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <ColorPicker
                        label="Couleur des titres"
                        value={getConfigValue('typography.textHeading', '#111827')}
                        onChange={(color) => updateConfig('typography.textHeading', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Couleur des sous-titres"
                        value={getConfigValue('typography.textSubheading', '#374151')}
                        onChange={(color) => updateConfig('typography.textSubheading', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Couleur du texte principal"
                        value={getConfigValue('typography.textBody', '#1f2937')}
                        onChange={(color) => updateConfig('typography.textBody', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Couleur du texte secondaire"
                        value={getConfigValue('typography.textSecondary', '#6b7280')}
                        onChange={(color) => updateConfig('typography.textSecondary', color)}
                        fullWidth
                      />
                      <ColorPicker
                        label="Couleur des liens"
                        value={getConfigValue('typography.textLink', config.primary)}
                        onChange={(color) => updateConfig('typography.textLink', color)}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel value="advanced">
                <div className="space-y-6 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Espacement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Unité de base</label>
                        <Input
                          value={getConfigValue('spacing.unit', '8px')}
                          onChange={(e) => updateConfig('spacing.unit', e.target.value)}
                          placeholder="8px"
                          helperText="Unité de base pour les espacements (ex: 8px, 0.5rem)"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Rayons de bordure</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Petit</label>
                        <Input
                          value={getConfigValue('borderRadius.sm', '0.25rem')}
                          onChange={(e) => updateConfig('borderRadius.sm', e.target.value)}
                          placeholder="0.25rem"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Moyen</label>
                        <Input
                          value={getConfigValue('borderRadius.md', '0.375rem')}
                          onChange={(e) => updateConfig('borderRadius.md', e.target.value)}
                          placeholder="0.375rem"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Grand</label>
                        <Input
                          value={getConfigValue('borderRadius.lg', '0.5rem')}
                          onChange={(e) => updateConfig('borderRadius.lg', e.target.value)}
                          placeholder="0.5rem"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Très grand</label>
                        <Input
                          value={getConfigValue('borderRadius.xl', '0.75rem')}
                          onChange={(e) => updateConfig('borderRadius.xl', e.target.value)}
                          placeholder="0.75rem"
                        />
                      </div>
                    </div>
                  </div>

                  {/* JSON Editor (Advanced) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Configuration JSON (Avancé)</h3>
                    <textarea
                      value={JSON.stringify(config, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setConfig(parsed);
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                      rows={12}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Éditeur JSON avancé pour modifier directement la configuration complète
                    </p>
                  </div>
                </div>
              </TabPanel>

              <TabPanel value="preview">
                <div className="space-y-6 mt-4">
                  <div className="p-6 border-2 border-dashed rounded-lg" style={previewStyles}>
                    <div className="space-y-4">
                      <h3
                        className="text-2xl font-bold"
                        style={{
                          fontFamily: 'var(--preview-font-heading)',
                          color: getConfigValue('typography.textHeading', '#111827'),
                        }}
                      >
                        Titre principal du thème
                      </h3>
                      <h4
                        className="text-lg font-semibold"
                        style={{
                          fontFamily: 'var(--preview-font-heading)',
                          color: getConfigValue('typography.textSubheading', '#374151'),
                        }}
                      >
                        Sous-titre du thème
                      </h4>
                      <p
                        className="text-base"
                        style={{
                          fontFamily: 'var(--preview-font-family)',
                          color: getConfigValue('typography.textBody', '#1f2937'),
                        }}
                      >
                        Ceci est un exemple de texte principal. Il utilise la police principale du thème
                        et la couleur de texte définie. Vous pouvez voir comment le thème apparaîtra
                        dans votre application.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: config.primary }}
                        >
                          Bouton Principal
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: config.secondary }}
                        >
                          Bouton Secondaire
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: config.danger }}
                        >
                          Danger
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: config.warning }}
                        >
                          Avertissement
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: config.info }}
                        >
                          Information
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: config.success || '#10b981' }}
                        >
                          Succès
                        </button>
                      </div>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: getConfigValue('colors.muted', '#f3f4f6') }}>
                        <p style={{ color: getConfigValue('colors.mutedForeground', '#6b7280') }}>
                          Zone avec fond atténué
                        </p>
                      </div>
                      <a
                        href="#"
                        className="underline"
                        style={{ color: getConfigValue('typography.textLink', config.primary) }}
                      >
                        Exemple de lien
                      </a>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </form>
      </Card>
    </div>
  );
}

