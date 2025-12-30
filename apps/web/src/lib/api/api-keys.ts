/**
 * API Keys API
 * API client for managing API keys
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface APIKeyCreate {
  name: string;
  description?: string;
  rotation_policy?: string; // 'manual', '30d', '60d', '90d', '180d', '365d'
  expires_in_days?: number; // Optional expiration in days (1-3650)
}

export interface APIKeyResponse {
  id: number;
  name: string;
  key: string; // Only shown once on creation
  key_prefix: string;
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  rotation_policy: string;
  next_rotation_at?: string | null;
}

export interface APIKeyListResponse {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  rotation_policy: string;
  next_rotation_at?: string | null;
  rotation_count: number;
  usage_count: number;
  is_active: boolean;
}

export interface APIKeyRotateResponse {
  old_key_id: number;
  new_key: APIKeyResponse;
  message: string;
}

/**
 * API Keys API client
 */
export const apiKeysAPI = {
  /**
   * Generate a new API key
   */
  create: async (data: APIKeyCreate): Promise<APIKeyResponse> => {
    const response = await apiClient.post<APIKeyResponse>('/v1/api-keys/generate', {
      name: data.name,
      description: data.description,
      rotation_policy: data.rotation_policy || 'manual',
      expires_in_days: data.expires_in_days,
    });
    const result = extractApiData<APIKeyResponse>(response);
    if (!result) {
      throw new Error('Failed to create API key: no data returned');
    }
    return result;
  },

  /**
   * List all API keys for the current user
   */
  list: async (includeInactive = false): Promise<APIKeyListResponse[]> => {
    const response = await apiClient.get<APIKeyListResponse[]>('/v1/api-keys/list', {
      params: { include_inactive: includeInactive },
    });
    const data = extractApiData<APIKeyListResponse[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Rotate an API key (creates new key, deactivates old one)
   */
  rotate: async (keyId: number): Promise<APIKeyRotateResponse> => {
    const response = await apiClient.post<APIKeyRotateResponse>(`/v1/api-keys/${keyId}/rotate`);
    const result = extractApiData<APIKeyRotateResponse>(response);
    if (!result) {
      throw new Error('Failed to rotate API key: no data returned');
    }
    return result;
  },

  /**
   * Revoke an API key
   */
  revoke: async (keyId: number, reason?: string): Promise<void> => {
    await apiClient.delete(`/v1/api-keys/${keyId}`, {
      params: reason ? { reason } : undefined,
    });
  },
};
