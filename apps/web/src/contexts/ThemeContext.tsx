'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getActiveTheme } from '@/lib/api/theme';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load theme preference: localStorage takes precedence over global theme
    const loadTheme = async () => {
      // First check localStorage for user's local preference
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        setThemeState(savedTheme);
        return;
      }
      
      // If no local preference, try to load global theme from database
      try {
        const response = await getActiveTheme();
        // Extract mode from config, default to 'system' if not present
        const mode = (response.config?.mode as Theme) || 'system';
        setThemeState(mode);
      } catch (error) {
        console.error('Failed to load global theme from database:', error);
        // Fallback to system if both fail
        setThemeState('system');
      }
    };

    loadTheme();
    
    // Poll for global theme changes every 30 seconds (only if no local preference)
    const interval = setInterval(() => {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (!savedTheme) {
        loadTheme();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Déterminer le thème résolu
    let resolved: 'light' | 'dark' = 'light';
    
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);

    // Appliquer le thème au document
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Note: Theme is now global and managed by superadmins only
    // Users cannot change it, so we don't save to DB here
    // Only save to localStorage as fallback
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    // Allow users to override the global theme with their local preference
    // This preference is stored in localStorage and takes precedence
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply immediately
    const root = window.document.documentElement;
    let resolved: 'light' | 'dark' = 'light';
    
    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = newTheme;
    }
    
    setResolvedTheme(resolved);
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  };

  const toggleTheme = () => {
    // Toggle between light and dark (skip system for toggle)
    const currentResolved = resolvedTheme;
    const newTheme: Theme = currentResolved === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

