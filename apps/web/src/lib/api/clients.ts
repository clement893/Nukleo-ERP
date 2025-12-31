/**
 * Clients API
 * API client for clients (companies) endpoints
 * Simplified for companies only
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Client {
  id: number;
  company_name: string;
  type: string;
  user_id: number;
  portal_url: string | null;
  status: ClientStatus;
  project_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  company_name: string;
  type?: string;
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
  list: async (skip = 0, limit = 1000, filters?: { status?: string; search?: string }): Promise<Client[]> => {
    const skipNum = Number(skip);
    const limitNum = Number(limit);
    
    const params = { 
      skip: skipNum, 
      limit: limitNum,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
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
      created_at: string;
      updated_at: string;
    }>>(`/v1/projects/clients/${clientId}/projects`);
    return extractApiData(response) || [];
  },

  /**
   * Create/update portal URL for a client
   */
  createPortal: async (clientId: number, portalUrl: string): Promise<Client> => {
    const response = await apiClient.post<Client>(
      `/v1/projects/clients/${clientId}/portal`,
      null,
      { params: { portal_url: portalUrl } }
    );
    const data = extractApiData<Client>(response);
    if (!data) {
      throw new Error('Failed to create portal: no data returned');
    }
    return data;
  },

  /**
   * Get contacts for a client (from commercial contacts API)
   */
  getContacts: async (clientId: number): Promise<Array<{
    id: number;
    first_name: string;
    last_name: string;
    company_id: number | null;
    email: string | null;
    phone: string | null;
    [key: string]: unknown;
  }>> => {
    // Use commercial contacts API filtered by company_id
    // Note: This assumes clients map to companies in the commercial module
    const response = await apiClient.get<Array<{
      id: number;
      first_name: string;
      last_name: string;
      company_id: number | null;
      email: string | null;
      phone: string | null;
      [key: string]: unknown;
    }>>('/v1/commercial/contacts', { params: { company_id: clientId } });
    return extractApiData(response) || [];
  },
};
