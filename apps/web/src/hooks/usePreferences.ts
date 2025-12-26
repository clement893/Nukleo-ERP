import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

/**
 * Hook to manage user preferences
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<Record<string, any>>('/api/v1/users/preferences');
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const getPreference = useCallback(
    (key: string, defaultValue?: any) => {
      return preferences[key] !== undefined ? preferences[key] : defaultValue;
    },
    [preferences]
  );

  const setPreference = useCallback(async (key: string, value: any) => {
    try {
      await apiClient.put(`/api/v1/users/preferences/${key}`, { value });
      setPreferences((prev) => ({ ...prev, [key]: value }));
      return true;
    } catch (error) {
      console.error(`Failed to set preference ${key}:`, error);
      return false;
    }
  }, []);

  const setPreferencesBatch = useCallback(async (prefs: Record<string, any>) => {
    try {
      await apiClient.put('/api/v1/users/preferences', prefs);
      setPreferences((prev) => ({ ...prev, ...prefs }));
      return true;
    } catch (error) {
      console.error('Failed to set preferences:', error);
      return false;
    }
  }, []);

  return {
    preferences,
    isLoading,
    getPreference,
    setPreference,
    setPreferencesBatch,
    refresh: fetchPreferences,
  };
}

