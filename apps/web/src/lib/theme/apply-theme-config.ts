/**
 * Utility function to apply theme config directly to the DOM
 * This can be used to apply theme changes immediately without fetching from backend
 */
import type { ThemeConfig } from '@modele/types';
import { generateColorShades, generateRgb } from './color-utils';
import { validateThemeConfig } from './theme-validator';
import { logger } from '@/lib/logger';

export function applyThemeConfigDirectly(config: ThemeConfig, options?: {
  validateContrast?: boolean;
  logWarnings?: boolean;
}) {
  if (typeof document === 'undefined') {
    return; // Server-side rendering, skip
  }
  
  const { validateContrast = true, logWarnings = true } = options || {};
  
  // Validate theme configuration if requested
  if (validateContrast) {
    const validation = validateThemeConfig(config as any, { 
      strictContrast: false, 
      logWarnings 
    });
    
    if (!validation.valid) {
      if (validation.colorFormatErrors.length > 0) {
        logger.warn('[Theme] Color format errors detected:', validation.colorFormatErrors);
      }
      
      if (validation.contrastIssues.length > 0) {
        const failCount = validation.contrastIssues.filter(issue => issue.level === 'fail').length;
        if (failCount > 0) {
          logger.warn(`[Theme] ${failCount} contrast issue(s) detected that do not meet WCAG requirements`);
        }
      }
    }
  }

  const root = document.documentElement;
  
  // Support multiple formats:
  // 1. Flat format: primary_color, secondary_color, etc.
  // 2. Short format: primary, secondary, etc. (directly in config)
  // 3. Nested format: colors.primary, colors.secondary, etc.
  const colorsConfig = (config as any).colors || {};
  const primaryColor = (config as any).primary || config.primary_color || colorsConfig.primary_color || colorsConfig.primary;
  const secondaryColor = (config as any).secondary || config.secondary_color || colorsConfig.secondary_color || colorsConfig.secondary;
  const dangerColor = (config as any).danger || config.danger_color || colorsConfig.danger_color || colorsConfig.destructive || colorsConfig.danger;
  const warningColor = (config as any).warning || config.warning_color || colorsConfig.warning_color || colorsConfig.warning;
  const infoColor = (config as any).info || config.info_color || colorsConfig.info_color || colorsConfig.info;
  const successColor = (config as any).success || config.success_color || colorsConfig.success_color || colorsConfig.success;
  
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
    const successShades = generateColorShades(successColor);
    Object.entries(successShades).forEach(([shade, color]) => {
      root.style.setProperty(`--color-success-${shade}`, color);
      if (shade === '500') {
        root.style.setProperty(`--color-success-rgb`, generateRgb(color));
      }
    });
  }
  
  // Apply colors from nested colors object
  if (colorsConfig.background) {
    root.style.setProperty('--color-background', colorsConfig.background);
  }
  if (colorsConfig.foreground) {
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
  
  // Load font URL if configured
  if (config.font_url && typeof config.font_url === 'string' && typeof document !== 'undefined') {
    const existingLink = document.querySelector(`link[data-theme-font]`);
    if (existingLink) {
      existingLink.remove();
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.font_url;
    link.setAttribute('data-theme-font', 'true');
    document.head.appendChild(link);
  }
  
  // Apply fonts from typography config if available
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
  
  // Apply fonts
  if (config.font_family) {
    const fontFamily = config.font_family.trim();
    root.style.setProperty('--font-family', `${fontFamily}, sans-serif`);
    root.style.setProperty('--font-family-heading', `${fontFamily}, sans-serif`);
    root.style.setProperty('--font-family-subheading', `${fontFamily}, sans-serif`);
  }
  
  if ((config as any).typography?.fontFamily) {
    const fontFamily = String((config as any).typography.fontFamily).trim();
    root.style.setProperty('--font-family', fontFamily);
    if ((config as any).typography.fontFamilyHeading) {
      root.style.setProperty('--font-family-heading', String((config as any).typography.fontFamilyHeading));
    }
    if ((config as any).typography.fontFamilySubheading) {
      root.style.setProperty('--font-family-subheading', String((config as any).typography.fontFamilySubheading));
    }
  }
  
  // Apply border radius
  if (config.border_radius) {
    root.style.setProperty('--border-radius', config.border_radius);
  }
  
  // Apply CSS effects
  const effects = (config as any).effects;
  if (effects) {
    // Support both old format (glassmorphism.enabled) and new format (glassmorphism.card, etc.)
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
    
    if (effects.shadows) {
      if (effects.shadows.sm) root.style.setProperty('--shadow-sm', effects.shadows.sm);
      if (effects.shadows.md) root.style.setProperty('--shadow-md', effects.shadows.md);
      if (effects.shadows.lg) root.style.setProperty('--shadow-lg', effects.shadows.lg);
      if (effects.shadows.xl) root.style.setProperty('--shadow-xl', effects.shadows.xl);
    }
    
    if (effects.gradients?.enabled) {
      root.style.setProperty('--gradient-direction', effects.gradients.direction || 'to-br');
      root.style.setProperty('--gradient-intensity', String(effects.gradients.intensity || 0.3));
    }
  }
}

