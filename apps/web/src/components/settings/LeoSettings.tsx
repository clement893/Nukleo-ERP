/**
 * Leo Settings Component
 * 
 * Main component for managing Leo AI assistant settings
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import { leoSettingsAPI, type LeoSettings, type LeoSettingsUpdate } from '@/lib/api/leo-settings';
import { useToast } from '@/components/ui';
import LeoToneSelector from './LeoToneSelector';
import LeoApproachSelector from './LeoApproachSelector';
import LeoCustomInstructions from './LeoCustomInstructions';
import LeoMarkdownUpload from './LeoMarkdownUpload';
import LeoAdvancedSettings from './LeoAdvancedSettings';
import LeoSystemPromptPreview from './LeoSystemPromptPreview';

export interface LeoSettingsProps {
  className?: string;
}

export default function LeoSettings({ className }: LeoSettingsProps) {
  const [activeTab, setActiveTab] = useState('tone');
  const [localSettings, setLocalSettings] = useState<Partial<LeoSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['leo-settings'],
    queryFn: () => leoSettingsAPI.getSettings(),
  });

  // Update local settings when fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: (updates: LeoSettingsUpdate) => leoSettingsAPI.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leo-settings'] });
      queryClient.invalidateQueries({ queryKey: ['leo-system-prompt'] });
      setHasChanges(false);
      showToast({
        message: 'Paramètres sauvegardés avec succès',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      showToast({
        message: `Erreur lors de la sauvegarde: ${error.message}`,
        type: 'error',
      });
    },
  });

  const handleSave = useCallback(() => {
    if (!hasChanges) return;
    updateMutation.mutate(localSettings);
  }, [localSettings, hasChanges, updateMutation]);

  const handleReset = useCallback(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const handleSettingChange = useCallback((updates: Partial<LeoSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-2 text-muted-foreground">Chargement des paramètres...</span>
        </div>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className={className}>
        <div className="p-8 text-center text-muted-foreground">
          Impossible de charger les paramètres
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="glass-card border border-nukleo-lavender/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Paramètres Leo
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Personnalisez le comportement et le style de votre assistant IA
              </p>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={updateMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabList className="mb-6">
              <Tab value="tone">Ton et Style</Tab>
              <Tab value="instructions">Consignes</Tab>
              <Tab value="markdown">Fichier Markdown</Tab>
              <Tab value="advanced">Avancé</Tab>
              <Tab value="preview">Aperçu</Tab>
            </TabList>

            <TabPanels className="mt-6">
              <TabPanel value="tone">
                <div className="space-y-6">
                  <LeoToneSelector
                    value={localSettings.tone || settings.tone}
                    onChange={(tone) => handleSettingChange({ tone })}
                  />
                  <LeoApproachSelector
                    value={localSettings.approach || settings.approach}
                    onChange={(approach) => handleSettingChange({ approach })}
                  />
                </div>
              </TabPanel>

              <TabPanel value="instructions">
                <LeoCustomInstructions
                  value={localSettings.custom_instructions || settings.custom_instructions}
                  onChange={(custom_instructions) =>
                    handleSettingChange({ custom_instructions })
                  }
                />
              </TabPanel>

              <TabPanel value="markdown">
                <LeoMarkdownUpload
                  fileName={localSettings.markdown_file_name || settings.markdown_file_name}
                  onUploadSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['leo-settings'] });
                    queryClient.invalidateQueries({ queryKey: ['leo-system-prompt'] });
                  }}
                />
              </TabPanel>

              <TabPanel value="advanced">
                <LeoAdvancedSettings
                  settings={localSettings as LeoSettings}
                  defaultSettings={settings}
                  onChange={handleSettingChange}
                />
              </TabPanel>

              <TabPanel value="preview">
                <LeoSystemPromptPreview />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
