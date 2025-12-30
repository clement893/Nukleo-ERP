/**
 * Leo Agent API
 * API client for Leo AI assistant conversations and messages
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface LeoConversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface LeoMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface LeoConversationListResponse {
  items: LeoConversation[];
  total: number;
  skip: number;
  limit: number;
}

export interface LeoMessageListResponse {
  items: LeoMessage[];
  total: number;
  conversation_id: number;
}

export interface LeoQueryRequest {
  message: string;
  conversation_id?: number | null;
  provider?: 'auto' | 'openai' | 'anthropic';
}

export interface LeoQueryResponse {
  content: string;
  conversation_id: number;
  message_id: number;
  provider: string;
  model?: string | null;
  usage?: Record<string, number> | null;
}

/**
 * Leo Agent API client
 */
export const leoAgentAPI = {
  /**
   * List conversations for the current user
   */
  listConversations: async (params?: {
    skip?: number;
    limit?: number;
  }): Promise<LeoConversationListResponse> => {
    const response = await apiClient.get<LeoConversationListResponse>('/v1/ai/leo/conversations', {
      params: { skip: 0, limit: 20, ...params },
    });
    return extractApiData(response);
  },

  /**
   * Get a specific conversation
   */
  getConversation: async (conversationId: number): Promise<LeoConversation> => {
    const response = await apiClient.get<LeoConversation>(`/v1/ai/leo/conversations/${conversationId}`);
    const data = extractApiData(response);
    if (!data) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    return data;
  },

  /**
   * Get messages for a conversation
   */
  getConversationMessages: async (conversationId: number): Promise<LeoMessageListResponse> => {
    const response = await apiClient.get<LeoMessageListResponse>(
      `/v1/ai/leo/conversations/${conversationId}/messages`
    );
    return extractApiData(response);
  },

  /**
   * Query Leo AI assistant
   */
  query: async (request: LeoQueryRequest): Promise<LeoQueryResponse> => {
    const response = await apiClient.post<LeoQueryResponse>('/v1/ai/leo/query', request);
    const result = extractApiData(response);
    if (!result) {
      throw new Error('Failed to get response from Leo: no data returned');
    }
    return result;
  },
};
