/**
 * Opportunities API
 * API client for commercial opportunities endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Opportunity {
  id: string;
  name: string;
  description?: string | null;
  amount?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  status?: string | null;
  segment?: string | null;
  region?: string | null;
  service_offer_link?: string | null;
  notes?: string | null;
  pipeline_id: string;
  pipeline_name?: string | null;
  stage_id?: string | null;
  stage_name?: string | null;
  company_id?: number | null;
  company_name?: string | null;
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
  contact_names: string[];
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreate {
  name: string;
  description?: string | null;
  amount?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  status?: string | null;
  segment?: string | null;
  region?: string | null;
  service_offer_link?: string | null;
  notes?: string | null;
  pipeline_id: string;
  stage_id?: string | null;
  company_id?: number | null;
  assigned_to_id?: number | null;
  opened_at?: string | null;
  closed_at?: string | null;
  contact_ids?: number[];
}

export interface OpportunityUpdate extends Partial<OpportunityCreate> {}

/**
 * Opportunities API client
 */
export const opportunitiesAPI = {
  /**
   * Get list of opportunities with pagination and filters
   */
  list: async (
    skip = 0,
    limit = 100,
    filters?: {
      status?: string;
      pipeline_id?: string;
      stage_id?: string;
      company_id?: number;
      search?: string;
    }
  ): Promise<Opportunity[]> => {
    const params: Record<string, string | number> = {
      skip,
      limit,
      _t: Date.now(), // Cache-busting timestamp
    };

    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.pipeline_id) params.pipeline_id = filters.pipeline_id;
      if (filters.stage_id) params.stage_id = filters.stage_id;
      if (filters.company_id) params.company_id = filters.company_id;
      if (filters.search) params.search = filters.search;
    }

    const response = await apiClient.get<Opportunity[]>('/v1/commercial/opportunities', {
      params,
    });

    const data = extractApiData<Opportunity[] | { items: Opportunity[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Opportunity[] }).items;
    }
    return [];
  },

  /**
   * Get an opportunity by ID
   */
  get: async (opportunityId: string): Promise<Opportunity> => {
    const response = await apiClient.get<Opportunity>(`/v1/commercial/opportunities/${opportunityId}`);
    const data = extractApiData<Opportunity>(response);
    if (!data) {
      throw new Error(`Opportunity not found: ${opportunityId}`);
    }
    return data;
  },

  /**
   * Create a new opportunity
   */
  create: async (opportunity: OpportunityCreate): Promise<Opportunity> => {
    const response = await apiClient.post<Opportunity>('/v1/commercial/opportunities', opportunity);
    const data = extractApiData<Opportunity>(response);
    if (!data) {
      throw new Error('Failed to create opportunity: no data returned');
    }
    return data;
  },

  /**
   * Update an opportunity
   */
  update: async (opportunityId: string, opportunity: OpportunityUpdate): Promise<Opportunity> => {
    const response = await apiClient.put<Opportunity>(
      `/v1/commercial/opportunities/${opportunityId}`,
      opportunity
    );
    const data = extractApiData<Opportunity>(response);
    if (!data) {
      throw new Error('Failed to update opportunity: no data returned');
    }
    return data;
  },

  /**
   * Delete an opportunity
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/commercial/opportunities/${id}`);
  },

  /**
   * Import opportunities from Excel
   */
  import: async (file: File): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    data: Opportunity[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      data: Opportunity[];
    }>('/v1/commercial/opportunities/import', formData, {
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
   * Export opportunities to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      // Use axios directly for blob responses
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;

      const response = await axios.get(`${apiUrl}/api/v1/commercial/opportunities/export`, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? TokenStorage.getToken() || '' : ''}`,
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
          error.response.data = { detail: "Erreur lors de l'export" };
        }
      }
      throw error;
    }
  },

  /**
   * Download opportunity import template (Excel only)
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadOpportunityTemplate } = await import('@/lib/utils/generateOpportunityTemplate');
    downloadOpportunityTemplate();
  },

  /**
   * Download opportunity import ZIP template (Excel + instructions + logos folder)
   * This is a client-side function, not an API call
   */
  downloadZipTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadOpportunityZipTemplate } = await import('@/lib/utils/generateOpportunityTemplate');
    await downloadOpportunityZipTemplate();
  },
};
