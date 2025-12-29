/**
 * Leo Documentation API
 * API client for Leo AI assistant documentation endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export enum DocumentationCategory {
  GENERAL = 'general',
  ERP_FEATURES = 'erp_features',
  PROJECTS = 'projects',
  COMMERCIAL = 'commercial',
  TEAMS = 'teams',
  CLIENTS = 'clients',
  PROCEDURES = 'procedures',
  POLICIES = 'policies',
  CUSTOM = 'custom',
}

export enum DocumentationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface LeoDocumentation {
  id: number;
  title: string;
  content: string;
  category: DocumentationCategory;
  priority: DocumentationPriority;
  is_active: boolean;
  order: number;
  created_by_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeoDocumentationCreate {
  title: string;
  content: string;
  category?: DocumentationCategory;
  priority?: DocumentationPriority;
  is_active?: boolean;
  order?: number;
}

export interface LeoDocumentationUpdate {
  title?: string;
  content?: string;
  category?: DocumentationCategory;
  priority?: DocumentationPriority;
  is_active?: boolean;
  order?: number;
}

export interface LeoDocumentationListResponse {
  items: LeoDocumentation[];
  total: number;
  skip: number;
  limit: number;
}

export interface LeoDocumentationContext {
  context: string;
  total_docs: number;
  categories: string[];
}

/**
 * Leo Documentation API client
 */
export const leoDocumentationAPI = {
  /**
   * List all documentation entries
   */
  list: async (params?: {
    skip?: number;
    limit?: number;
    category?: DocumentationCategory;
    priority?: DocumentationPriority;
    is_active?: boolean;
  }): Promise<LeoDocumentationListResponse> => {
    const response = await apiClient.get<LeoDocumentationListResponse>('/v1/leo-documentation', {
      params: { skip: 0, limit: 100, ...params },
    });
    return extractApiData(response);
  },

  /**
   * Get a specific documentation entry
   */
  get: async (docId: number): Promise<LeoDocumentation> => {
    const response = await apiClient.get<LeoDocumentation>(`/v1/leo-documentation/${docId}`);
    const data = extractApiData(response);
    if (!data) {
      throw new Error(`Documentation entry ${docId} not found`);
    }
    return data;
  },

  /**
   * Create a new documentation entry
   */
  create: async (data: LeoDocumentationCreate): Promise<LeoDocumentation> => {
    const response = await apiClient.post<LeoDocumentation>('/v1/leo-documentation', data);
    const result = extractApiData(response);
    if (!result) {
      throw new Error('Failed to create documentation: no data returned');
    }
    return result;
  },

  /**
   * Update an existing documentation entry
   */
  update: async (docId: number, data: LeoDocumentationUpdate): Promise<LeoDocumentation> => {
    const response = await apiClient.put<LeoDocumentation>(`/v1/leo-documentation/${docId}`, data);
    const result = extractApiData(response);
    if (!result) {
      throw new Error('Failed to update documentation: no data returned');
    }
    return result;
  },

  /**
   * Delete a documentation entry
   */
  delete: async (docId: number): Promise<void> => {
    await apiClient.delete(`/v1/leo-documentation/${docId}`);
  },

  /**
   * Get active documentation formatted for Leo's context
   */
  getActiveContext: async (): Promise<LeoDocumentationContext> => {
    const response = await apiClient.get<LeoDocumentationContext>('/v1/leo-documentation/active/context');
    return extractApiData(response);
  },
};
