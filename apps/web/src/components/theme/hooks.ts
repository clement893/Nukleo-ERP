/**
 * Theme Hooks
 * Custom hooks for theme management
 */

import { useState, useEffect } from 'react';
import type { ThemeConfig } from './types';
import { defaultTheme } from './presets';
import { loadThemeFromStorage, saveThemeToStorage, applyTheme } from './utils';

export type { ThemeConfig };

/**
 * Hook to manage theme state
 */
export function useThemeManager() {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = loadThemeFromStorage();
    if (savedTheme) {
      setTheme({ ...defaultTheme, ...savedTheme });
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    saveThemeToStorage(theme);
  }, [theme, mounted]);

  const updateColor = (key: keyof ThemeConfig, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  const setTheme = (newTheme: ThemeConfig) => {
    setTheme((prev) => ({ ...prev, ...newTheme }));
  };

  return {
    theme,
    setTheme,
    updateColor,
    resetTheme,
    mounted,
  };
}

