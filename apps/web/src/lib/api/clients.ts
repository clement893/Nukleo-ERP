/**
 * Clients API
 * API client for project clients endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export enum ClientStatus {
  ACTIVE = 'actif',
  INACTIVE = 'inactif',
  MAINTENANCE = 'maintenance',
}

export interface Client {
  id: number;
  company_id: number;
  company_name: string | null;
  company_logo_url: string | null;
  status: ClientStatus;
  responsable_id: number | null;
  responsable_name: string | null;
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
  responsable_id?: number | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
}

export interface ClientUpdate {
  status?: ClientStatus;
  responsable_id?: number | null;
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
    responsable_id?: number,
    search?: string
  ): Promise<Client[]> => {
    // Ensure skip and limit are valid integers (not strings, NaN, or undefined)
    const skipInt = Math.max(0, Math.floor(Number(skip)) || 0);
    const limitInt = Math.max(1, Math.min(Math.floor(Number(limit)) || 100, 1000));
    
    // Build query string manually to ensure proper formatting
    const queryParams = new URLSearchParams();
    queryParams.append('skip', String(skipInt));
    queryParams.append('limit', String(limitInt));
    
    // Only add optional parameters if they have valid values
    if (status) queryParams.append('status', status);
    if (responsable_id !== undefined && responsable_id !== null && !isNaN(Number(responsable_id))) {
      queryParams.append('responsable_id', String(responsable_id));
    }
    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }

    const queryString = queryParams.toString();
    const url = `/v1/projects/clients${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<Client[]>(url);
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
   * Delete all clients
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>('/v1/projects/clients/bulk');
    return extractApiData(response) || { message: 'No clients deleted', deleted_count: 0 };
  },

  /**
   * Get total count of clients in the database
   */
  count: async (): Promise<number> => {
    const response = await apiClient.get<{ total: number }>('/v1/projects/clients/count');
    const data = extractApiData<{ total: number }>(response);
    return data?.total || 0;
  },

  /**
   * Import clients from Excel or ZIP (Excel + logos)
   */
  import: async (file: File, importId?: string): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    warnings?: Array<{ 
      row: number; 
      type: string; 
      message: string; 
      data?: Record<string, unknown> 
    }>;
    data: Client[];
    logos_uploaded?: number;
    import_id?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = importId 
      ? `/v1/projects/clients/import?import_id=${encodeURIComponent(importId)}`
      : '/v1/projects/clients/import';
    
    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{ 
        row: number; 
        type: string; 
        message: string; 
        data?: Record<string, unknown> 
      }>;
      data: Client[];
      logos_uploaded?: number;
      import_id?: string;
    }>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return extractApiData(response) || {
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      errors: [],
      warnings: [],
      data: [],
      logos_uploaded: 0,
    };
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
