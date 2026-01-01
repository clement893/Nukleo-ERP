/**
 * Project Tasks API
 * API client for project tasks endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'to_transfer' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  team_id: number;
  project_id?: number | null;  // Optional: task can exist without a project
  assignee_id?: number | null;  // Optional: task can exist without an assignee
  created_by_id?: number | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  assignee_name?: string | null;
  assignee_email?: string | null;
}

export interface ProjectTaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  team_id: number;
  project_id?: number | null;  // Optional: task can be created without a project
  assignee_id?: number | null;  // Optional: User ID (if employee already has a user)
  employee_assignee_id?: number | null;  // Optional: Employee ID (will create User automatically if needed)
  due_date?: string | null;
  estimated_hours?: number | null;
  order?: number;
}

export interface ProjectTaskUpdate extends Partial<ProjectTaskCreate> {
  status?: TaskStatus;
  priority?: TaskPriority;
  employee_assignee_id?: number | null;  // Employee ID (will create User automatically if needed)
}

/**
 * Project Tasks API client
 */
export const projectTasksAPI = {
  /**
   * Get list of project tasks
   */
  list: async (params?: {
    team_id?: number;
    project_id?: number;
    assignee_id?: number;
    employee_assignee_id?: number;  // Employee ID (will get user_id from employee)
    status?: TaskStatus;
    skip?: number;
    limit?: number;
  }): Promise<ProjectTask[]> => {
    const response = await apiClient.get<ProjectTask[]>('/v1/project-tasks', {
      params,
    });
    
    const data = extractApiData<ProjectTask[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a project task by ID
   */
  get: async (taskId: number): Promise<ProjectTask> => {
    const response = await apiClient.get<ProjectTask>(`/v1/project-tasks/${taskId}`);
    const data = extractApiData<ProjectTask>(response);
    if (!data) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return data;
  },

  /**
   * Create a new project task
   */
  create: async (task: ProjectTaskCreate): Promise<ProjectTask> => {
    const response = await apiClient.post<ProjectTask>('/v1/project-tasks', task);
    const data = extractApiData<ProjectTask>(response);
    if (!data) {
      throw new Error('Failed to create task: no data returned');
    }
    return data;
  },

  /**
   * Update a project task
   */
  update: async (taskId: number, task: ProjectTaskUpdate): Promise<ProjectTask> => {
    const response = await apiClient.patch<ProjectTask>(`/v1/project-tasks/${taskId}`, task);
    const data = extractApiData<ProjectTask>(response);
    if (!data) {
      throw new Error('Failed to update task: no data returned');
    }
    return data;
  },

  /**
   * Delete a project task
   */
  delete: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/v1/project-tasks/${taskId}`);
  },
};
