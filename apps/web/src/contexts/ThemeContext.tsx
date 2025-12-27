'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Helper function to resolve theme synchronously
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

// Default context value to prevent "useTheme must be used within a ThemeProvider" errors
// This ensures the hook always works, even during SSR/hydration before mounted state
const defaultContextValue: ThemeContextType = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {
    // No-op during SSR/hydration
  },
  toggleTheme: () => {
    // No-op during SSR/hydration
  },
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read current theme from DOM (set by inline script) or localStorage
  // This avoids conflicts - we just read what's already there
  const getCurrentResolvedTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    const root = window.document.documentElement;
    if (root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('light')) return 'light';
    // Fallback to localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'dark') return 'dark';
    if (savedTheme === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const getCurrentTheme = (): Theme => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as Theme | null) || 'system';
  };

  const [theme, setThemeState] = useState<Theme>(getCurrentTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getCurrentResolvedTheme);

  // Sync resolvedTheme with DOM changes (e.g., from inline script or external changes)
  useEffect(() => {
    const root = window.document.documentElement;
    const observer = new MutationObserver(() => {
      const current = root.classList.contains('dark') ? 'dark' : 'light';
      if (current !== resolvedTheme) {
        setResolvedTheme(current);
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [resolvedTheme]);

  // Listen to system preference changes (only if theme is 'system')
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      const root = document.documentElement;
      // Update DOM and state
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      
      // Apply to DOM immediately
      const root = window.document.documentElement;
      const resolved = resolveTheme(newTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    }
  };

  const toggleTheme = () => {
    // Toggle between light and dark (skip system for toggle)
    const currentResolved = resolvedTheme;
    const newTheme: Theme = currentResolved === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Always render the Provider with actual values (no mounted check needed)
  // Theme is preloaded synchronously, so we always have valid values
  const contextValue = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  // Context always has a value now (defaultContextValue), so no need to check for undefined
  const context = useContext(ThemeContext);
  return context;
}

