/**
 * Companies API
 * API client for commercial companies endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Company {
  id: number;
  name: string;
  parent_company_id: number | null;
  parent_company_name?: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  is_client: boolean;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  contacts_count?: number;
  projects_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  name: string;
  parent_company_id?: number | null;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  is_client?: boolean;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
}

export interface CompanyUpdate extends Partial<CompanyCreate> {}

/**
 * Companies API client
 */
export const companiesAPI = {
  /**
   * Get list of companies with pagination
   * Uses cache-busting to ensure fresh data
   */
  list: async (
    skip = 0,
    limit = 100,
    is_client?: boolean,
    country?: string,
    search?: string
  ): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>('/v1/commercial/companies', {
      params: {
        skip,
        limit,
        is_client,
        country,
        search,
        _t: Date.now(), // Cache-busting timestamp
      },
    });

    const data = extractApiData<Company[] | { items: Company[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Company[] }).items;
    }
    return [];
  },

  /**
   * Get a company by ID
   */
  get: async (companyId: number): Promise<Company> => {
    const response = await apiClient.get<Company>(`/v1/commercial/companies/${companyId}`);
    const data = extractApiData<Company>(response);
    if (!data) {
      throw new Error(`Company not found: ${companyId}`);
    }
    return data;
  },

  /**
   * Create a new company
   */
  create: async (company: CompanyCreate): Promise<Company> => {
    const response = await apiClient.post<Company>('/v1/commercial/companies', company);
    const data = extractApiData<Company>(response);
    if (!data) {
      throw new Error('Failed to create company: no data returned');
    }
    return data;
  },

  /**
   * Update a company
   */
  update: async (companyId: number, company: CompanyUpdate): Promise<Company> => {
    const response = await apiClient.put<Company>(`/v1/commercial/companies/${companyId}`, company);
    const data = extractApiData<Company>(response);
    if (!data) {
      throw new Error('Failed to update company: no data returned');
    }
    return data;
  },

  /**
   * Delete a company
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/commercial/companies/${id}`);
  },

  /**
   * Import companies from Excel
   */
  import: async (file: File): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    data: Company[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      data: Company[];
    }>('/v1/commercial/companies/import', formData, {
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
   * Export companies to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      // Use axios directly for blob responses
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;

      const response = await axios.get(`${apiUrl}/api/v1/commercial/companies/export`, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? TokenStorage.getToken() || '' : ''}`,
        },
      });

      if (response.status >= 400) {
        const text = await (response.data as Blob).text();
        let errorData: any;
        try {
          errorData = JSON.parse(text);
        } catch (parseError) {
          errorData = { detail: text || 'Export failed' };
        }

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
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          let errorData: any;
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            errorData = { detail: text || 'Export failed' };
          }
          error.response.data = errorData;
        } catch (parseError) {
          error.response.data = { detail: 'Erreur lors de l\'export' };
        }
      }
      throw error;
    }
  },

  /**
   * Download company import template (Excel only)
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadCompanyTemplate } = await import('@/lib/utils/generateCompanyTemplate');
    downloadCompanyTemplate();
  },
};
