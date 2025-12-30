/**
 * Employees API Client
 * API client for managing employees and linking them to users
 */

import { apiClient, type ApiResponse } from './api';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  department?: string;
  user_id?: string;
}

export const employeesAPI = {
  /**
   * List all employees
   */
  list: async (skip = 0, limit = 100): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get<Employee[]>('/v1/employees', {
      params: { skip, limit },
    });
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
