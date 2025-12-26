/**
 * Global Theme Provider - Fetches and applies the active theme from the backend.
 */
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getActiveTheme } from '@/lib/api/theme';
import { logger } from '@/lib/logger';
import type { ThemeConfigResponse, ThemeConfig } from '@modele/types';
import { generateColorShades, generateRgb } from './color-utils';

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
      // Always apply theme config, even if it's the default
      applyThemeConfig(activeTheme.config);
    } catch (err) {
      // This should rarely happen now since getActiveTheme returns default theme
      const error = err instanceof Error ? err : new Error('Failed to load theme');
      setError(error);
      logger.warn('Failed to fetch global theme, using default', { message: error.message, name: error.name });
      // Still try to apply a basic default theme
      try {
        const defaultTheme = await getActiveTheme();
        applyThemeConfig(defaultTheme.config);
      } catch {
        // If even that fails, just log and continue
        logger.error('Could not apply default theme');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeConfig = (config: ThemeConfig) => {
    // Apply CSS variables to document root
    const root = document.documentElement;
    
    // Generate color shades from base colors
    if (config.primary_color) {
      const primaryShades = generateColorShades(config.primary_color);
      Object.entries(primaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-primary-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-primary-rgb`, generateRgb(color));
        }
      });
    }
    
    if (config.secondary_color) {
      const secondaryShades = generateColorShades(config.secondary_color);
      Object.entries(secondaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-secondary-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-secondary-rgb`, generateRgb(color));
        }
      });
    }
    
    if (config.danger_color) {
      const dangerShades = generateColorShades(config.danger_color);
      Object.entries(dangerShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-danger-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-danger-rgb`, generateRgb(color));
        }
      });
    }
    
    if (config.warning_color) {
      const warningShades = generateColorShades(config.warning_color);
      Object.entries(warningShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-warning-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-warning-rgb`, generateRgb(color));
        }
      });
    }
    
    if (config.info_color) {
      const infoShades = generateColorShades(config.info_color);
      Object.entries(infoShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-info-${shade}`, color);
      });
    }
    
    if (config.success_color) {
      // Success colors use secondary shades, but we can also generate specific ones
      const successShades = generateColorShades(config.success_color);
      Object.entries(successShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-success-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-success-rgb`, generateRgb(color));
        }
      });
    }
    
    // Load font URL if configured (for Google Fonts or custom fonts)
    if (config.font_url && typeof config.font_url === 'string' && typeof document !== 'undefined') {
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[data-theme-font]`);
      if (existingLink) {
        existingLink.remove();
      }

      // Load font dynamically
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = config.font_url;
      link.setAttribute('data-theme-font', 'true');
      document.head.appendChild(link);
    }

    // Apply fonts
    if (config.font_family) {
      const fontFamily = config.font_family.trim();
      root.style.setProperty('--font-family', `${fontFamily}, sans-serif`);
      root.style.setProperty('--font-family-heading', `${fontFamily}, sans-serif`);
      root.style.setProperty('--font-family-subheading', `${fontFamily}, sans-serif`);
      // Apply to body and html
      if (typeof document !== 'undefined') {
        document.body.style.fontFamily = `var(--font-family), sans-serif`;
        root.style.fontFamily = `var(--font-family), sans-serif`;
      }
    }
    
    // Also check typography.fontUrl for new format
    if ((config as any).typography?.fontUrl && typeof document !== 'undefined') {
      const fontUrl = (config as any).typography.fontUrl;
      const existingLink = document.querySelector(`link[data-theme-font]`);
      if (existingLink) {
        existingLink.remove();
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      link.setAttribute('data-theme-font', 'true');
      document.head.appendChild(link);
    }
    
    // Apply fonts from typography config if available
    if ((config as any).typography?.fontFamily) {
      const fontFamily = String((config as any).typography.fontFamily).trim();
      root.style.setProperty('--font-family', fontFamily);
      if ((config as any).typography.fontFamilyHeading) {
        root.style.setProperty('--font-family-heading', String((config as any).typography.fontFamilyHeading));
      }
      if ((config as any).typography.fontFamilySubheading) {
        root.style.setProperty('--font-family-subheading', String((config as any).typography.fontFamilySubheading));
      }
      if (typeof document !== 'undefined') {
        document.body.style.fontFamily = `var(--font-family), sans-serif`;
        root.style.fontFamily = `var(--font-family), sans-serif`;
      }
    }
    
    // Apply border radius
    if (config.border_radius) {
      root.style.setProperty('--border-radius', config.border_radius);
    }
    
    // Apply CSS effects (glassmorphism, shadows, gradients, and custom effects)
    const effects = (config as any).effects;
    if (effects) {
      // Glassmorphism
      if (effects.glassmorphism?.enabled) {
        const blur = effects.glassmorphism.blur || '10px';
        const saturation = effects.glassmorphism.saturation || '180%';
        root.style.setProperty('--glassmorphism-backdrop', `blur(${blur}) saturate(${saturation})`);
        root.style.setProperty('--glassmorphism-opacity', String(effects.glassmorphism.opacity || 0.1));
        root.style.setProperty('--glassmorphism-border-opacity', String(effects.glassmorphism.borderOpacity || 0.2));
      }
      
      // Custom shadows
      if (effects.shadows) {
        if (effects.shadows.sm) root.style.setProperty('--shadow-sm', effects.shadows.sm);
        if (effects.shadows.md) root.style.setProperty('--shadow-md', effects.shadows.md);
        if (effects.shadows.lg) root.style.setProperty('--shadow-lg', effects.shadows.lg);
        if (effects.shadows.xl) root.style.setProperty('--shadow-xl', effects.shadows.xl);
      }
      
      // Gradients
      if (effects.gradients?.enabled) {
        root.style.setProperty('--gradient-direction', effects.gradients.direction || 'to-br');
        root.style.setProperty('--gradient-intensity', String(effects.gradients.intensity || 0.3));
      }
      
      // Apply custom effects as CSS variables
      // Exclude predefined effects (glassmorphism, shadows, gradients)
      const predefinedKeys = ['glassmorphism', 'shadows', 'gradients'];
      Object.entries(effects).forEach(([key, value]) => {
        if (!predefinedKeys.includes(key) && typeof value === 'object' && value !== null) {
          // Convert effect properties to CSS variables
          Object.entries(value as Record<string, any>).forEach(([propKey, propValue]) => {
            if (propKey !== 'description' && typeof propValue === 'string') {
              // Convert camelCase to kebab-case for CSS variables
              const cssVarName = `--effect-${key}-${propKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
              root.style.setProperty(cssVarName, propValue);
            }
          });
        }
      });
    }
    
    // Update status colors to use theme colors
    root.style.setProperty('--color-status-todo', `var(--color-primary-500)`);
    root.style.setProperty('--color-status-in-progress', `var(--color-warning-500)`);
    root.style.setProperty('--color-status-done', `var(--color-secondary-500)`);
    root.style.setProperty('--color-status-error', `var(--color-danger-500)`);
    
    // Update chart colors
    root.style.setProperty('--color-chart-default', `var(--color-primary-500)`);
    root.style.setProperty('--color-chart-success', `var(--color-secondary-500)`);
    root.style.setProperty('--color-chart-warning', `var(--color-warning-500)`);
    root.style.setProperty('--color-chart-danger', `var(--color-danger-500)`);
    
    // Update text link color to use primary color
    root.style.setProperty('--color-text-link', `var(--color-primary-500)`);
    root.style.setProperty('--color-text-link-rgb', `var(--color-primary-rgb)`);
    
    // Update error and success colors
    root.style.setProperty('--color-error', `var(--color-danger-500)`);
    root.style.setProperty('--color-error-rgb', `var(--color-danger-rgb)`);
    root.style.setProperty('--color-success', `var(--color-secondary-500)`);
    root.style.setProperty('--color-success-rgb', `var(--color-secondary-rgb)`);
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
