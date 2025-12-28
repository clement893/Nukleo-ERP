/**
 * Global Theme Provider - Fetches and applies the active theme from the backend.
 */
'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode, startTransition } from 'react';
import { getActiveTheme } from '@/lib/api/theme';
import { logger } from '@/lib/logger';
import type { ThemeConfigResponse, ThemeConfig } from '@modele/types';
import { generateColorShades, generateRgb } from './color-utils';
import { watchDarkModePreference, getThemeConfigForMode } from './dark-mode-utils';
import { getThemeFromCache, saveThemeToCache } from './theme-cache';
import { checkFonts } from '@/lib/api/theme-font';

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
  // Preload theme from cache synchronously to avoid re-renders
  const cachedTheme = typeof window !== 'undefined' ? getThemeFromCache() : null;
  const initialTheme = cachedTheme
    ? ({
        config: cachedTheme,
      } as ThemeConfigResponse)
    : null;

  const [theme, setTheme] = useState<ThemeConfigResponse | null>(initialTheme);
  const [error, setError] = useState<Error | null>(null);

  const fetchTheme = async (forceApply: boolean = false) => {
    try {
      setError(null);
      
      // Fetch fresh theme from backend (non-blocking)
      const activeTheme = await getActiveTheme();
      
      // Check if theme changed (ID or config)
      const currentThemeId = theme?.id;
      const themeIdChanged = currentThemeId !== activeTheme.id;
      
      // Compare config to detect changes even if ID is the same
      // Use a more robust comparison that handles object order differences
      const currentConfigStr = theme?.config ? JSON.stringify(theme.config, Object.keys(theme.config).sort()) : null;
      const newConfigStr = activeTheme.config ? JSON.stringify(activeTheme.config, Object.keys(activeTheme.config).sort()) : null;
      const configChanged = themeIdChanged || currentConfigStr !== newConfigStr;
      
      // Always apply if forced, or if theme/config changed, or if no theme is set yet
      if (forceApply || configChanged || !theme) {
        logger.info('[Theme] Theme changed or force apply, applying new configuration', {
          oldId: currentThemeId,
          newId: activeTheme.id,
          idChanged: themeIdChanged,
          configChanged: !themeIdChanged && configChanged,
          forceApply,
          hasTheme: !!theme,
        });
        
        setTheme(activeTheme);
        // Apply theme config from backend (TemplateTheme or active theme)
        // BUT: Don't override if manual theme is active (for preview mode)
        const isManualTheme = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-manual-theme');
        if (!isManualTheme) {
          applyThemeConfig(activeTheme.config);
          logger.info('[Theme] Theme config applied to DOM', { themeId: activeTheme.id });
        } else {
          logger.info('[Theme] Skipped theme application (manual theme active)');
        }
        // Cache the theme for next time
        saveThemeToCache(activeTheme.config, activeTheme.id);
      } else {
        logger.debug('[Theme] Theme unchanged, skipping application', {
          currentId: currentThemeId,
          activeId: activeTheme.id,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load theme');
      setError(error);
      logger.error('Failed to fetch global theme from backend', { 
        message: error.message, 
        name: error.name 
      });
      
      // If we have a cached theme, use it as fallback
      const fallbackCachedTheme = getThemeFromCache();
      if (fallbackCachedTheme && !theme) {
        const cachedThemeResponse: ThemeConfigResponse = {
          config: fallbackCachedTheme,
        } as ThemeConfigResponse;
        setTheme(cachedThemeResponse);
        // Don't override if manual theme is active
        const isManualTheme = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-manual-theme');
        if (!isManualTheme) {
          applyThemeConfig(fallbackCachedTheme);
          logger.info('[Theme] Using cached theme as fallback');
        }
      }
      // Otherwise, the application will continue without theme customization
    }
  };

  const applyThemeConfig = (config: ThemeConfig) => {
    // Check actual dark class on document root (set by ThemeContext)
    // This ensures we use the correct mode even if theme config mode doesn't match
    const root = document.documentElement;
    const isDarkMode = root.classList.contains('dark');
    
    // Get theme config for current mode (light/dark/system)
    // But override mode based on actual dark class if present
    const actualMode = isDarkMode ? 'dark' : 'light';
    const configWithActualMode = { ...config, mode: actualMode } as ThemeConfig;
    const modeConfig = getThemeConfigForMode(configWithActualMode);
    
    // Note: We do NOT manage light/dark classes here - that's ThemeProvider's responsibility
    // ThemeProvider is the single source of truth for light/dark mode classes
    // We only manage CSS variables (colors, fonts, effects, etc.)
    
    // Apply CSS variables to document root
    // Use mode-specific config
    const configToApply = modeConfig;
    
    // Support multiple formats:
    // 1. Flat format: primary_color, secondary_color, etc.
    // 2. Short format: primary, secondary, etc. (directly in config)
    // 3. Nested format: colors.primary, colors.secondary, etc.
    const colorsConfig = (configToApply as any).colors || {};
    const primaryColor = (configToApply as any).primary || configToApply.primary_color || colorsConfig.primary_color || colorsConfig.primary;
    const secondaryColor = (configToApply as any).secondary || configToApply.secondary_color || colorsConfig.secondary_color || colorsConfig.secondary;
    const dangerColor = (configToApply as any).danger || configToApply.danger_color || colorsConfig.danger_color || colorsConfig.destructive || colorsConfig.danger;
    const warningColor = (configToApply as any).warning || configToApply.warning_color || colorsConfig.warning_color || colorsConfig.warning;
    const infoColor = (configToApply as any).info || configToApply.info_color || colorsConfig.info_color || colorsConfig.info;
    const successColor = (configToApply as any).success || configToApply.success_color || colorsConfig.success_color || colorsConfig.success;
    
    // Generate color shades from base colors
    if (primaryColor) {
      const primaryShades = generateColorShades(primaryColor);
      Object.entries(primaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-primary-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-primary-rgb`, generateRgb(color));
        }
      });
    }
    
    if (secondaryColor) {
      const secondaryShades = generateColorShades(secondaryColor);
      Object.entries(secondaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-secondary-${shade}`, color);
        // Also set success colors as aliases to secondary (unless success_color is explicitly set)
        if (!successColor) {
          root.style.setProperty(`--color-success-${shade}`, color);
        }
        if (shade === '500') {
          root.style.setProperty(`--color-secondary-rgb`, generateRgb(color));
          if (!successColor) {
            root.style.setProperty(`--color-success-rgb`, generateRgb(color));
          }
        }
      });
    }
    
    if (dangerColor) {
      const dangerShades = generateColorShades(dangerColor);
      Object.entries(dangerShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-danger-${shade}`, color);
        // Also set error colors as aliases to danger
        root.style.setProperty(`--color-error-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-danger-rgb`, generateRgb(color));
          root.style.setProperty(`--color-error-rgb`, generateRgb(color));
        }
      });
    }
    
    if (warningColor) {
      const warningShades = generateColorShades(warningColor);
      Object.entries(warningShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-warning-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-warning-rgb`, generateRgb(color));
        }
      });
    }
    
    if (infoColor) {
      const infoShades = generateColorShades(infoColor);
      Object.entries(infoShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-info-${shade}`, color);
      });
    }
    
    if (successColor) {
      // Success colors can be explicitly set, overriding secondary defaults
      const successShades = generateColorShades(successColor);
      Object.entries(successShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-success-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-success-rgb`, generateRgb(color));
        }
      });
    }
    
    // Also apply colors from nested colors object if available
    // Note: We only set CSS variables, not body styles directly, to prevent hydration mismatches
    // Body styles are handled via CSS in layout.tsx using these CSS variables
    if (colorsConfig.background && typeof colorsConfig.background === 'string') {
      root.style.setProperty('--color-background', colorsConfig.background);
    }
    if (colorsConfig.foreground && typeof colorsConfig.foreground === 'string') {
      root.style.setProperty('--color-foreground', colorsConfig.foreground);
    }
    if (colorsConfig.muted) {
      root.style.setProperty('--color-muted', colorsConfig.muted);
    }
    if (colorsConfig.mutedForeground) {
      root.style.setProperty('--color-muted-foreground', colorsConfig.mutedForeground);
    }
    if (colorsConfig.border) {
      root.style.setProperty('--color-border', colorsConfig.border);
    }
    if (colorsConfig.input) {
      root.style.setProperty('--color-input', colorsConfig.input);
    }
    if (colorsConfig.ring) {
      root.style.setProperty('--color-ring', colorsConfig.ring);
    }
    
    // Load font URL if configured (for Google Fonts or custom fonts)
    if (configToApply.font_url && typeof configToApply.font_url === 'string' && typeof document !== 'undefined') {
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[data-theme-font]`);
      if (existingLink) {
        existingLink.remove();
      }

      // Load font dynamically
      const fontUrl = typeof config.font_url === 'string' ? config.font_url : String(config.font_url || '');
      if (fontUrl) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        link.setAttribute('data-theme-font', 'true');
        document.head.appendChild(link);
      }
    }

    // Apply fonts - Only set CSS variables, don't modify body/html directly to avoid hydration issues
    if (configToApply.font_family) {
      const fontFamily = configToApply.font_family.trim();
      root.style.setProperty('--font-family', `${fontFamily}, sans-serif`);
      root.style.setProperty('--font-family-heading', `${fontFamily}, sans-serif`);
      root.style.setProperty('--font-family-subheading', `${fontFamily}, sans-serif`);
      // Don't modify document.body or root directly - let CSS handle it via var(--font-family)
    }
    
    // Also check typography.fontUrl for new format
    if ((configToApply as any).typography?.fontUrl && typeof document !== 'undefined') {
      const fontUrl = (configToApply as any).typography.fontUrl;
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
    if ((configToApply as any).typography?.fontFamily) {
      const fontFamily = String((configToApply as any).typography.fontFamily).trim();
      root.style.setProperty('--font-family', fontFamily);
      if ((configToApply as any).typography.fontFamilyHeading) {
        root.style.setProperty('--font-family-heading', String((configToApply as any).typography.fontFamilyHeading));
      }
      if ((configToApply as any).typography.fontFamilySubheading) {
        root.style.setProperty('--font-family-subheading', String((configToApply as any).typography.fontFamilySubheading));
      }
      // Don't modify document.body or root directly - let CSS handle it via var(--font-family)
    }
    
    // Apply border radius (support both string and object formats)
    if (configToApply.border_radius) {
      root.style.setProperty('--border-radius', configToApply.border_radius);
    }
    
    // Support borderRadius object format (sm, md, lg, xl, full)
    if ((configToApply as any).borderRadius) {
      const borderRadius = (configToApply as any).borderRadius;
      Object.entries(borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--border-radius-${key}`, String(value));
      });
    }
    
    // Apply typography fontSize
    if ((configToApply as any).typography?.fontSize) {
      const fontSize = (configToApply as any).typography.fontSize;
      Object.entries(fontSize).forEach(([key, value]) => {
        root.style.setProperty(`--font-size-${key}`, String(value));
      });
    }
    
    // Apply spacing
    if ((configToApply as any).spacing) {
      const spacing = (configToApply as any).spacing;
      Object.entries(spacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, String(value));
      });
    }
    
    // Apply CSS effects (comprehensive support for all effect types)
    const effects = (configToApply as any).effects;
    if (effects) {
      // Glassmorphism - Support both old format (glassmorphism.enabled) and new format (glassmorphism.card, etc.)
      if (effects.glassmorphism) {
        // New format: glassmorphism.card, glassmorphism.panel, etc.
        if (effects.glassmorphism.card) {
          const card = effects.glassmorphism.card;
          if (card.background) root.style.setProperty('--glassmorphism-card-background', card.background);
          if (card.backdropBlur) root.style.setProperty('--glassmorphism-card-backdrop-blur', card.backdropBlur);
          if (card.border) root.style.setProperty('--glassmorphism-card-border', card.border);
        }
        if (effects.glassmorphism.panel) {
          const panel = effects.glassmorphism.panel;
          if (panel.background) root.style.setProperty('--glassmorphism-panel-background', panel.background);
          if (panel.backdropBlur) root.style.setProperty('--glassmorphism-panel-backdrop-blur', panel.backdropBlur);
          if (panel.border) root.style.setProperty('--glassmorphism-panel-border', panel.border);
        }
        if (effects.glassmorphism.overlay) {
          const overlay = effects.glassmorphism.overlay;
          if (overlay.background) root.style.setProperty('--glassmorphism-overlay-background', overlay.background);
          if (overlay.backdropBlur) root.style.setProperty('--glassmorphism-overlay-backdrop-blur', overlay.backdropBlur);
        }
        
        // Old format: glassmorphism.enabled (for backward compatibility)
        if (effects.glassmorphism.enabled) {
          const blur = effects.glassmorphism.blur || '10px';
          const saturation = effects.glassmorphism.saturation || '180%';
          root.style.setProperty('--glassmorphism-backdrop', `blur(${blur}) saturate(${saturation})`);
          root.style.setProperty('--glassmorphism-opacity', String(effects.glassmorphism.opacity || 0.1));
          root.style.setProperty('--glassmorphism-border-opacity', String(effects.glassmorphism.borderOpacity || 0.2));
        }
      }
      
      // Shadows
      if (effects.shadows) {
        if (effects.shadows.sm) root.style.setProperty('--shadow-sm', effects.shadows.sm);
        if (effects.shadows.md) root.style.setProperty('--shadow-md', effects.shadows.md);
        if (effects.shadows.lg) root.style.setProperty('--shadow-lg', effects.shadows.lg);
        if (effects.shadows.xl) root.style.setProperty('--shadow-xl', effects.shadows.xl);
        // Support for any other shadow properties
        Object.entries(effects.shadows).forEach(([key, value]) => {
          if (!['sm', 'md', 'lg', 'xl'].includes(key) && typeof value === 'string') {
            root.style.setProperty(`--shadow-${key}`, value);
          }
        });
      }
      
      // Gradients
      if (effects.gradients) {
        if (effects.gradients.enabled) {
          root.style.setProperty('--gradient-direction', effects.gradients.direction || 'to-br');
          root.style.setProperty('--gradient-intensity', String(effects.gradients.intensity || 0.3));
        }
        // Support for gradient colors, stops, etc.
        Object.entries(effects.gradients).forEach(([key, value]) => {
          if (!['enabled', 'direction', 'intensity'].includes(key) && typeof value === 'string') {
            root.style.setProperty(`--gradient-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
          }
        });
      }
      
      // Apply custom effects as CSS variables (comprehensive recursive support)
      // Exclude predefined effects (glassmorphism, shadows, gradients)
      const predefinedKeys = ['glassmorphism', 'shadows', 'gradients'];
      Object.entries(effects).forEach(([key, value]) => {
        if (!predefinedKeys.includes(key) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively convert nested effect properties to CSS variables
          const convertEffectToCSSVars = (obj: Record<string, any>, prefix: string) => {
            Object.entries(obj).forEach(([propKey, propValue]) => {
              if (propKey !== 'description' && propKey !== 'enabled') {
                if (typeof propValue === 'string' || typeof propValue === 'number') {
                  // Convert camelCase to kebab-case for CSS variables
                  const cssVarName = `--effect-${prefix}-${propKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                  root.style.setProperty(cssVarName, String(propValue));
                } else if (typeof propValue === 'object' && propValue !== null && !Array.isArray(propValue)) {
                  // Recursively handle nested objects
                  convertEffectToCSSVars(propValue as Record<string, any>, `${prefix}-${propKey}`);
                }
              }
            });
          };
          convertEffectToCSSVars(value as Record<string, any>, key);
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

  // Apply cached theme immediately on mount (synchronous, before first render)
  useLayoutEffect(() => {
    if (cachedTheme && typeof window !== 'undefined') {
      // Don't apply if manual theme is active
      const isManualTheme = document.documentElement.hasAttribute('data-manual-theme');
      if (!isManualTheme) {
        applyThemeConfig(cachedTheme);
        logger.info('[Theme] Loaded theme from cache');
      }
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Fetch theme from API asynchronously (non-blocking, use startTransition)
    // Cache is already applied synchronously above
    startTransition(() => {
      fetchTheme();
    });
    
    // Watch for dark class changes on document root (set by ThemeContext)
    // This ensures theme CSS variables update when user toggles dark mode
    // BUT: Don't override if manual theme is active (for preview mode)
    const observer = new MutationObserver(() => {
      // Check if manual theme is active (data-manual-theme attribute)
      const isManualTheme = document.documentElement.hasAttribute('data-manual-theme');
      if (theme && !isManualTheme) {
        // Re-apply theme config when dark class changes (only if not manual)
        applyThemeConfig(theme.config);
      }
    });
    
    // Observe class changes on document root
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
    
    // Watch for system dark mode preference changes
    const cleanup = watchDarkModePreference(() => {
      // Re-apply theme when system preference changes (if mode is 'system')
      if (theme && (theme.config as any).mode === 'system') {
        applyThemeConfig(theme.config);
      }
    });
    
    // Refresh theme every 5 minutes to catch updates
    const interval = setInterval(() => {
      startTransition(() => {
        fetchTheme();
      });
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      cleanup();
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]); // Re-run when theme changes to update observer

  const refreshTheme = async () => {
    // Force apply when refreshing (e.g., after theme activation)
    await fetchTheme(true);
  };

  return (
    <GlobalThemeContext.Provider
      value={{
        theme,
        isLoading: false, // Always false - theme is preloaded from cache
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
