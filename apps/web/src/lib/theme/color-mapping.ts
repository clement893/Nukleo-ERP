/**
 * Color Mapping Helper
 * Maps hardcoded hex colors to theme CSS variables
 * Used for refactoring Phase 2A: Remove hardcoded colors
 */

/**
 * Get theme color value from CSS variable
 * For use in JavaScript objects (charts, data structures)
 */
export function getThemeColor(variableName: string, fallback?: string): string {
  if (typeof window === 'undefined') {
    // SSR: return fallback or variable reference
    return fallback || `var(${variableName})`;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName);
  const trimmed = value.trim();

  if (trimmed) {
    return trimmed;
  }

  return fallback || `var(${variableName})`;
}

/**
 * Color mappings for common hardcoded colors
 */
export const COLOR_MAP = {
  // Primary purple (Nukleo brand)
  PRIMARY: {
    HEX: '#523DC9',
    VARIABLE: '--color-primary-500',
    CLASS: 'primary-500',
  },
  // Success/Green
  SUCCESS: {
    HEX: '#10B981',
    VARIABLE: '--color-success-500',
    CLASS: 'success-500',
  },
  // Danger/Red
  DANGER: {
    HEX: '#EF4444',
    VARIABLE: '--color-danger-500',
    CLASS: 'danger-500',
  },
  // Warning/Amber
  WARNING: {
    HEX: '#F59E0B',
    VARIABLE: '--color-warning-500',
    CLASS: 'warning-500',
  },
  // Info/Blue
  INFO: {
    HEX: '#3B82F6',
    VARIABLE: '--color-primary-500', // Using primary as info
    CLASS: 'primary-500',
  },
} as const;

/**
 * Get theme color for use in CSS classes
 */
export function getThemeColorClass(color: keyof typeof COLOR_MAP): string {
  return COLOR_MAP[color].CLASS;
}

/**
 * Get theme color for use in inline styles or JavaScript
 * Returns the actual computed color value if available, otherwise the CSS variable reference
 */
export function getThemeColorValue(color: keyof typeof COLOR_MAP): string {
  return getThemeColor(COLOR_MAP[color].VARIABLE, COLOR_MAP[color].HEX);
}

/**
 * Replace hardcoded hex color with theme color
 */
export function replaceColor(hex: string): string {
  const upperHex = hex.toUpperCase();
  
  switch (upperHex) {
    case COLOR_MAP.PRIMARY.HEX:
      return getThemeColorValue('PRIMARY');
    case COLOR_MAP.SUCCESS.HEX:
      return getThemeColorValue('SUCCESS');
    case COLOR_MAP.DANGER.HEX:
      return getThemeColorValue('DANGER');
    case COLOR_MAP.WARNING.HEX:
      return getThemeColorValue('WARNING');
    case COLOR_MAP.INFO.HEX:
      return getThemeColorValue('INFO');
    default:
      return hex; // Return as-is if not in mapping
  }
}
