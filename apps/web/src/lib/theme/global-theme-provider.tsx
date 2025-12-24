/**
 * Global Theme Provider - Fetches and applies the active theme from the backend.
 */
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getActiveTheme } from '@/lib/api/theme';
import type { ThemeConfigResponse, ThemeConfig } from '@modele/types';

interface GlobalThemeContextType {
  theme: ThemeConfigResponse | null;
  isLoading: boolean;
  error: Error | null;
  refreshTheme: () => Promise<void>;
}

const GlobalThemeContext = createContext<GlobalThemeContextType | undefined>(
  undefined
);

interface GlobalThemeProviderProps {
  children: ReactNode;
}

export function GlobalThemeProvider({ children }: GlobalThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activeTheme = await getActiveTheme();
      setTheme(activeTheme);
      applyThemeConfig(activeTheme.config);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load theme');
      setError(error);
      console.error('Failed to fetch global theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeConfig = (config: ThemeConfig) => {
    // Apply CSS variables to document root
    const root = document.documentElement;
    
    const applyConfig = (obj: ThemeConfig, prefix: string = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const cssVarName = prefix ? `--${prefix}-${key}` : `--${key}`;
        
        if (typeof value === 'object' && value !== null) {
          applyConfig(value as ThemeConfig, prefix ? `${prefix}-${key}` : key);
        } else {
          root.style.setProperty(cssVarName, String(value));
        }
      });
    };

    applyConfig(config);
  };

  useEffect(() => {
    fetchTheme();
    
    // Refresh theme every 5 minutes to catch updates
    const interval = setInterval(fetchTheme, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshTheme = async () => {
    await fetchTheme();
  };

  return (
    <GlobalThemeContext.Provider
      value={{
        theme,
        isLoading,
        error,
        refreshTheme,
      }}
    >
      {children}
    </GlobalThemeContext.Provider>
  );
}

export function useGlobalTheme() {
  const context = useContext(GlobalThemeContext);
  if (context === undefined) {
    throw new Error('useGlobalTheme must be used within a GlobalThemeProvider');
  }
  return context;
}

