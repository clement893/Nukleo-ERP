/**
 * Employees API Client
 * API client for managing employees and linking them to users
 */

import { apiClient } from './client';
import { extractApiData } from './utils';
import type { ApiResponse } from '@modele/types';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department?: string;
  hire_date?: string; // ISO date string
  birth_date?: string; // ISO date string
  photo_url?: string;
  linkedin_url?: string;
  user_id?: string;
}

export const employeesAPI = {
  /**
   * List all employees
   */
  list: async (skip = 0, limit = 100): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/v1/employees', {
      params: { skip, limit },
    });
    const data = extractApiData<Employee[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Link an employee to a user
   */
  linkToUser: async (
    employeeId: string,
    userId: number
  ): Promise<ApiResponse<Employee>> => {
    return apiClient.put<Employee>(
      `/v1/employees/${employeeId}/link-user`,
      {},
      {
        params: { user_id: userId },
      }
    );
  },

  /**
   * Unlink an employee from a user
   */
  unlinkFromUser: async (
    employeeId: string
  ): Promise<ApiResponse<Employee>> => {
    return apiClient.delete<Employee>(`/v1/employees/${employeeId}/unlink-user`);
  },
};
