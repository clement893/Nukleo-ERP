/**
 * Projects Module API
 * Unified API client for project operations
 * 
 * This module provides a unified interface for all project operations.
 * Projects API is already available via projectsAPI from the main API.
 */

// Import projectsAPI from the main API (it's exported from '../api')
// Note: We re-export it here for consistency with other modules
import { projectsAPI as mainProjectsAPI } from '../api';

// Re-export as unified projects API
export const projectsAPI = mainProjectsAPI;
