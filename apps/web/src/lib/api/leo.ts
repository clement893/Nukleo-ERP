/**
 * Leo Module API
 * Unified API client for Leo AI assistant operations
 * 
 * This module provides a unified interface for Leo documentation operations
 */

// Import Leo Documentation API
import {
  leoDocumentationAPI,
  type LeoDocumentation,
  type LeoDocumentationCreate,
  type LeoDocumentationUpdate,
  type LeoDocumentationListResponse,
  type DocumentationCategory,
  type DocumentationPriority,
} from './leo-documentation';

// Re-export types
export type {
  LeoDocumentation,
  LeoDocumentationCreate,
  LeoDocumentationUpdate,
  LeoDocumentationListResponse,
  DocumentationCategory,
  DocumentationPriority,
};

// Re-export APIs
export { leoDocumentationAPI };

// Unified Leo API object (for backward compatibility)
export const leoAPI = {
  documentation: leoDocumentationAPI,
};
