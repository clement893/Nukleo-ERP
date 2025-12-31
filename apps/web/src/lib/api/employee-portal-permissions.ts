/**
 * Employee Portal Permissions API
 * API client for employee portal permissions endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface EmployeePortalPermission {
  id: number;
  user_id?: number | null;
  employee_id?: number | null;
  permission_type: 'page' | 'module' | 'project' | 'client';
  resource_id: string;
  metadata?: Record<string, any> | null;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeePortalPermissionCreate {
  user_id?: number | null;
  employee_id?: number | null;
  permission_type: 'page' | 'module' | 'project' | 'client';
  resource_id: string;
  metadata?: Record<string, any> | null;
  can_view?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  description?: string | null;
}

export interface EmployeePortalPermissionUpdate extends Partial<EmployeePortalPermissionCreate> {}

export interface EmployeePortalPermissionSummary {
  user_id?: number | null;
  employee_id?: number | null;
  pages: string[];
  modules: string[];
  projects: number[];
  clients: number[];
  all_projects: boolean;
  all_clients: boolean;
}

export interface BulkEmployeePortalPermissionCreate {
  user_id?: number | null;
  employee_id?: number | null;
  permissions: EmployeePortalPermissionCreate[];
}

class EmployeePortalPermissionsAPI {
  /**
   * List employee portal permissions
   */
  async list(params?: {
    user_id?: number;
    employee_id?: number;
    permission_type?: string;
  }): Promise<EmployeePortalPermission[]> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.employee_id) queryParams.append('employee_id', params.employee_id.toString());
    if (params?.permission_type) queryParams.append('permission_type', params.permission_type);

    const response = await apiClient.get<EmployeePortalPermission[]>(
      `/v1/employee-portal-permissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return extractApiData<EmployeePortalPermission[]>(response as any);
  }

  /**
   * Get a specific permission
   */
  async get(permissionId: number): Promise<EmployeePortalPermission> {
    const response = await apiClient.get<EmployeePortalPermission>(`/v1/employee-portal-permissions/${permissionId}`);
    return extractApiData<EmployeePortalPermission>(response as any);
  }

  /**
   * Get summary of permissions for a user
   */
  async getSummary(userId: number): Promise<EmployeePortalPermissionSummary> {
    const response = await apiClient.get<EmployeePortalPermissionSummary>(`/v1/users/${userId}/employee-portal-permissions/summary`);
    return extractApiData<EmployeePortalPermissionSummary>(response as any);
  }

  /**
   * Get summary of permissions for an employee
   */
  async getSummaryForEmployee(employeeId: number): Promise<EmployeePortalPermissionSummary> {
    const response = await apiClient.get<EmployeePortalPermissionSummary>(`/v1/employees/${employeeId}/employee-portal-permissions/summary`);
    return extractApiData<EmployeePortalPermissionSummary>(response as any);
  }

  /**
   * Create a new permission
   */
  async create(data: EmployeePortalPermissionCreate): Promise<EmployeePortalPermission> {
    const response = await apiClient.post<EmployeePortalPermission>('/v1/employee-portal-permissions', data);
    return extractApiData<EmployeePortalPermission>(response as any);
  }

  /**
   * Bulk create permissions
   */
  async bulkCreate(data: BulkEmployeePortalPermissionCreate): Promise<EmployeePortalPermission[]> {
    const response = await apiClient.post<EmployeePortalPermission[]>('/v1/employee-portal-permissions/bulk', data);
    return extractApiData<EmployeePortalPermission[]>(response as any);
  }

  /**
   * Update a permission
   */
  async update(permissionId: number, data: EmployeePortalPermissionUpdate): Promise<EmployeePortalPermission> {
    const response = await apiClient.put<EmployeePortalPermission>(`/v1/employee-portal-permissions/${permissionId}`, data);
    return extractApiData<EmployeePortalPermission>(response as any);
  }

  /**
   * Delete a permission
   */
  async delete(permissionId: number): Promise<void> {
    await apiClient.delete(`/v1/employee-portal-permissions/${permissionId}`);
  }

  /**
   * Delete all permissions for a user
   */
  async deleteAllForUser(userId: number): Promise<void> {
    await apiClient.delete(`/v1/users/${userId}/employee-portal-permissions`);
  }

  /**
   * Delete all permissions for an employee
   */
  async deleteAllForEmployee(employeeId: number): Promise<void> {
    await apiClient.delete(`/v1/employees/${employeeId}/employee-portal-permissions`);
  }
}

export const employeePortalPermissionsAPI = new EmployeePortalPermissionsAPI();
