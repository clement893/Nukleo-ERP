'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';

interface PreferencesManagerProps {
  className?: string;
}

export function PreferencesManager({ className = '' }: PreferencesManagerProps) {
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [editedPreferences, setEditedPreferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Record<string, any>>('/api/v1/users/preferences');
      if (response.data) {
        setPreferences(response.data);
        setEditedPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setEditedPreferences({
      ...editedPreferences,
      [key]: value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/api/v1/users/preferences', editedPreferences);
      setPreferences(editedPreferences);
      showToast({
        message: 'Preferences saved successfully',
        type: 'success',
      });
    } catch (error: any) {
      showToast({
        message: error.response?.data?.detail || 'Failed to save preferences',
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
        <div className="text-center py-8 text-gray-500">Loading preferences...</div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferences
        </h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Theme Preference */}
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            value={editedPreferences.theme || 'system'}
            onChange={(e) => handleChange('theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Language Preference */}
        <div>
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={editedPreferences.language || 'en'}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium mb-2">Email Notifications</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedPreferences.email_notifications !== false}
                onChange={(e) => handleChange('email_notifications', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Enable email notifications</span>
            </label>
          </div>
        </div>

        {/* Custom Preferences */}
        {Object.entries(editedPreferences).map(([key, value]) => {
          if (['theme', 'language', 'email_notifications'].includes(key)) {
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
                  <span className="text-sm">Enabled</span>
                </label>
              ) : typeof value === 'number' ? (
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                />
              ) : (
                <Input
                  value={String(value)}
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



