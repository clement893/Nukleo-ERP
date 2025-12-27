/**
 * Dark Mode Utilities
 * Functions to detect and apply dark mode
 */

import { DARK_MODE_CONFIG } from './dark-mode-config';
import { DEFAULT_THEME_CONFIG } from './default-theme-config';
import type { ThemeConfig } from '@modele/types';

/**
 * Detect system dark mode preference
 * 
 * @returns true if system prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR, default to light
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get theme mode from config or system preference
 * 
 * @param config Theme configuration
 * @returns 'light' | 'dark' | 'system'
 */
export function getThemeMode(config: ThemeConfig): 'light' | 'dark' | 'system' {
  const mode = (config as any).mode || 'system';
  
  if (mode === 'system') {
    return prefersDarkMode() ? 'dark' : 'light';
  }
  
  return mode as 'light' | 'dark';
}

/**
 * Get appropriate theme config based on mode
 * 
 * @param config Theme configuration
 * @returns Theme config for current mode
 */
export function getThemeConfigForMode(config: ThemeConfig): ThemeConfig {
  const mode = getThemeMode(config);
  
  if (mode === 'dark') {
    // Merge dark mode config with custom config
    const configColors = (config as any).colors;
    const configTypography = (config as any).typography;
    return {
      ...config,
      colors: {
        ...DARK_MODE_CONFIG.colors,
        ...(configColors && typeof configColors === 'object' ? configColors : {}),
      },
      typography: {
        ...DARK_MODE_CONFIG.typography,
        ...(configTypography && typeof configTypography === 'object' ? configTypography : {}),
      },
    } as ThemeConfig;
  }
  
  // Light mode - use default or provided config
  const configColors = (config as any).colors;
  const configTypography = (config as any).typography;
  return {
    ...DEFAULT_THEME_CONFIG,
    ...config,
    colors: {
      ...DEFAULT_THEME_CONFIG.colors,
      ...(configColors && typeof configColors === 'object' ? configColors : {}),
    },
    typography: {
      ...DEFAULT_THEME_CONFIG.typography,
      ...(configTypography && typeof configTypography === 'object' ? configTypography : {}),
    },
  } as ThemeConfig;
}

/**
 * Apply dark mode class to document root
 * 
 * @param isDark Whether to apply dark mode
 */
export function applyDarkModeClass(isDark: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Listen to system dark mode preference changes
 * 
 * @param callback Callback function when preference changes
 * @returns Cleanup function
 */
export function watchDarkModePreference(
  callback: (isDark: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR, return no-op cleanup
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches);
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  
  // Legacy browsers
  if (mediaQuery.addListener) {
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }
  
  return () => {};
}

