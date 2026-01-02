/**
 * Employees API
 * API client for employees endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  hire_date?: string | null; // ISO date string
  birthday?: string | null; // ISO date string
  capacity_hours_per_week?: number | null; // Capacity in hours per week (default: 35)
  user_id?: number | null; // Linked user ID
  team_id?: number | null; // Team ID
  // Extended fields (may be available from backend)
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated' | null;
  department?: string | null;
  job_title?: string | null;
  employee_type?: 'full_time' | 'part_time' | 'contractor' | 'intern' | null;
  employee_number?: string | null;
  salary?: number | null;
  hourly_rate?: number | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  termination_date?: string | null;
  manager_id?: number | null;
  team_name?: string | null; // Team name from relationship
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  hire_date?: string | null; // ISO date string (YYYY-MM-DD)
  birthday?: string | null; // ISO date string (YYYY-MM-DD)
  capacity_hours_per_week?: number | null; // Capacity in hours per week (default: 35)
  team_id?: number | null; // Team ID
  // Extended fields
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated' | null;
  department?: string | null;
  job_title?: string | null;
  employee_type?: 'full_time' | 'part_time' | 'contractor' | 'intern' | null;
  employee_number?: string | null;
  salary?: number | null;
  hourly_rate?: number | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  termination_date?: string | null;
  manager_id?: number | null;
}

export interface EmployeeUpdate extends Partial<EmployeeCreate> {}

/**
 * Employees API client
 */
export const employeesAPI = {
  /**
   * Get list of employees with pagination
   */
  list: async (skip = 0, limit = 100): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/v1/employes/employees', {
      params: { 
        skip, 
        limit,
        _t: Date.now(), // Cache-busting timestamp
      },
    });
    
    const data = extractApiData<Employee[] | { items: Employee[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Employee[] }).items;
    }
    return [];
  },

  /**
   * Get an employee by ID
   */
  get: async (employeeId: number): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/v1/employes/employees/${employeeId}`);
    const data = extractApiData<Employee>(response);
    if (!data) {
      throw new Error(`Employee not found: ${employeeId}`);
    }
    return data;
  },

  /**
   * Create a new employee
   */
  create: async (employee: EmployeeCreate): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/v1/employes/employees', employee);
    const data = extractApiData<Employee>(response);
    if (!data) {
      throw new Error('Failed to create employee: no data returned');
    }
    return data;
  },

  /**
   * Update an employee
   */
  update: async (employeeId: number, employee: EmployeeUpdate): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/v1/employes/employees/${employeeId}`, employee);
    const data = extractApiData<Employee>(response);
    if (!data) {
      throw new Error('Failed to update employee: no data returned');
    }
    return data;
  },

  /**
   * Delete an employee
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/employes/employees/${id}`);
  },

  /**
   * Delete all employees
   */
  deleteAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await apiClient.delete<{ message: string; deleted_count: number }>('/v1/employes/employees/bulk');
    return extractApiData(response) || { message: 'No employees deleted', deleted_count: 0 };
  },

  /**
   * Link an employee to a user account
   */
  linkToUser: async (employeeId: number, userId: number): Promise<Employee> => {
    const response = await apiClient.post<Employee>(`/v1/employes/employees/${employeeId}/link-user/${userId}`);
    const data = extractApiData<Employee>(response);
    if (!data) {
      throw new Error('Failed to link employee to user: no data returned');
    }
    return data;
  },

  /**
   * Unlink an employee from a user account
   */
  unlinkFromUser: async (employeeId: number): Promise<Employee> => {
    const response = await apiClient.delete<Employee>(`/v1/employes/employees/${employeeId}/unlink-user`);
    const data = extractApiData<Employee>(response);
    if (!data) {
      throw new Error('Failed to unlink employee from user: no data returned');
    }
    return data;
  },

  /**
   * Import employees from Excel or ZIP (Excel + photos)
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
    data: Employee[];
    photos_uploaded?: number;
    import_id?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = importId 
      ? `/v1/employes/employees/import?import_id=${encodeURIComponent(importId)}`
      : '/v1/employes/employees/import';
    
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
      data: Employee[];
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
   * Export employees to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;
      
      const response = await axios.get(`${apiUrl}/api/v1/employes/employees/export`, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? TokenStorage.getToken() || '' : ''}`,
        },
      });
      
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
          error.response.data = errorData;
        } catch (parseError) {
          error.response.data = { detail: 'Erreur lors de l\'export' };
        }
      }
      throw error;
    }
  },

  /**
   * Download employee import template (Excel only)
   */
  downloadTemplate: async (): Promise<void> => {
    const { downloadEmployeeTemplate } = await import('@/lib/utils/generateEmployeeTemplate');
    downloadEmployeeTemplate();
  },

  /**
   * Download employee import ZIP template (Excel + instructions + photos folder)
   */
  downloadZipTemplate: async (): Promise<void> => {
    const { downloadEmployeeZipTemplate } = await import('@/lib/utils/generateEmployeeTemplate');
    await downloadEmployeeZipTemplate();
  },
};
