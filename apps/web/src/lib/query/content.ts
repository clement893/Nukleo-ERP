/**
 * React Query hooks for Content Module
 * Unified hooks for all content operations
 */

// Note: Content currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Content API
export { contentAPI, pagesAPI, mediaAPI, formsAPI, menusAPI } from '../api/content';

// Unified query keys for content module
export const contentKeys = {
  all: ['content'] as const,
  posts: () => [...contentKeys.all, 'posts'] as const,
  post: (id: number) => [...contentKeys.posts(), id] as const,
  pages: () => [...contentKeys.all, 'pages'] as const,
  page: (slug: string) => [...contentKeys.pages(), slug] as const,
  media: () => [...contentKeys.all, 'media'] as const,
  mediaItem: (id: string) => [...contentKeys.media(), id] as const,
  forms: () => [...contentKeys.all, 'forms'] as const,
  form: (id: number) => [...contentKeys.forms(), id] as const,
  menus: () => [...contentKeys.all, 'menus'] as const,
  menu: (id: number) => [...contentKeys.menus(), id] as const,
  templates: () => [...contentKeys.all, 'templates'] as const,
  template: (id: number) => [...contentKeys.templates(), id] as const,
  tags: () => [...contentKeys.all, 'tags'] as const,
  tag: (id: number) => [...contentKeys.tags(), id] as const,
};
