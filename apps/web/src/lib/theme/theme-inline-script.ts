/**
 * Inline script to apply theme before React hydration
 * This prevents FOUC (Flash of Unstyled Content) on hard refresh
 */

export const themeInlineScript = `
(function() {
  'use strict';
  
  // Function to generate color shades (simplified version)
  function generateColorShades(hex) {
    function hexToRgb(hex) {
      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    
    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
    
    const rgb = hexToRgb(hex);
    if (!rgb) return {};
    
    const shades = {
      50: rgbToHex(Math.min(255, rgb.r + 200), Math.min(255, rgb.g + 200), Math.min(255, rgb.b + 200)),
      100: rgbToHex(Math.min(255, rgb.r + 150), Math.min(255, rgb.g + 150), Math.min(255, rgb.b + 150)),
      200: rgbToHex(Math.min(255, rgb.r + 100), Math.min(255, rgb.g + 100), Math.min(255, rgb.b + 100)),
      300: rgbToHex(Math.min(255, rgb.r + 50), Math.min(255, rgb.g + 50), Math.min(255, rgb.b + 50)),
      400: rgbToHex(Math.min(255, rgb.r + 25), Math.min(255, rgb.g + 25), Math.min(255, rgb.b + 25)),
      500: hex,
      600: rgbToHex(Math.max(0, rgb.r - 25), Math.max(0, rgb.g - 25), Math.max(0, rgb.b - 25)),
      700: rgbToHex(Math.max(0, rgb.r - 50), Math.max(0, rgb.g - 50), Math.max(0, rgb.b - 50)),
      800: rgbToHex(Math.max(0, rgb.r - 100), Math.max(0, rgb.g - 100), Math.max(0, rgb.b - 100)),
      900: rgbToHex(Math.max(0, rgb.r - 150), Math.max(0, rgb.g - 150), Math.max(0, rgb.b - 150)),
      950: rgbToHex(Math.max(0, rgb.r - 180), Math.max(0, rgb.g - 180), Math.max(0, rgb.b - 180))
    };
    
    return shades;
  }
  
  function generateRgb(hex) {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? result[1] + ', ' + result[2] + ', ' + result[3] : '';
  }
  
  function applyThemeConfig(config) {
    const root = document.documentElement;
    
    // Support both flat format (primary_color) and nested format (colors.primary)
    const colorsConfig = config.colors || {};
    const primaryColor = config.primary_color || colorsConfig.primary_color || colorsConfig.primary;
    const secondaryColor = config.secondary_color || colorsConfig.secondary_color || colorsConfig.secondary;
    const dangerColor = config.danger_color || colorsConfig.danger_color || colorsConfig.destructive || colorsConfig.danger;
    const warningColor = config.warning_color || colorsConfig.warning_color || colorsConfig.warning;
    const infoColor = config.info_color || colorsConfig.info_color || colorsConfig.info;
    const successColor = config.success_color || colorsConfig.success_color || colorsConfig.success;
    
    // Apply primary colors
    if (primaryColor) {
      const shades = generateColorShades(primaryColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-primary-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-primary-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply secondary colors
    if (secondaryColor) {
      const shades = generateColorShades(secondaryColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-secondary-' + shade, color);
        if (!successColor) {
          root.style.setProperty('--color-success-' + shade, color);
        }
        if (shade === '500') {
          root.style.setProperty('--color-secondary-rgb', generateRgb(color));
          if (!successColor) {
            root.style.setProperty('--color-success-rgb', generateRgb(color));
          }
        }
      });
    }
    
    // Apply danger colors
    if (dangerColor) {
      const shades = generateColorShades(dangerColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-danger-' + shade, color);
        root.style.setProperty('--color-error-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-danger-rgb', generateRgb(color));
          root.style.setProperty('--color-error-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply warning colors
    if (warningColor) {
      const shades = generateColorShades(warningColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-warning-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-warning-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply info colors
    if (infoColor) {
      const shades = generateColorShades(infoColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-info-' + shade, color);
      });
    }
    
    // Apply success colors
    if (successColor) {
      const shades = generateColorShades(successColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-success-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-success-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply other colors from nested colors object
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
    
    // Apply fonts
    if (config.font_family) {
      const fontFamily = config.font_family.trim();
      root.style.setProperty('--font-family', fontFamily + ', sans-serif');
      root.style.setProperty('--font-family-heading', fontFamily + ', sans-serif');
      root.style.setProperty('--font-family-subheading', fontFamily + ', sans-serif');
      if (document.body) {
        document.body.style.fontFamily = 'var(--font-family), sans-serif';
      }
    }
    
    // Apply fonts from typography config if available
    if (config.typography && config.typography.fontFamily) {
      const fontFamily = String(config.typography.fontFamily).trim();
      root.style.setProperty('--font-family', fontFamily);
      if (config.typography.fontFamilyHeading) {
        root.style.setProperty('--font-family-heading', String(config.typography.fontFamilyHeading));
      }
      if (config.typography.fontFamilySubheading) {
        root.style.setProperty('--font-family-subheading', String(config.typography.fontFamilySubheading));
      }
      if (document.body) {
        document.body.style.fontFamily = 'var(--font-family), sans-serif';
      }
    }
    
    // Load font URL if configured
    if (config.font_url || (config.typography && config.typography.fontUrl)) {
      const fontUrl = config.font_url || config.typography.fontUrl;
      const existingLink = document.querySelector('link[data-theme-font]');
      if (existingLink) {
        existingLink.remove();
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      link.setAttribute('data-theme-font', 'true');
      document.head.appendChild(link);
    }
    
    // Apply border radius
    if (config.border_radius) {
      root.style.setProperty('--border-radius', config.border_radius);
    }
  }
  
  // Apply default theme colors IMMEDIATELY to prevent color flash
  // These match the DEFAULT_THEME_CONFIG from the backend
  // This ensures consistent colors from the very first render
  (function() {
    try {
      var defaultConfig = {
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        danger_color: '#ef4444',
        warning_color: '#f59e0b',
        info_color: '#06b6d4',
        success_color: '#10b981',
        colors: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          danger: '#ef4444',
          destructive: '#ef4444',
          warning: '#f59e0b',
          info: '#06b6d4',
          success: '#10b981',
          background: '#ffffff',
          foreground: '#000000',
          muted: '#f3f4f6',
          mutedForeground: '#6b7280',
          border: '#e5e7eb',
          input: '#ffffff',
          ring: '#3b82f6'
        },
        font_family: 'Inter',
        border_radius: '8px',
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontFamilyHeading: 'Inter, system-ui, -apple-system, sans-serif',
          fontFamilySubheading: 'Inter, system-ui, -apple-system, sans-serif'
        }
      };
      
      // Apply default theme immediately (synchronously)
      applyThemeConfig(defaultConfig);
    } catch (e) {
      // Silently fail
    }
  })();
  
  // Then try to load theme from API asynchronously and update if different
  // This runs before React hydration to prevent FOUC
  // We use fetch with immediate execution to load theme as fast as possible
  (function() {
    try {
      // Get API URL from various sources
      var apiUrl = '';
      if (typeof window !== 'undefined') {
        // Try to get from window.__NEXT_DATA__ first (Next.js)
        if (window.__NEXT_DATA__ && window.__NEXT_DATA__.env && window.__NEXT_DATA__.env.NEXT_PUBLIC_API_URL) {
          apiUrl = window.__NEXT_DATA__.env.NEXT_PUBLIC_API_URL;
        }
        // Try to get from data attribute on html element
        else if (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.apiUrl) {
          apiUrl = document.documentElement.dataset.apiUrl;
        }
        // Fallback to default
        else {
          apiUrl = 'http://localhost:8000';
        }
      } else {
        apiUrl = 'http://localhost:8000';
      }
      
      // Use fetch for async loading (non-blocking)
      // This will update theme as soon as it loads, replacing the default
      fetch(apiUrl + '/api/v1/themes/active', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-cache'
      })
      .then(function(response) {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to load theme');
      })
      .then(function(data) {
        if (data && data.config) {
          // Update theme with actual values from API
          applyThemeConfig(data.config);
        }
      })
      .catch(function(error) {
        // Silently fail - default theme is already applied
        // This prevents errors from blocking page load if API is unavailable
      });
    } catch (e) {
      // Silently fail - default theme is already applied
    }
  })();
})();
`;

