'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, useMemo, ReactNode, startTransition } from 'react';
import { getActiveTheme } from '@/lib/api/theme';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Helper function to get initial theme synchronously from localStorage
// This runs during component initialization, before first render
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'system';
  } catch {
    return 'system';
  }
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
  // Preload theme from localStorage synchronously to avoid re-renders
  const initialTheme = useMemo(() => getInitialTheme(), []);
  const initialResolvedTheme = useMemo(() => resolveTheme(initialTheme), [initialTheme]);
  
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(initialResolvedTheme);
  
  // Apply theme to document immediately on mount (synchronous)
  // BUT: Don't override if script inline already applied the correct class
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    const currentClass = root.classList.contains('dark') ? 'dark' : root.classList.contains('light') ? 'light' : null;
    
    // Only update if the current class doesn't match what we want
    // This prevents removing 'dark' that was set by the inline script
    if (currentClass !== initialResolvedTheme) {
      root.classList.remove('light', 'dark');
      root.classList.add(initialResolvedTheme);
    }
  }, []); // Only run once on mount

  // Load theme preference asynchronously (non-blocking)
  useEffect(() => {
    // If we already have a theme from localStorage, skip API call
    if (initialTheme !== 'system' || localStorage.getItem('theme')) {
      return;
    }
    
    // Load global theme from database (non-critical, use startTransition)
    startTransition(() => {
      getActiveTheme()
        .then((response) => {
          const mode = (response.config?.mode as Theme) || 'system';
          if (mode !== theme) {
            setThemeState(mode);
          }
        })
        .catch(() => {
          // Silently fallback - theme already set from localStorage or default
        });
    });
    
    // Poll for global theme changes every 30 seconds (only if no local preference)
    const interval = setInterval(() => {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (!savedTheme) {
        getActiveTheme()
          .then((response) => {
            const mode = (response.config?.mode as Theme) || 'system';
            if (mode !== theme) {
              setThemeState(mode);
            }
          })
          .catch(() => {
            // Silently fail
          });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []); // Only run once on mount

  // Update resolved theme and apply to document when theme changes
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    
    // Déterminer le thème résolu
    const resolved = resolveTheme(theme);
    
    // Batch state updates to avoid multiple re-renders
    if (resolved !== resolvedTheme) {
      setResolvedTheme(resolved);
    }

    // Check current class to avoid unnecessary DOM manipulation
    const currentClass = root.classList.contains('dark') ? 'dark' : root.classList.contains('light') ? 'light' : null;
    
    // Only update if the resolved theme is different from current
    if (currentClass !== resolved) {
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
    }

    // Note: Theme is now global and managed by superadmins only
    // Users cannot change it, so we don't save to DB here
    // Only save to localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]); // Only depend on theme, not resolvedTheme

  useEffect(() => {
    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = mediaQuery.matches ? 'dark' : 'light';
        const root = document.documentElement;
        const currentClass = root.classList.contains('dark') ? 'dark' : root.classList.contains('light') ? 'light' : null;
        
        // Only update if different
        if (currentClass !== resolved) {
          // Use startTransition for non-critical UI updates
          startTransition(() => {
            setResolvedTheme(resolved);
            root.classList.remove('light', 'dark');
            root.classList.add(resolved);
          });
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    // Allow users to override the global theme with their local preference
    // This preference is stored in localStorage and takes precedence
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    // Apply immediately (synchronous for user interactions)
    const root = window.document.documentElement;
    const resolved = resolveTheme(newTheme);
    
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

