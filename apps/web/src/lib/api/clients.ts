/**
 * Clients API
 * API client for project clients endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export interface Client {
  id: number;
  company_id: number;
  company_name: string | null;
  company_logo_url: string | null;
  status: ClientStatus;
  responsible_id: number | null;
  responsible_name: string | null;
  notes: string | null;
  comments: string | null;
  portal_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  company_id?: number | null;
  company_name?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_country?: string | null;
  company_website?: string | null;
  company_description?: string | null;
  status?: ClientStatus;
  responsible_id?: number | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
}

export interface ClientUpdate {
  status?: ClientStatus;
  responsible_id?: number | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
}

/**
 * Clients API client
 */
export const clientsAPI = {
  /**
   * Get list of clients
   */
  list: async (
    skip = 0,
    limit = 100,
    status?: ClientStatus,
    responsible_id?: number,
    search?: string
  ): Promise<Client[]> => {
    // Ensure skip and limit are valid integers (not strings, NaN, or undefined)
    const skipInt = Math.max(0, Math.floor(Number(skip)) || 0);
    const limitInt = Math.max(1, Math.min(Math.floor(Number(limit)) || 100, 1000));
    
    const params: Record<string, string | number> = { 
      skip: skipInt, 
      limit: limitInt,
    };
    
    // Only add optional parameters if they have valid values
    if (status) params.status = status;
    if (responsible_id !== undefined && responsible_id !== null && !isNaN(Number(responsible_id))) {
      params.responsible_id = Number(responsible_id);
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get<Client[]>('/v1/projects/clients', { 
      params,
    });
    const data = extractApiData<Client[]>(response);
    return Array.isArray(data) ? data : [];
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
  delete: async (clientId: number): Promise<void> => {
    await apiClient.delete(`/v1/projects/clients/${clientId}`);
  },

  /**
   * Import clients from Excel/ZIP file
   */
  import: async (file: File, importId?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const params: Record<string, string> = {};
    if (importId) {
      params.import_id = importId;
    }

    const response = await apiClient.post('/v1/projects/clients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params,
    });
    return extractApiData(response);
  },

  /**
   * Export clients to Excel
   */
  export: async (): Promise<Blob> => {
    const response = await apiClient.get('/v1/projects/clients/export', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * Get import logs URL for SSE
   */
  getImportLogsUrl: (importId: string): string => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    return `${baseURL}/v1/projects/clients/import/${importId}/logs`;
  },

  /**
   * Download client import template (Excel only)
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadClientTemplate } = await import('@/lib/utils/generateClientTemplate');
    downloadClientTemplate();
  },

  /**
   * Download client import ZIP template (Excel + instructions + logos folder)
   * This is a client-side function, not an API call
   */
  downloadZipTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadClientZipTemplate } = await import('@/lib/utils/generateClientTemplate');
    await downloadClientZipTemplate();
  },
};
