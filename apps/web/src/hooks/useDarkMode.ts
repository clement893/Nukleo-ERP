/**
 * Simple Dark Mode Hook
 * Replaces ThemeContext with a simpler, direct approach
 * Reads from DOM (set by inline script) and localStorage
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Get current dark mode state from DOM
 */
function getIsDark(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Get current theme mode from localStorage
 */
function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as ThemeMode | null) || 'system';
}

/**
 * Resolve theme mode to actual dark/light
 */
function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Apply theme class to DOM
 */
function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
}

/**
 * Simple Dark Mode Hook
 * 
 * @returns { isDark: boolean, toggle: () => void, setMode: (mode: ThemeMode) => void, mode: ThemeMode }
 * 
 * @example
 * ```tsx
 * const { isDark, toggle } = useDarkMode();
 * 
 * return (
 *   <button onClick={toggle}>
 *     {isDark ? '☀️ Light' : '🌙 Dark'}
 *   </button>
 * );
 * ```
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => getIsDark());
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeMode());

  // Sync with DOM changes (e.g., from inline script or external changes)
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const current = root.classList.contains('dark');
      if (current !== isDark) {
        setIsDark(current);
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [isDark]);

  // Listen to system preference changes (only if mode is 'system')
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      applyThemeClass(resolved === 'dark');
      setIsDark(resolved === 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const toggle = useCallback(() => {
    const newIsDark = !isDark;
    applyThemeClass(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    setModeState(newIsDark ? 'dark' : 'light');
    setIsDark(newIsDark);
  }, [isDark]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme', newMode);
    
    if (newMode === 'system') {
      const resolved = resolveTheme('system');
      applyThemeClass(resolved === 'dark');
      setIsDark(resolved === 'dark');
    } else {
      const isDarkMode = newMode === 'dark';
      applyThemeClass(isDarkMode);
      setIsDark(isDarkMode);
    }
  }, []);

  return {
    isDark,
    toggle,
    setMode,
    mode,
  };
}

