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
  parent_company_name?: string | null;
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
   */
  list: async (skip = 0, limit = 100, filters?: {
    is_client?: boolean;
    country?: string;
    city?: string;
    search?: string;
  }): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>('/v1/commercial/companies', {
      params: { 
        skip, 
        limit,
        ...filters,
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
   * Delete all companies
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>('/v1/commercial/companies/bulk');
    return extractApiData(response) || { message: 'No companies deleted', deleted_count: 0 };
  },

  /**
   * Import companies from Excel or ZIP (Excel + logos)
   */
  import: async (file: File, importId?: string): Promise<{
    total_rows: number;
    valid_rows: number;
    created_rows: number;
    updated_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    warnings?: Array<{ 
      row: number; 
      type: string; 
      message: string; 
      data?: Record<string, unknown> 
    }>;
    data: Company[];
    logos_uploaded?: number;
    import_id?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const params: Record<string, string> = {};
    if (importId) {
      params.import_id = importId;
    }
    
    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      created_rows: number;
      updated_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{ 
        row: number; 
        type: string; 
        message: string; 
        data?: Record<string, unknown> 
      }>;
      data: Company[];
      logos_uploaded?: number;
      import_id?: string;
    }>('/v1/commercial/companies/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params,
    });
    
    return extractApiData(response) || {
      total_rows: 0,
      valid_rows: 0,
      created_rows: 0,
      updated_rows: 0,
      invalid_rows: 0,
      errors: [],
      warnings: [],
      data: [],
      logos_uploaded: 0,
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
      
      // Check if response is actually an error
      if (response.status >= 400) {
        const text = await (response.data as Blob).text();
        let errorData: unknown;
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
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: Blob } };
      if (axiosError.response?.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text();
          let errorData: unknown;
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            errorData = { detail: text || 'Export failed' };
          }
          (error as { response: { data: unknown } }).response.data = errorData;
        } catch (parseError) {
          (error as { response: { data: unknown } }).response.data = { detail: 'Erreur lors de l\'export' };
        }
      }
      throw error;
    }
  },

  /**
   * Download company import template (Excel only)
   */
  downloadTemplate: async (): Promise<void> => {
    const { downloadCompanyTemplate } = await import('@/lib/utils/generateCompanyTemplate');
    downloadCompanyTemplate();
  },

  /**
   * Download company import ZIP template (Excel + instructions + logos folder)
   */
  downloadZipTemplate: async (): Promise<void> => {
    const { downloadCompanyZipTemplate } = await import('@/lib/utils/generateCompanyTemplate');
    await downloadCompanyZipTemplate();
  },
};
