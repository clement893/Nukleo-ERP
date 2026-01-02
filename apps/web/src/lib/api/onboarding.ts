/**
 * Onboarding API
 * API client for onboarding endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface OnboardingStep {
  id: number;
  key: string;
  title: string;
  description?: string | null;
  order: number;
  step_type: string;
  step_data?: Record<string, unknown> | null;
  required: boolean;
}

export interface OnboardingProgress {
  is_completed: boolean;
  current_step: string | null;
  completed_count: number;
  total_count: number;
  progress_percentage: number;
}

export interface EmployeeOnboardingItem {
  employee_id: number;
  employee_name: string;
  employee_email?: string | null;
  hire_date?: string | null;
  team_id?: number | null;
  user_id?: number | null;
  progress: OnboardingProgress;
}

/**
 * Onboarding API client
 */
export const onboardingAPI = {
  /**
   * Get onboarding steps for current user
   */
  getSteps: async (): Promise<OnboardingStep[]> => {
    const response = await apiClient.get<OnboardingStep[]>('/v1/onboarding/steps');
    return extractApiData<OnboardingStep[]>(response);
  },

  /**
   * Get onboarding progress for current user
   */
  getProgress: async (): Promise<OnboardingProgress> => {
    const response = await apiClient.get<OnboardingProgress>('/v1/onboarding/progress');
    return extractApiData<OnboardingProgress>(response);
  },

  /**
   * Initialize onboarding for current user
   */
  initialize: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/v1/onboarding/initialize');
    return extractApiData<{ success: boolean; message: string }>(response);
  },

  /**
   * Complete an onboarding step for current user
   */
  completeStep: async (stepKey: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/v1/onboarding/steps/${stepKey}/complete`
    );
    return extractApiData<{ success: boolean; message: string }>(response);
  },

  /**
   * Skip an onboarding step for current user
   */
  skipStep: async (stepKey: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/v1/onboarding/steps/${stepKey}/skip`
    );
    return extractApiData<{ success: boolean; message: string }>(response);
  },

  /**
   * Get onboarding progress for an employee
   */
  getEmployeeProgress: async (employeeId: number): Promise<OnboardingProgress> => {
    const response = await apiClient.get<OnboardingProgress>(
      `/v1/employees/${employeeId}/onboarding/progress`
    );
    return extractApiData<OnboardingProgress>(response);
  },

  /**
   * Get onboarding steps for an employee
   */
  getEmployeeSteps: async (employeeId: number): Promise<OnboardingStep[]> => {
    const response = await apiClient.get<OnboardingStep[]>(
      `/v1/employees/${employeeId}/onboarding/steps`
    );
    return extractApiData<OnboardingStep[]>(response);
  },

  /**
   * Initialize onboarding for an employee
   */
  initializeEmployee: async (employeeId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/v1/employees/${employeeId}/onboarding/initialize`
    );
    return extractApiData<{ success: boolean; message: string }>(response);
  },

  /**
   * Complete an onboarding step for an employee
   */
  completeEmployeeStep: async (
    employeeId: number,
    stepKey: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/v1/employees/${employeeId}/onboarding/steps/${stepKey}/complete`
    );
    return extractApiData<{ success: boolean; message: string }>(response);
  },

  /**
   * List all employees with their onboarding status
   */
  listEmployeesOnboarding: async (options?: {
    team_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<EmployeeOnboardingItem[]> => {
    const response = await apiClient.get<EmployeeOnboardingItem[]>('/v1/employees/onboarding/list', {
      params: {
        team_id: options?.team_id,
        skip: options?.skip || 0,
        limit: options?.limit || 1000,
      },
    });
    return extractApiData<EmployeeOnboardingItem[]>(response);
  },
};
