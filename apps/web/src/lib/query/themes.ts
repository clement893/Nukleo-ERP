/**
 * React Query hooks for Themes Module
 * Unified hooks for all theme operations
 */

// Note: Themes currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Themes API
export { themesAPI } from '../api/themes';
export * from '../api/theme';

// Unified query keys for themes module
export const themesKeys = {
  all: ['themes'] as const,
  active: () => [...themesKeys.all, 'active'] as const,
  lists: () => [...themesKeys.all, 'list'] as const,
  list: () => [...themesKeys.lists()] as const,
  details: () => [...themesKeys.all, 'detail'] as const,
  detail: (id: number) => [...themesKeys.details(), id] as const,
  fonts: () => [...themesKeys.all, 'fonts'] as const,
  font: (id: number) => [...themesKeys.fonts(), id] as const,
};
