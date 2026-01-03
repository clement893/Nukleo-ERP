/**
 * Leo Advanced Settings Component
 * 
 * Component for advanced Leo settings (temperature, tokens, provider, model)
 */

'use client';

import { type LeoSettings } from '@/lib/api/leo-settings';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Slider from '@/components/ui/Slider';
import Switch from '@/components/ui/Switch';

export interface LeoAdvancedSettingsProps {
  settings: LeoSettings;
  defaultSettings: LeoSettings;
  onChange: (updates: Partial<LeoSettings>) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
];

const OPENAI_MODELS = [
  { value: '', label: 'Auto (par défaut)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const ANTHROPIC_MODELS = [
  { value: '', label: 'Auto (par défaut)' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
];

export default function LeoAdvancedSettings({
  settings,
  onChange,
}: LeoAdvancedSettingsProps) {
  const modelOptions =
    settings.provider_preference === 'openai'
      ? OPENAI_MODELS
      : settings.provider_preference === 'anthropic'
      ? ANTHROPIC_MODELS
      : [];

  return (
    <Card className="glass-card border border-nukleo-lavender/20">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Paramètres avancés
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurez les paramètres techniques de Leo
          </p>
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="temperature" className="text-sm font-medium text-gray-900 dark:text-white">
              Température
            </label>
            <span className="text-sm text-muted-foreground">
              {settings.temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={2}
            step={0.1}
            value={settings.temperature}
            onChange={(value: number) => onChange({ temperature: value })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Contrôle la créativité des réponses (0 = déterministe, 2 = très créatif)
          </p>
        </div>

        {/* Max Tokens */}
        <div>
          <label htmlFor="max_tokens" className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
            Max Tokens
          </label>
          <Input
            id="max_tokens"
            type="number"
            min={1}
            max={4000}
            value={settings.max_tokens || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({
                max_tokens: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            placeholder="Auto (par défaut)"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Limite le nombre de tokens dans la réponse (laisser vide pour auto)
          </p>
        </div>

        {/* Provider */}
        <div>
          <label htmlFor="provider" className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
            Fournisseur
          </label>
          <Select
            id="provider"
            value={settings.provider_preference}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onChange({ provider_preference: e.target.value as LeoSettings['provider_preference'] })
            }
            options={PROVIDER_OPTIONS}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Choisissez le fournisseur d'IA préféré
          </p>
        </div>

        {/* Model */}
        {modelOptions.length > 0 && (
          <div>
            <label htmlFor="model" className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
              Modèle
            </label>
            <Select
              id="model"
              value={settings.model_preference || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange({ model_preference: e.target.value || null })
              }
              options={modelOptions}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Modèle spécifique à utiliser (laisser "Auto" pour le modèle par défaut)
            </p>
          </div>
        )}

        {/* ERP Context */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label htmlFor="enable_erp_context" className="text-sm font-medium text-gray-900 dark:text-white block">
                Accès aux données ERP
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Permettre à Leo d'accéder aux données de l'ERP (contacts, entreprises, projets, etc.)
              </p>
            </div>
            <Switch
              id="enable_erp_context"
              checked={settings.enable_erp_context ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ enable_erp_context: e.target.checked })}
            />
          </div>
          
          {settings.enable_erp_context && (
            <div className="mt-4">
              <label htmlFor="max_context_items" className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                Nombre max d'éléments par type
              </label>
              <Input
                id="max_context_items"
                type="number"
                min={1}
                max={50}
                value={settings.max_context_items || 20}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange({ max_context_items: parseInt(e.target.value) || 20 })
                }
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Nombre maximum d'éléments à inclure par type de données dans le contexte (1-50)
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
