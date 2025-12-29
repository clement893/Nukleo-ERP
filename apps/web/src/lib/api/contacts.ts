/**
 * Contacts API
 * API client for commercial contacts endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  company_id: number | null;
  company_name?: string;
  position: string | null;
  circle: string | null;
  linkedin: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  birthday: string | null;
  language: string | null;
  employee_id: number | null;
  employee_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name: string;
  company_id?: number | null;
  position?: string | null;
  circle?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  birthday?: string | null;
  language?: string | null;
  employee_id?: number | null;
}

export interface ContactUpdate extends Partial<ContactCreate> {}

/**
 * Contacts API client
 */
export const contactsAPI = {
  /**
   * Get list of contacts with pagination
   * Uses cache-busting to ensure fresh data
   */
  list: async (skip = 0, limit = 100): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/v1/commercial/contacts', {
      params: { 
        skip, 
        limit,
        _t: Date.now(), // Cache-busting timestamp
      },
      // Headers temporairement retirés jusqu'au redéploiement du backend avec la config CORS mise à jour
      // headers: {
      //   'Cache-Control': 'no-cache, no-store, must-revalidate',
      //   'Pragma': 'no-cache',
      //   'Expires': '0',
      // },
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
    const response = await apiClient.get<Contact>(`/v1/commercial/contacts/${contactId}`);
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
    const response = await apiClient.post<Contact>('/v1/commercial/contacts', contact);
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
    const response = await apiClient.put<Contact>(`/v1/commercial/contacts/${contactId}`, contact);
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
    await apiClient.delete(`/v1/commercial/contacts/${id}`);
  },

  /**
   * Import contacts from Excel
   */
  import: async (file: File): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    data: Contact[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      data: Contact[];
    }>('/v1/commercial/contacts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return extractApiData(response) || {
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      errors: [],
      data: [],
    };
  },

  /**
   * Export contacts to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      const response = await apiClient.get('/v1/commercial/contacts/export', {
        responseType: 'blob',
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
   * Download contact import template
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadContactTemplate } = await import('@/lib/utils/generateContactTemplate');
    downloadContactTemplate();
  },
};
