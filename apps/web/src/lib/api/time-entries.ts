/**
 * Time Entries API
 * API client for time tracking endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface TimeEntry {
  id: number;
  description?: string | null;
  duration: number; // Duration in seconds
  date: string;
  user_id: number;
  task_id?: number | null;
  project_id?: number | null;
  client_id?: number | null;
  created_at: string;
  updated_at: string;
  task_title?: string | null;
  project_name?: string | null;
  client_name?: string | null;
  user_name?: string | null;
  user_email?: string | null;
}

export interface TimeEntryCreate {
  description?: string | null;
  duration: number;
  date: string;
  task_id?: number | null;
  project_id?: number | null;
  client_id?: number | null;
}

export interface TimeEntryUpdate extends Partial<TimeEntryCreate> {}

export interface TimerStatus {
  active: boolean;
  task_id?: number;
  start_time?: string;
  elapsed_seconds?: number;
  description?: string | null;
  paused?: boolean;
  accumulated_seconds?: number;
}

/**
 * Time Entries API client
 */
export const timeEntriesAPI = {
  /**
   * Get list of time entries
   */
  list: async (params?: {
    user_id?: number;
    task_id?: number;
    project_id?: number;
    client_id?: number;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<TimeEntry[]> => {
    const response = await apiClient.get<TimeEntry[]>('/v1/time-entries', {
      params,
    });
    
    const data = extractApiData<TimeEntry[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a time entry by ID
   */
  get: async (entryId: number): Promise<TimeEntry> => {
    const response = await apiClient.get<TimeEntry>(`/v1/time-entries/${entryId}`);
    const data = extractApiData<TimeEntry>(response);
    if (!data) {
      throw new Error(`Time entry not found: ${entryId}`);
    }
    return data;
  },

  /**
   * Create a new time entry
   */
  create: async (entry: TimeEntryCreate): Promise<TimeEntry> => {
    const response = await apiClient.post<TimeEntry>('/v1/time-entries', entry);
    const data = extractApiData<TimeEntry>(response);
    if (!data) {
      throw new Error('Failed to create time entry: no data returned');
    }
    return data;
  },

  /**
   * Update a time entry
   */
  update: async (entryId: number, entry: TimeEntryUpdate): Promise<TimeEntry> => {
    const response = await apiClient.patch<TimeEntry>(`/v1/time-entries/${entryId}`, entry);
    const data = extractApiData<TimeEntry>(response);
    if (!data) {
      throw new Error('Failed to update time entry: no data returned');
    }
    return data;
  },

  /**
   * Delete a time entry
   */
  delete: async (entryId: number): Promise<void> => {
    await apiClient.delete(`/v1/time-entries/${entryId}`);
  },

  /**
   * Start a timer for a task
   */
  startTimer: async (taskId: number, description?: string): Promise<{ message: string; task_id: number; start_time: string }> => {
    const response = await apiClient.post<{ message: string; task_id: number; start_time: string }>('/v1/time-entries/timer/start', {
      task_id: taskId,
      description,
    });
    return extractApiData(response);
  },

  /**
   * Stop the active timer and create a time entry
   */
  stopTimer: async (description?: string): Promise<TimeEntry> => {
    const response = await apiClient.post<TimeEntry>('/v1/time-entries/timer/stop', {
      description,
    });
    const data = extractApiData<TimeEntry>(response);
    if (!data) {
      throw new Error('Failed to stop timer: no data returned');
    }
    return data;
  },

  /**
   * Get the status of the active timer
   */
  getTimerStatus: async (): Promise<TimerStatus> => {
    const response = await apiClient.get<TimerStatus>('/v1/time-entries/timer/status');
    return extractApiData(response) || { active: false };
  },

  /**
   * Pause the active timer
   */
  pauseTimer: async (): Promise<{ message: string; accumulated_seconds: number }> => {
    const response = await apiClient.post<{ message: string; accumulated_seconds: number }>('/v1/time-entries/timer/pause');
    return extractApiData(response);
  },

  /**
   * Resume a paused timer
   */
  resumeTimer: async (): Promise<{ message: string; start_time: string }> => {
    const response = await apiClient.post<{ message: string; start_time: string }>('/v1/time-entries/timer/resume');
    return extractApiData(response);
  },

  /**
   * Adjust the accumulated time of the active timer
   */
  adjustTimer: async (accumulated_seconds: number): Promise<{ message: string; accumulated_seconds: number }> => {
    const response = await apiClient.post<{ message: string; accumulated_seconds: number }>('/v1/time-entries/timer/adjust', {
      accumulated_seconds,
    });
    return extractApiData(response);
  },

  /**
   * Get all active timers for all users (admin only)
   */
  getAllActiveTimers: async (): Promise<Array<{
    user_id: number;
    user_name: string;
    user_email: string;
    task_id?: number;
    task_title?: string | null;
    project_name?: string | null;
    start_time: string;
    elapsed_seconds: number;
    description?: string | null;
    paused: boolean;
    accumulated_seconds: number;
  }>> => {
    const response = await apiClient.get<Array<{
      user_id: number;
      user_name: string;
      user_email: string;
      task_id?: number;
      task_title?: string | null;
      project_name?: string | null;
      start_time: string;
      elapsed_seconds: number;
      description?: string | null;
      paused: boolean;
      accumulated_seconds: number;
    }>>('/v1/time-entries/timers/active');
    return extractApiData(response) || [];
  },
};
