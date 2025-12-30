/**
 * Projects Module API
 * Unified API client for project operations
 * 
 * This module provides a unified interface for all project operations.
 * Projects API is already available via projectsAPI from the main API.
 */

// Re-export projects API if it exists, or create unified interface
// Note: Projects API might be exported from the main api.ts file
export const projectsAPI = {
  // This will be populated when projects API client is created
  // For now, projects are accessed via the main API client
};
