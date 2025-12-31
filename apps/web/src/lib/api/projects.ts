/**
 * Projects API
 * API client for projects endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  user_id: number;
  client_id: number | null;
  client_name?: string | null;
  responsable_id: number | null;
  responsable_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  status?: 'active' | 'archived' | 'completed';
  client_id?: number | null;
  client_name?: string | null;
  responsable_id?: number | null;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

/**
 * Projects API client
 */
export const projectsAPI = {
  /**
   * Get list of projects with pagination
   * Uses cache-busting to ensure fresh data
   */
  list: async (skip = 0, limit = 100): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/v1/projects', {
      params: { 
        skip, 
        limit,
      },
    });
    
    const data = extractApiData<Project[] | { items: Project[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Project[] }).items;
    }
    return [];
  },

  /**
   * Get a project by ID
   */
  get: async (projectId: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/v1/projects/${projectId}`);
    const data = extractApiData<Project>(response);
    if (!data) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return data;
  },

  /**
   * Create a new project
   */
  create: async (project: ProjectCreate): Promise<Project> => {
    const response = await apiClient.post<Project>('/v1/projects', project);
    const data = extractApiData<Project>(response);
    if (!data) {
      throw new Error('Failed to create project: no data returned');
    }
    return data;
  },

  /**
   * Update a project
   */
  update: async (projectId: number, project: ProjectUpdate): Promise<Project> => {
    const response = await apiClient.put<Project>(`/v1/projects/${projectId}`, project);
    const data = extractApiData<Project>(response);
    if (!data) {
      throw new Error('Failed to update project: no data returned');
    }
    return data;
  },

  /**
   * Delete a project
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/projects/${id}`);
  },

  /**
   * Delete all projects
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>('/v1/projects/bulk');
    return extractApiData(response) || { message: 'No projects deleted', deleted_count: 0 };
  },

  /**
   * Import projects from Excel or ZIP (Excel + documents)
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
    data: Project[];
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
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{ 
        row: number; 
        type: string; 
        message: string; 
        data?: Record<string, unknown> 
      }>;
      data: Project[];
      import_id?: string;
    }>('/v1/projects/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params,
    });
    
    return extractApiData(response) || {
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      errors: [],
      warnings: [],
      data: [],
    };
  },

  /**
   * Export projects to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      // Use axios directly for blob responses to get full AxiosResponse object
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;
      
      const response = await axios.get(`${apiUrl}/api/v1/projects/export`, {
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
   * Download project import template (Excel only)
   * This is a client-side function, not an API call
   */
  downloadTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadProjectTemplate } = await import('@/lib/utils/generateProjectTemplate');
    downloadProjectTemplate();
  },

  /**
   * Download project import ZIP template (Excel + instructions + documents folder)
   * This is a client-side function, not an API call
   */
  downloadZipTemplate: async (): Promise<void> => {
    // Import dynamically to avoid SSR issues
    const { downloadProjectZipTemplate } = await import('@/lib/utils/generateProjectTemplate');
    await downloadProjectZipTemplate();
  },
};
