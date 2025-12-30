/**
 * Testimonials API
 * API client for commercial testimonials endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Testimonial {
  id: number;
  contact_id: number | null;
  contact_name?: string | null;
  company_id: number | null;
  company_name?: string | null;
  title: string | null;
  testimonial_fr: string | null;
  testimonial_en: string | null;
  language: string;
  logo_url: string | null;
  logo_filename: string | null;
  is_published: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface TestimonialCreate {
  contact_id?: number | null;
  company_id?: number | null;
  company_name?: string | null;
  title?: string | null;
  testimonial_fr?: string | null;
  testimonial_en?: string | null;
  language?: string;
  logo_url?: string | null;
  logo_filename?: string | null;
  is_published?: string;
  rating?: number | null;
}

export interface TestimonialUpdate extends Partial<TestimonialCreate> {}

export interface TestimonialListParams {
  skip?: number;
  limit?: number;
  company_id?: number;
  contact_id?: number;
  language?: string;
  is_published?: string;
  search?: string;
}

/**
 * Testimonials API client
 */
export const testimonialsAPI = {
  /**
   * Get list of testimonials with pagination and filters
   */
  list: async (params?: TestimonialListParams): Promise<Testimonial[]> => {
    const response = await apiClient.get<Testimonial[]>('/v1/commercial/testimonials', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 100,
        ...(params?.company_id && { company_id: params.company_id }),
        ...(params?.contact_id && { contact_id: params.contact_id }),
        ...(params?.language && { language: params.language }),
        ...(params?.is_published && { is_published: params.is_published }),
        ...(params?.search && { search: params.search }),
        _t: Date.now(), // Cache-busting timestamp
      },
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
    const response = await apiClient.get<Testimonial>(`/v1/commercial/testimonials/${testimonialId}`);
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
    const response = await apiClient.post<Testimonial>('/v1/commercial/testimonials', testimonial);
    const data = extractApiData<Testimonial>(response);
    if (!data) {
      throw new Error('Failed to create testimonial');
    }
    return data;
  },

  /**
   * Update a testimonial
   */
  update: async (testimonialId: number, testimonial: TestimonialUpdate): Promise<Testimonial> => {
    const response = await apiClient.put<Testimonial>(`/v1/commercial/testimonials/${testimonialId}`, testimonial);
    const data = extractApiData<Testimonial>(response);
    if (!data) {
      throw new Error('Failed to update testimonial');
    }
    return data;
  },

  /**
   * Delete a testimonial
   */
  delete: async (testimonialId: number): Promise<void> => {
    await apiClient.delete(`/v1/commercial/testimonials/${testimonialId}`);
  },

  /**
   * Delete all testimonials
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>('/v1/commercial/testimonials/bulk');
    return extractApiData<{ message: string; deleted_count: number }>(response) || { message: '', deleted_count: 0 };
  },

  /**
   * Import testimonials from Excel or ZIP file
   */
  import: async (file: File, importId?: string): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: any[];
    warnings: any[];
    logos_uploaded: number;
    import_id: string;
    data: Testimonial[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const params: any = {};
    if (importId) {
      params.import_id = importId;
    }
    
    const response = await apiClient.post('/v1/commercial/testimonials/import', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const data = extractApiData<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: any[];
      warnings: any[];
      logos_uploaded: number;
      import_id: string;
      data: Testimonial[];
    }>(response);
    
    return data || {
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      errors: [],
      warnings: [],
      logos_uploaded: 0,
      import_id: importId || '',
      data: [],
    };
  },

  /**
   * Export testimonials to Excel
   */
  export: async (): Promise<Blob> => {
    const response = await apiClient.get('/v1/commercial/testimonials/export', {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },

  /**
   * Stream import logs via SSE
   */
  getImportLogs: (importId: string, token: string): EventSource => {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/commercial/testimonials/import/${importId}/logs`);
    url.searchParams.set('token', token);
    return new EventSource(url.toString());
  },

  /**
   * Download Excel template for testimonials import
   */
  downloadTemplate: async (): Promise<void> => {
    const { downloadTestimonialTemplate } = await import('@/lib/utils/generateTestimonialTemplate');
    downloadTestimonialTemplate();
  },

  /**
   * Download ZIP template for testimonials import (Excel + logos folder)
   */
  downloadZipTemplate: async (): Promise<void> => {
    const { downloadTestimonialZipTemplate } = await import('@/lib/utils/generateTestimonialTemplate');
    await downloadTestimonialZipTemplate();
  },
};
