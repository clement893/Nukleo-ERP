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

// Re-export Leo Agent API
export {
  leoAgentAPI,
  type LeoConversation,
  type LeoMessage,
  type LeoConversationListResponse,
  type LeoMessageListResponse,
  type LeoQueryRequest,
  type LeoQueryResponse,
} from './leo-agent';

// Re-export Leo Documentation API
export {
  leoDocumentationAPI,
  type LeoDocumentation,
  type LeoDocumentationCreate,
  type LeoDocumentationUpdate,
  type LeoDocumentationListResponse,
  type DocumentationCategory,
  type DocumentationPriority,
} from './leo-documentation';

/**
 * Unified Leo API
 * Provides access to all Leo operations through a single interface
 */
export const leoAPI = {
  agent: leoAgentAPI,
  documentation: leoDocumentationAPI,
};
