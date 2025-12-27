/**
 * Inline script to apply theme before React hydration
 * This prevents FOUC (Flash of Unstyled Content) on hard refresh
 * 
 * IMPORTANT: This script must execute IMMEDIATELY and SYNCHRONOUSLY
 * to prevent any color flash. It applies default colors first, then
 * loads the actual theme asynchronously.
 */

export const themeInlineScript = `
(function() {
  'use strict';
  
  // Execute immediately - don't wait for DOMContentLoaded
  // This ensures colors are applied before any CSS is rendered
  
  // Function to generate color shades using HSL-based approach (preserves hue)
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
    
    function rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) {
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
          h = ((b - r) / d + 2) / 6;
        } else {
          h = ((r - g) / d + 4) / 6;
        }
      }
      return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    function hslToRgb(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = function(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }
    
    const rgb = hexToRgb(hex);
    if (!rgb) return {};
    
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const baseLightness = hsl.l;
    const baseSaturation = hsl.s;
    const baseHue = hsl.h;
    
    function generateShade(targetLightness) {
      // Improved saturation adjustment for better contrast
      // Ensures lighter shades maintain minimum saturation for visibility
      var adjustedSaturation = baseSaturation;
      if (targetLightness > baseLightness) {
        // Lighter shades: maintain minimum saturation for contrast
        // For very light shades (90+), maintain higher saturation for better contrast
        if (targetLightness >= 90) {
          // Keep at least 30% saturation for very light shades to ensure visibility
          var reduction = (targetLightness - baseLightness) / 200; // Even less aggressive reduction
          adjustedSaturation = Math.max(30, baseSaturation * (1 - reduction * 0.5)); // Minimum 30% saturation
        } else {
          // For medium-light shades, reduce more gradually
          var reduction = (targetLightness - baseLightness) / 150;
          adjustedSaturation = Math.max(25, baseSaturation * (1 - reduction)); // Minimum 25% saturation
        }
      } else {
        // Darker shades: increase saturation for richer colors
        adjustedSaturation = Math.min(100, baseSaturation * (1 + (baseLightness - targetLightness) / 150));
      }
      var shadeRgb = hslToRgb(baseHue, adjustedSaturation, targetLightness);
      return rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b);
    }
    
    // Improved lightness values for better contrast
    // Increased gaps between shades for better contrast
    const shades = {
      50: generateShade(98),   // Very light (increased for maximum contrast)
      100: generateShade(93),  // Light (increased gap from 50)
      200: generateShade(86),  // Lighter (increased gap from 100)
      300: generateShade(76),  // Light (increased gap from 200)
      400: generateShade(66),  // Medium-light (increased gap from 300)
      500: hex,                // Base color
      600: generateShade(46),  // Medium-dark (increased gap from 500)
      700: generateShade(36),  // Dark (increased gap from 600)
      800: generateShade(26),  // Darker (increased gap from 700)
      900: generateShade(16),  // Very dark (increased gap from 800)
      950: generateShade(9)    // Darkest (increased gap from 900)
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
      // Also update body background to use CSS variable to prevent overlay issues
      if (document.body) {
        document.body.style.backgroundColor = 'var(--color-background)';
      }
    }
    if (colorsConfig.foreground) {
      root.style.setProperty('--color-foreground', colorsConfig.foreground);
      // Also update body color to use CSS variable
      if (document.body) {
        document.body.style.color = 'var(--color-foreground)';
      }
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
    
    // Apply fonts - Only set CSS variables, don't modify body directly to avoid hydration issues
    if (config.font_family) {
      const fontFamily = config.font_family.trim();
      root.style.setProperty('--font-family', fontFamily + ', sans-serif');
      root.style.setProperty('--font-family-heading', fontFamily + ', sans-serif');
      root.style.setProperty('--font-family-subheading', fontFamily + ', sans-serif');
      // Don't modify document.body directly - let CSS handle it via var(--font-family)
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
      // Don't modify document.body directly - let CSS handle it via var(--font-family)
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
        primary_color: '#2563eb',  // Deep professional blue
        secondary_color: '#6366f1',  // Elegant indigo
        danger_color: '#dc2626',  // Refined red
        warning_color: '#d97706',  // Warm amber
        info_color: '#0891b2',  // Professional cyan
        success_color: '#059669',  // Professional green
        colors: {
          primary: '#2563eb',
          secondary: '#6366f1',
          danger: '#dc2626',
          destructive: '#dc2626',
          warning: '#d97706',
          info: '#0891b2',
          success: '#059669',
          background: '#ffffff',
          foreground: '#0f172a',  // Slate 900 for better contrast
          muted: '#f1f5f9',  // Slate 100
          mutedForeground: '#64748b',  // Slate 500
          border: '#e2e8f0',  // Slate 200
          input: '#ffffff',
          ring: '#2563eb'
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
      
      // Ensure body background uses CSS variable to prevent overlay issues
      // This must happen after applyThemeConfig sets the CSS variables
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.backgroundColor = 'var(--color-background, #ffffff)';
        document.body.style.color = 'var(--color-foreground, #0f172a)';
      }
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
        // Try to get from data attribute on html element (priority method)
        if (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.apiUrl) {
          apiUrl = document.documentElement.dataset.apiUrl;
        }
        // Also try window.__NEXT_DATA__ as fallback
        else if (window.__NEXT_DATA__ && window.__NEXT_DATA__.env && window.__NEXT_DATA__.env.NEXT_PUBLIC_API_URL) {
          apiUrl = window.__NEXT_DATA__.env.NEXT_PUBLIC_API_URL;
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
      // Note: This endpoint is public and doesn't require authentication
      if (!apiUrl || apiUrl === 'http://localhost:8000') {
        // In production, try to detect API URL from current origin
        if (typeof window !== 'undefined' && window.location) {
          var origin = window.location.origin;
          // If we're on Railway or similar, try to construct API URL
          // This is a fallback - ideally apiUrl should be set via data-api-url attribute
          if (origin.includes('railway') || origin.includes('vercel') || origin.includes('netlify')) {
            // Try common patterns - this might need adjustment based on your setup
            // For now, keep using the provided apiUrl or fallback
          }
        }
      }
      
      fetch(apiUrl + '/api/v1/themes/active', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'omit', // Don't send cookies - this is a public endpoint
        cache: 'no-cache'
      })
      .then(function(response) {
        if (response.ok) {
          return response.json();
        }
        // If response is not ok, log for debugging but don't throw
        console.warn('[Theme] Failed to load theme from API:', response.status, response.statusText);
        throw new Error('Failed to load theme: ' + response.status);
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
        // Only log in development
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
          console.warn('[Theme] Could not load theme from API, using defaults:', error);
        }
      });
    } catch (e) {
      // Silently fail - default theme is already applied
    }
  })();
})();
`;

