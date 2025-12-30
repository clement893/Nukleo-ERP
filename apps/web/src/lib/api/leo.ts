/**
 * Leo Module API
 * Unified API client for Leo AI assistant operations
 * 
 * This module provides a unified interface for all Leo operations:
 * - Conversations
 * - Messages
 * - Queries
 * - Documentation
 */

// Import Leo Agent API
import {
  leoAgentAPI,
  type LeoConversation,
  type LeoMessage,
  type LeoConversationListResponse,
  type LeoMessageListResponse,
  type LeoQueryRequest,
  type LeoQueryResponse,
} from './leo-agent';

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
  LeoConversation,
  LeoMessage,
  LeoConversationListResponse,
  LeoMessageListResponse,
  LeoQueryRequest,
  LeoQueryResponse,
  LeoDocumentation,
  LeoDocumentationCreate,
  LeoDocumentationUpdate,
  LeoDocumentationListResponse,
  DocumentationCategory,
  DocumentationPriority,
};

// Re-export APIs
export { leoAgentAPI, leoDocumentationAPI };

/**
 * Unified Leo API
 * Provides access to all Leo operations through a single interface
 */
export const leoAPI = {
  agent: leoAgentAPI,
  documentation: leoDocumentationAPI,
};
