/**
 * Content/CMS Module API
 * Unified API client for content management operations
 * 
 * This module provides a unified interface for all content operations:
 * - Posts (Blog posts)
 * - Pages (CMS pages)
 * - Media (Media library)
 * - Forms (Dynamic forms)
 * - Menus (Navigation menus)
 * - Templates (Content templates)
 * - Tags (Tags and categories)
 */

// Import for unified interface
import { pagesAPI } from './pages';
import { postsAPI } from './posts';
import { formsAPI, menusAPI } from '../api';
import { mediaAPI } from './media';

// Re-export individual APIs
export { pagesAPI } from './pages';
export { postsAPI } from './posts';
export { formsAPI } from '../api'; // From main api.ts
export { menusAPI } from '../api'; // From main api.ts
export { mediaAPI } from './media';

/**
 * Unified Content API
 * Provides access to all content operations through a single interface
 */
export const contentAPI = {
  posts: postsAPI,
  pages: pagesAPI,
  media: mediaAPI,
  forms: formsAPI,
  menus: menusAPI,
  // Templates and tags APIs can be added when available
};
