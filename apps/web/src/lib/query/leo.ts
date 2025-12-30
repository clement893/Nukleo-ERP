/**
 * React Query hooks for Leo Module
 * Unified hooks for all Leo operations
 */

// Note: Leo currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Leo API
export { leoAPI, leoAgentAPI, leoDocumentationAPI } from '../api/leo';
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
} from '../api/leo';

// Unified query keys for Leo module
export const leoKeys = {
  all: ['leo'] as const,
  conversations: () => [...leoKeys.all, 'conversations'] as const,
  conversation: (id: number) => [...leoKeys.conversations(), id] as const,
  messages: (conversationId: number) => [...leoKeys.conversation(conversationId), 'messages'] as const,
  documentation: () => [...leoKeys.all, 'documentation'] as const,
  doc: (id: number) => [...leoKeys.documentation(), id] as const,
};
