/**
 * Clients API
 * API client for clients endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ClientType = 'person' | 'company';

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string | null;
  type: ClientType;
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
  user_id: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  project_count?: number;
  total_budget?: number;
}

export interface ClientCreate {
  first_name?: string;
  last_name?: string;
  company_name?: string | null;
  type?: ClientType;
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
  list: async (skip = 0, limit = 1000, filters?: { status?: string; search?: string; type?: string }): Promise<Client[]> => {
    const skipNum = Number(skip);
    const limitNum = Number(limit);
    
    const params = { 
      skip: skipNum, 
      limit: limitNum,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.type && { type: filters.type }),
    };
    
    try {
      const response = await apiClient.get<Client[]>('/v1/projects/clients', { params });
      const data = extractApiData<Client[] | { items: Client[] }>(response);
      
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'items' in data) {
        return (data as { items: Client[] }).items;
      }
      return [];
    } catch (error: any) {
      console.error('[ClientsAPI] Error in list():', error);
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
    etape?: string | null;
    annee_realisation?: string | null;
    budget?: number | null;
    created_at: string;
    updated_at: string;
  }>> => {
    const response = await apiClient.get<Array<{
      id: number;
      name: string;
      description?: string | null;
      status: string;
      client_id?: number | null;
      etape?: string | null;
      annee_realisation?: string | null;
      budget?: number | null;
      created_at: string;
      updated_at: string;
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
