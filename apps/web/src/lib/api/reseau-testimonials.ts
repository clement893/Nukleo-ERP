/**
 * Réseau Testimonials API
 * API client for network module testimonials endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

/**
 * Testimonial interface
 */
export interface Testimonial {
  id: number;
  contact_id?: number | null;
  company_id?: number | null;
  title?: string | null;
  testimonial_fr?: string | null;
  testimonial_en?: string | null;
  logo_url?: string | null;
  logo_filename?: string | null;
  language?: string | null;
  is_published?: string;
  rating?: number | null;
  contact_name?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestimonialCreate {
  contact_id?: number | null;
  company_id?: number | null;
  title?: string | null;
  testimonial_fr?: string | null;
  testimonial_en?: string | null;
  logo_url?: string | null;
  logo_filename?: string | null;
  language?: string | null;
  is_published?: string;
  rating?: number | null;
  contact_name?: string | null;
  company_name?: string | null;
}

export interface TestimonialUpdate extends Partial<TestimonialCreate> {}

/**
 * Réseau Testimonials API client
 */
export const reseauTestimonialsAPI = {
  /**
   * Get list of testimonials with pagination
   * Uses cache-busting to ensure fresh data
   */
  list: async (
    skip = 0,
    limit = 100,
    filters?: {
      company_id?: number;
      contact_id?: number;
      language?: string;
      is_published?: string;
      search?: string;
    }
  ): Promise<Testimonial[]> => {
    const params: Record<string, string | number> = {
      skip,
      limit,
      _t: Date.now(), // Cache-busting timestamp
    };

    if (filters) {
      if (filters.company_id !== undefined) {
        params.company_id = filters.company_id;
      }
      if (filters.contact_id !== undefined) {
        params.contact_id = filters.contact_id;
      }
      if (filters.language) {
        params.language = filters.language;
      }
      if (filters.is_published) {
        params.is_published = filters.is_published;
      }
      if (filters.search) {
        params.search = filters.search;
      }
    }

    const response = await apiClient.get<Testimonial[]>('/v1/reseau/testimonials', {
      params,
    });

    const data = extractApiData<Testimonial[] | { items: Testimonial[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Testimonial[] }).items;
    }
    return [];
  },

  /**
   * Get a testimonial by ID
   */
  get: async (testimonialId: number): Promise<Testimonial> => {
    const response = await apiClient.get<Testimonial>(`/v1/reseau/testimonials/${testimonialId}`);
    const data = extractApiData<Testimonial>(response);
    if (!data) {
      throw new Error(`Testimonial not found: ${testimonialId}`);
    }
    return data;
  },

  /**
   * Create a new testimonial
   */
  create: async (testimonial: TestimonialCreate): Promise<Testimonial> => {
    const response = await apiClient.post<Testimonial>('/v1/reseau/testimonials', testimonial);
    const data = extractApiData<Testimonial>(response);
    if (!data) {
      throw new Error('Failed to create testimonial: no data returned');
    }
    return data;
  },

  /**
   * Update a testimonial
   */
  update: async (testimonialId: number, testimonial: TestimonialUpdate): Promise<Testimonial> => {
    const response = await apiClient.put<Testimonial>(
      `/v1/reseau/testimonials/${testimonialId}`,
      testimonial
    );
    const data = extractApiData<Testimonial>(response);
    if (!data) {
      throw new Error('Failed to update testimonial: no data returned');
    }
    return data;
  },

  /**
   * Delete a testimonial
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/reseau/testimonials/${id}`);
  },

  /**
   * Delete all testimonials
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>(
      '/v1/reseau/testimonials/bulk'
    );
    return extractApiData(response) || { message: 'No testimonials deleted', deleted_count: 0 };
  },

  /**
   * Import testimonials from Excel or ZIP (Excel + logos)
   */
  import: async (
    file: File,
    importId?: string
  ): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    warnings?: Array<{
      row: number;
      type: string;
      message: string;
      data?: Record<string, unknown>;
    }>;
    data: Testimonial[];
    logos_uploaded?: number;
    import_id?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = importId
      ? `/v1/reseau/testimonials/import?import_id=${encodeURIComponent(importId)}`
      : '/v1/reseau/testimonials/import';

    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{
        row: number;
        type: string;
        message: string;
        data?: Record<string, unknown>;
      }>;
      data: Testimonial[];
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
   * Export testimonials to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      // Use axios directly for blob responses to get full AxiosResponse object
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;

      const response = await axios.get(`${apiUrl}/api/v1/reseau/testimonials/export`, {
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
        let errorData: unknown;
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
    } catch (error: unknown) {
      // If error response is a blob, convert it to JSON first
      const axiosError = error as { response?: { data?: Blob } };
      if (axiosError.response?.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text();
          let errorData: unknown;
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            // If not JSON, create error object with text
            errorData = { detail: text || 'Export failed' };
          }
          // Replace blob with parsed JSON
          (error as { response: { data: unknown } }).response.data = errorData;
        } catch (parseError) {
          // If parsing fails, create a generic error
          (error as { response: { data: unknown } }).response.data = { detail: "Erreur lors de l'export" };
        }
      }
      throw error;
    }
  },

  /**
   * Download testimonial import template (Excel only)
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadTestimonialTemplate } = await import('@/lib/utils/generateTestimonialTemplate');
    downloadTestimonialTemplate();
  },

  /**
   * Download testimonial import ZIP template (Excel + instructions + logos folder)
   * This is a client-side function, not an API call
   */
  downloadZipTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadTestimonialZipTemplate } = await import('@/lib/utils/generateTestimonialTemplate');
    await downloadTestimonialZipTemplate();
  },
};
