/**
 * Deadlines API
 * API client for agenda deadlines endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export type DeadlinePriority = 'low' | 'medium' | 'high' | 'urgent';
export type DeadlineStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export interface Deadline {
  id: string;
  title: string;
  description?: string | null;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  due_date: string; // ISO date string
  due_time?: string | null; // Time string (HH:MM:SS)
  completed_at?: string | null; // ISO datetime string
  created_by_id?: string | null;
  assigned_to_id?: string | null;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeadlineCreate {
  title: string;
  description?: string | null;
  priority?: DeadlinePriority;
  status?: DeadlineStatus;
  due_date: string; // ISO date string (YYYY-MM-DD)
  due_time?: string | null; // Time string (HH:MM:SS)
  project_id?: string | null;
  assigned_to_id?: string | null;
}

export interface DeadlineUpdate {
  title?: string;
  description?: string | null;
  priority?: DeadlinePriority;
  status?: DeadlineStatus;
  due_date?: string; // ISO date string
  due_time?: string | null; // Time string
  completed_at?: string | null;
  project_id?: string | null;
  assigned_to_id?: string | null;
}

/**
 * Deadlines API client
 */
export const deadlinesAPI = {
  /**
   * Get list of deadlines with optional filters
   */
  list: async (params?: {
    skip?: number;
    limit?: number;
    project_id?: string | number;
    status?: DeadlineStatus;
    priority?: DeadlinePriority;
  }): Promise<Deadline[]> => {
    const response = await apiClient.get<Deadline[]>('/v1/agenda/deadlines', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 1000,
        ...(params?.project_id && { project_id: params.project_id }),
        ...(params?.status && { status: params.status }),
        ...(params?.priority && { priority: params.priority }),
      },
    });
    
    const data = extractApiData<Deadline[] | { items: Deadline[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Deadline[] }).items;
    }
    return [];
  },

  /**
   * Get a deadline by ID
   */
  get: async (deadlineId: string): Promise<Deadline> => {
    const response = await apiClient.get<Deadline>(`/v1/agenda/deadlines/${deadlineId}`);
    const data = extractApiData<Deadline>(response);
    if (!data) {
      throw new Error(`Deadline not found: ${deadlineId}`);
    }
    return data;
  },

  /**
   * Create a new deadline
   */
  create: async (deadline: DeadlineCreate): Promise<Deadline> => {
    const response = await apiClient.post<Deadline>('/v1/agenda/deadlines', deadline);
    const data = extractApiData<Deadline>(response);
    if (!data) {
      throw new Error('Failed to create deadline: no data returned');
    }
    return data;
  },

  /**
   * Update a deadline
   */
  update: async (deadlineId: string, deadline: DeadlineUpdate): Promise<Deadline> => {
    const response = await apiClient.put<Deadline>(`/v1/agenda/deadlines/${deadlineId}`, deadline);
    const data = extractApiData<Deadline>(response);
    if (!data) {
      throw new Error('Failed to update deadline: no data returned');
    }
    return data;
  },

  /**
   * Delete a deadline
   */
  delete: async (deadlineId: string): Promise<void> => {
    await apiClient.delete(`/v1/agenda/deadlines/${deadlineId}`);
  },
};
