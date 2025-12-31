/**
 * Clients API
 * API client for clients endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export type ClientStatus = 'active' | 'inactive' | 'maintenance';

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  birthday?: string | null; // ISO date string
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  birthday?: string | null; // ISO date string (YYYY-MM-DD)
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
  status?: ClientStatus;
}

export interface ClientUpdate extends Partial<ClientCreate> {}

/**
 * Clients API client
 */
export const clientsAPI = {
  /**
   * Get list of clients with pagination
   */
  list: async (skip = 0, limit = 100, filters?: { status?: string; search?: string }): Promise<Client[]> => {
    const skipNum = Number(skip);
    const limitNum = Number(limit);
    
    // Log parameters before sending
    console.log('[ClientsAPI] list() called with:', {
      skip: { original: skip, type: typeof skip, converted: skipNum, isNaN: isNaN(skipNum) },
      limit: { original: limit, type: typeof limit, converted: limitNum, isNaN: isNaN(limitNum) },
      filters,
    });
    
    const params = { 
      skip: skipNum, 
      limit: limitNum,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
    };
    
    console.log('[ClientsAPI] Sending request with params:', params, 'Types:', {
      skip: typeof params.skip,
      limit: typeof params.limit,
    });
    
    try {
      const response = await apiClient.get<Client[]>('/v1/projects/clients', { params });
      console.log('[ClientsAPI] Response received:', {
        success: response.success,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
      });
    
      const data = extractApiData<Client[] | { items: Client[] }>(response);
      console.log('[ClientsAPI] Extracted data:', {
        isArray: Array.isArray(data),
        hasItems: data && typeof data === 'object' && 'items' in data,
        dataType: typeof data,
      });
      
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'items' in data) {
        return (data as { items: Client[] }).items;
      }
      return [];
    } catch (error: any) {
      console.error('[ClientsAPI] Error in list():', {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        params: { skip: skipNum, limit: limitNum, filters },
      });
      throw error;
    }
  },

  /**
   * Get a client by ID
   */
  get: async (clientId: number): Promise<Client> => {
    const response = await apiClient.get<Client>(`/v1/projects/clients/${clientId}`);
    const data = extractApiData<Client>(response);
    if (!data) {
      throw new Error(`Client not found: ${clientId}`);
    }
    return data;
  },

  /**
   * Create a new client
   */
  create: async (client: ClientCreate): Promise<Client> => {
    const response = await apiClient.post<Client>('/v1/projects/clients', client);
    const data = extractApiData<Client>(response);
    if (!data) {
      throw new Error('Failed to create client: no data returned');
    }
    return data;
  },

  /**
   * Update a client
   */
  update: async (clientId: number, client: ClientUpdate): Promise<Client> => {
    const response = await apiClient.put<Client>(`/v1/projects/clients/${clientId}`, client);
    const data = extractApiData<Client>(response);
    if (!data) {
      throw new Error('Failed to update client: no data returned');
    }
    return data;
  },

  /**
   * Delete a client
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/projects/clients/${id}`);
  },

  /**
   * Get projects for a client
   */
  getProjects: async (clientId: number): Promise<Array<{
    id: number;
    name: string;
    description?: string | null;
    status: string;
    client_id?: number | null;
  }>> => {
    const response = await apiClient.get<Array<{
      id: number;
      name: string;
      description?: string | null;
      status: string;
      client_id?: number | null;
    }>>(`/v1/projects/clients/${clientId}/projects`);
    return extractApiData(response) || [];
  },

  /**
   * Get contacts for a client
   */
  getContacts: async (clientId: number): Promise<Array<Record<string, unknown>>> => {
    const response = await apiClient.get<Array<Record<string, unknown>>>(`/v1/projects/clients/${clientId}/contacts`);
    return extractApiData(response) || [];
  },
};
