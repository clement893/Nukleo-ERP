'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { logger } from '@/lib/logger';
import { Settings, Save, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { preferencesAPI, type UserPreferences } from '@/lib/api/preferences';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import type { Locale } from '@/i18n/routing';

interface PreferencesManagerProps {
  className?: string;
}

export function PreferencesManager({ className = '' }: PreferencesManagerProps) {
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [editedPreferences, setEditedPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const data = await preferencesAPI.getAll();
      // Normalize language preference key (could be 'language' or 'locale')
      const normalizedData = { ...data };
      if (data.locale && !data.language) {
        normalizedData.language = data.locale;
      }
      setPreferences(normalizedData);
      setEditedPreferences(normalizedData);
    } catch (error) {
      logger.error('Failed to fetch preferences:', error instanceof Error ? error : new Error(String(error)));
      showToast({
        message: 'Failed to load preferences',
        type: 'error',
      });
      // Set empty preferences on error to prevent UI issues
      setPreferences({});
      setEditedPreferences({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: unknown) => {
    setEditedPreferences({
      ...editedPreferences,
      [key]: value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await preferencesAPI.setAll(editedPreferences);
      setPreferences(editedPreferences);
      
      // Check if language changed and redirect to new locale
      const newLanguage = editedPreferences.language as string;
      const oldLanguage = preferences.language as string;
      
      if (newLanguage && newLanguage !== oldLanguage && newLanguage !== currentLocale) {
        // Get the actual URL pathname (includes locale prefix if present)
        const actualPathname = typeof window !== 'undefined' ? window.location.pathname : pathname;
        
        // Get path without locale prefix from actual URL
        // Remove any locale prefix (en, fr, ar, he) from the beginning
        const pathWithoutLocale = actualPathname.replace(/^\/(en|fr|ar|he)(\/|$)/, '/') || '/';
        // Ensure it starts with / and doesn't end with / unless it's root
        const cleanPath = pathWithoutLocale === '/' ? '/' : pathWithoutLocale.replace(/\/$/, '') || '/';
        
        // Build new path with new locale
        // English has no prefix, other locales have /{locale} prefix
        const newPath = newLanguage === 'en' 
          ? cleanPath 
          : `/${newLanguage}${cleanPath === '/' ? '' : cleanPath}`;
        
        // Show success message and redirect
        showToast({
          message: 'Preferences saved successfully. Redirecting...',
          type: 'success',
        });
        
        // Small delay to show toast, then redirect
        setTimeout(() => {
          window.location.href = newPath;
        }, 500);
      } else {
        showToast({
          message: 'Preferences saved successfully',
          type: 'success',
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to save preferences:', error instanceof Error ? error : new Error(String(error)));
      showToast({
        message: getErrorMessage(error) || 'Failed to save preferences',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditedPreferences(preferences);
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(editedPreferences);

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-muted-foreground">Chargement des préférences...</div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Préférences utilisateur
        </h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Language Preference */}
        <div>
          <label className="block text-sm font-medium mb-2">Langue</label>
          <Select
            label=""
            value={(editedPreferences.language as string) || currentLocale || 'fr'}
            onChange={(e) => handleChange('language', e.target.value)}
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>

        {/* Theme Preference */}
        <div>
          <label className="block text-sm font-medium mb-2">Thème</label>
          <Select
            label=""
            value={(editedPreferences.theme as string) || 'system'}
            onChange={(e) => handleChange('theme', e.target.value)}
            options={[
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
              { value: 'system', label: 'Système' },
            ]}
          />
        </div>

        {/* Email Notifications */}
        <div>
          <label className="block text-sm font-medium mb-2">Notifications par email</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedPreferences.email_notifications !== false}
                onChange={(e) => handleChange('email_notifications', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Activer les notifications par email</span>
            </label>
          </div>
        </div>

        {/* Timezone Preference */}
        <div>
          <label className="block text-sm font-medium mb-2">Fuseau horaire</label>
          <Select
            label=""
            value={(editedPreferences.timezone as string) || 'America/Montreal'}
            onChange={(e) => handleChange('timezone', e.target.value)}
            options={[
              { value: 'America/Montreal', label: 'Montréal (EST/EDT)' },
              { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
              { value: 'America/New_York', label: 'New York (EST/EDT)' },
              { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
              { value: 'UTC', label: 'UTC' },
            ]}
          />
        </div>

        {/* Custom Preferences */}
        {Object.entries(editedPreferences).map(([key, value]) => {
          if (['theme', 'language', 'email_notifications', 'timezone'].includes(key)) {
            return null;
          }
          return (
            <div key={key}>
              <label className="block text-sm font-medium mb-2 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              {typeof value === 'boolean' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Activé</span>
                </label>
              ) : typeof value === 'number' ? (
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                />
              ) : (
                <Input
                  value={String(value || '')}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
