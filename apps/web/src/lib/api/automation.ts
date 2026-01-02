/**
 * Automation API Client
 * 
 * API functions for automation endpoints (scheduled tasks and automation rules).
 * 
 * @module AutomationAPI
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

/**
 * Task Type
 */
export type TaskType = 'email' | 'report' | 'sync' | 'custom';

/**
 * Task Status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Scheduled Task
 */
export interface ScheduledTask {
  id: number;
  name: string;
  description?: string;
  task_type: TaskType;
  scheduled_at: string;
  recurrence?: string | null;
  recurrence_config?: Record<string, unknown> | null;
  status: TaskStatus;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  task_data?: Record<string, unknown> | null;
  result_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create Scheduled Task Request
 */
export interface CreateScheduledTaskRequest {
  name: string;
  description?: string;
  task_type: TaskType;
  scheduled_at: string;
  recurrence?: string | null;
  recurrence_config?: Record<string, unknown> | null;
  task_data?: Record<string, unknown> | null;
}

/**
 * Update Scheduled Task Request
 */
export interface UpdateScheduledTaskRequest {
  name?: string;
  description?: string;
  scheduled_at?: string;
  recurrence?: string | null;
  recurrence_config?: Record<string, unknown> | null;
  task_data?: Record<string, unknown> | null;
}

/**
 * Execution Log
 */
export interface ExecutionLog {
  id: number;
  task_id: number;
  status: TaskStatus;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
}

/**
 * Automation Rule
 */
export interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  enabled: boolean;
  trigger_event: string;
  trigger_conditions?: Record<string, unknown>;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  trigger_count: number;
  last_triggered_at?: string | null;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create Automation Rule Request
 */
export interface CreateAutomationRuleRequest {
  name: string;
  description?: string;
  enabled: boolean;
  trigger_event: string;
  trigger_conditions?: Record<string, unknown>;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * Update Automation Rule Request
 */
export interface UpdateAutomationRuleRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  trigger_event?: string;
  trigger_conditions?: Record<string, unknown>;
  actions?: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * Automation API
 */
export const automationAPI = {
  /**
   * Get all scheduled tasks
   */
  getScheduledTasks: async (params?: {
    status?: TaskStatus;
    task_type?: TaskType;
  }): Promise<ScheduledTask[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.task_type) queryParams.append('task_type', params.task_type);
    
    const queryString = queryParams.toString();
    const url = `/v1/scheduled-tasks${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<ScheduledTask[]>(url);
    const data = extractApiData<ScheduledTask[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a specific scheduled task
   */
  getScheduledTask: async (taskId: number): Promise<ScheduledTask> => {
    const response = await apiClient.get<ScheduledTask>(`/v1/scheduled-tasks/${taskId}`);
    const data = extractApiData<ScheduledTask>(response);
    if (!data) {
      throw new Error('Failed to fetch scheduled task: no data returned');
    }
    return data;
  },

  /**
   * Create a new scheduled task
   */
  createScheduledTask: async (task: CreateScheduledTaskRequest): Promise<ScheduledTask> => {
    const response = await apiClient.post<ScheduledTask>('/v1/scheduled-tasks', task);
    const data = extractApiData<ScheduledTask>(response);
    if (!data) {
      throw new Error('Failed to create scheduled task: no data returned');
    }
    return data;
  },

  /**
   * Update a scheduled task
   */
  updateScheduledTask: async (taskId: number, task: UpdateScheduledTaskRequest): Promise<ScheduledTask> => {
    const response = await apiClient.put<ScheduledTask>(`/v1/scheduled-tasks/${taskId}`, task);
    const data = extractApiData<ScheduledTask>(response);
    if (!data) {
      throw new Error('Failed to update scheduled task: no data returned');
    }
    return data;
  },

  /**
   * Delete a scheduled task
   */
  deleteScheduledTask: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/v1/scheduled-tasks/${taskId}`);
  },

  /**
   * Cancel a scheduled task
   */
  cancelScheduledTask: async (taskId: number): Promise<void> => {
    await apiClient.post(`/v1/scheduled-tasks/${taskId}/cancel`);
  },

  /**
   * Toggle task status (enable/disable)
   */
  toggleScheduledTask: async (taskId: number): Promise<ScheduledTask> => {
    const response = await apiClient.put<ScheduledTask>(`/v1/scheduled-tasks/${taskId}/toggle`);
    const data = extractApiData<ScheduledTask>(response);
    if (!data) {
      throw new Error('Failed to toggle scheduled task: no data returned');
    }
    return data;
  },

  /**
   * Get execution logs for a task
   */
  getTaskLogs: async (taskId: number, limit: number = 50): Promise<ExecutionLog[]> => {
    const response = await apiClient.get<ExecutionLog[]>(`/v1/scheduled-tasks/${taskId}/logs?limit=${limit}`);
    const data = extractApiData<ExecutionLog[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get all automation rules
   */
  getAutomationRules: async (): Promise<AutomationRule[]> => {
    try {
      const response = await apiClient.get<AutomationRule[]>('/v1/automation-rules');
      const data = extractApiData<AutomationRule[]>(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // If endpoint doesn't exist yet, return empty array
      console.warn('Automation rules endpoint not available yet', error);
      return [];
    }
  },

  /**
   * Get a specific automation rule
   */
  getAutomationRule: async (ruleId: string): Promise<AutomationRule> => {
    const response = await apiClient.get<AutomationRule>(`/v1/automation-rules/${ruleId}`);
    const data = extractApiData<AutomationRule>(response);
    if (!data) {
      throw new Error('Failed to fetch automation rule: no data returned');
    }
    return data;
  },

  /**
   * Create a new automation rule
   */
  createAutomationRule: async (rule: CreateAutomationRuleRequest): Promise<AutomationRule> => {
    const response = await apiClient.post<AutomationRule>('/v1/automation-rules', rule);
    const data = extractApiData<AutomationRule>(response);
    if (!data) {
      throw new Error('Failed to create automation rule: no data returned');
    }
    return data;
  },

  /**
   * Update an automation rule
   */
  updateAutomationRule: async (ruleId: string, rule: UpdateAutomationRuleRequest): Promise<AutomationRule> => {
    const response = await apiClient.put<AutomationRule>(`/v1/automation-rules/${ruleId}`, rule);
    const data = extractApiData<AutomationRule>(response);
    if (!data) {
      throw new Error('Failed to update automation rule: no data returned');
    }
    return data;
  },

  /**
   * Delete an automation rule
   */
  deleteAutomationRule: async (ruleId: string): Promise<void> => {
    await apiClient.delete(`/v1/automation-rules/${ruleId}`);
  },

  /**
   * Toggle automation rule enabled/disabled
   */
  toggleAutomationRule: async (ruleId: string, _enabled: boolean): Promise<AutomationRule> => {
    const response = await apiClient.post<AutomationRule>(`/v1/automation-rules/${ruleId}/toggle`);
    const data = extractApiData<AutomationRule>(response);
    if (!data) {
      throw new Error('Failed to toggle automation rule: no data returned');
    }
    return data;
  },

  /**
   * Initialize default automation rule
   */
  initializeDefaultRule: async (): Promise<AutomationRule> => {
    const response = await apiClient.post<AutomationRule>('/v1/automation-rules/initialize-default');
    const data = extractApiData<AutomationRule>(response);
    if (!data) {
      throw new Error('Failed to initialize default automation rule: no data returned');
    }
    return data;
  },
};
