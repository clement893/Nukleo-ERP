/**
 * React Query hooks for Projects Module
 * Unified hooks for all project operations
 */

// Note: Projects currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Projects API
export { projectsAPI } from '../api/projects';

// Unified query keys for projects module
export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; status?: string }) =>
    [...projectsKeys.lists(), filters] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectsKeys.details(), id] as const,
};
