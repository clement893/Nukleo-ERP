/**
 * Themes Module API
 * Unified API client for theme operations
 * 
 * This module provides a unified interface for all theme operations:
 * - Themes
 * - Theme Fonts
 */

// Re-export Theme API as unified interface
export * from './theme';

// Import for unified interface
import * as themeAPI from './theme';

/**
 * Unified Themes API
 * Provides access to all theme operations through a single interface
 */
export const themesAPI = {
  themes: themeAPI,
  fonts: themeAPI, // Theme fonts are part of theme API
};
