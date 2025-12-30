/**
 * Réseau Contacts API
 * API client for network module contacts endpoints
 * 
 * For now, uses the same commercial endpoints to maintain compatibility.
 * TODO: Migrate to /v1/reseau/contacts when backend endpoints are created.
 */

import { apiClient } from './client';
import { extractApiData } from './utils';
// Re-use types from contacts API to avoid duplication
import type { Contact, ContactCreate, ContactUpdate } from './contacts';

/**
 * Réseau Contacts API client
 * Currently uses commercial endpoints but with separate namespace
 */
export const reseauContactsAPI = {
  /**
   * Get list of contacts with pagination
   * Uses cache-busting to ensure fresh data
   */
  list: async (skip = 0, limit = 100): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/v1/reseau/contacts', {
      params: { 
        skip, 
        limit,
        _t: Date.now(), // Cache-busting timestamp
      },
    });
    
    const data = extractApiData<Contact[] | { items: Contact[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Contact[] }).items;
    }
    return [];
  },

  /**
   * Get a contact by ID
   */
  get: async (contactId: number): Promise<Contact> => {
    const response = await apiClient.get<Contact>(`/v1/reseau/contacts/${contactId}`);
    const data = extractApiData<Contact>(response);
    if (!data) {
      throw new Error(`Contact not found: ${contactId}`);
    }
    return data;
  },

  /**
   * Create a new contact
   */
  create: async (contact: ContactCreate): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/v1/reseau/contacts', contact);
    const data = extractApiData<Contact>(response);
    if (!data) {
      throw new Error('Failed to create contact: no data returned');
    }
    return data;
  },

  /**
   * Update a contact
   */
  update: async (contactId: number, contact: ContactUpdate): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/v1/reseau/contacts/${contactId}`, contact);
    const data = extractApiData<Contact>(response);
    if (!data) {
      throw new Error('Failed to update contact: no data returned');
    }
    return data;
  },

  /**
   * Delete a contact
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/reseau/contacts/${id}`);
  },

  /**
   * Delete all contacts
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>('/v1/reseau/contacts/bulk');
    return extractApiData(response) || { message: 'No contacts deleted', deleted_count: 0 };
  },

  /**
   * Import contacts from Excel or ZIP (Excel + photos)
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
    data: Contact[];
    photos_uploaded?: number;
    import_id?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = importId 
      ? `/v1/reseau/contacts/import?import_id=${encodeURIComponent(importId)}`
      : '/v1/reseau/contacts/import';
    
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
      data: Contact[];
      photos_uploaded?: number;
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
      photos_uploaded: 0,
    };
  },

  /**
   * Export contacts to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      // Use axios directly for blob responses to get full AxiosResponse object
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;
      
      const response = await axios.get(`${apiUrl}/api/v1/reseau/contacts/export`, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? TokenStorage.getToken() || '' : ''}`,
        },
      });
      
      // Check if response is actually an error (blob containing JSON error)
      if (response.status >= 400) {
        // Try to parse blob as JSON error
        const text = await (response.data as Blob).text();
        let errorData: any;
        try {
          errorData = JSON.parse(text);
        } catch (parseError) {
          // If not JSON, create error object with text
          errorData = { detail: text || 'Export failed' };
        }
        
        // Create AxiosError-like object
        const axiosError = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
            headers: response.headers,
            config: response.config,
          },
          config: response.config,
          isAxiosError: true,
          name: 'AxiosError',
          message: `Request failed with status code ${response.status}`,
        };
        
        throw axiosError;
      }
      
      return response.data as Blob;
    } catch (error: any) {
      // If error response is a blob, convert it to JSON first
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          let errorData: any;
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            // If not JSON, create error object with text
            errorData = { detail: text || 'Export failed' };
          }
          // Replace blob with parsed JSON
          error.response.data = errorData;
        } catch (parseError) {
          // If parsing fails, create a generic error
          error.response.data = { detail: 'Erreur lors de l\'export' };
        }
      }
      throw error;
    }
  },

  /**
   * Download contact import template (Excel only)
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadContactTemplate } = await import('@/lib/utils/generateContactTemplate');
    downloadContactTemplate();
  },

  /**
   * Download contact import ZIP template (Excel + instructions + photos folder)
   * This is a client-side function, not an API call
   */
  downloadZipTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadContactZipTemplate } = await import('@/lib/utils/generateContactTemplate');
    await downloadContactZipTemplate();
  },
};

// Re-export types for convenience
export type { Contact, ContactCreate, ContactUpdate };
