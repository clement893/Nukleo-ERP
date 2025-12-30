/**
 * Submissions API
 * API client for commercial submissions endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Submission {
  id: number;
  submission_number: string;
  company_id: number | null;
  company_name?: string;
  title: string;
  type: string | null;
  description: string | null;
  content: Record<string, any> | null;
  status: string;
  deadline: string | null;
  submitted_at: string | null;
  notes: string | null;
  attachments: Array<Record<string, any>> | null;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionCreate {
  submission_number?: string;
  company_id?: number | null;
  title: string;
  type?: string | null;
  description?: string | null;
  content?: Record<string, any> | null;
  status?: string;
  deadline?: string | null;
  submitted_at?: string | null;
  notes?: string | null;
  attachments?: Array<Record<string, any>> | null;
}

export interface SubmissionUpdate extends Partial<SubmissionCreate> {}

/**
 * Submissions API client
 */
export const submissionsAPI = {
  /**
   * Get list of submissions with pagination
   */
  list: async (skip = 0, limit = 100, company_id?: number, status?: string, type?: string): Promise<Submission[]> => {
    const response = await apiClient.get<Submission[]>('/v1/commercial/submissions', {
      params: { 
        skip, 
        limit,
        company_id,
        status,
        type,
        _t: Date.now(),
      },
    });
    
    const data = extractApiData<Submission[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a submission by ID
   */
  get: async (submissionId: number): Promise<Submission> => {
    const response = await apiClient.get<Submission>(`/v1/commercial/submissions/${submissionId}`);
    const data = extractApiData<Submission>(response);
    if (!data) {
      throw new Error(`Submission not found: ${submissionId}`);
    }
    return data;
  },

  /**
   * Create a new submission
   */
  create: async (submission: SubmissionCreate): Promise<Submission> => {
    const response = await apiClient.post<Submission>('/v1/commercial/submissions', submission);
    const data = extractApiData<Submission>(response);
    if (!data) {
      throw new Error('Failed to create submission: no data returned');
    }
    return data;
  },

  /**
   * Update a submission
   */
  update: async (submissionId: number, submission: SubmissionUpdate): Promise<Submission> => {
    const response = await apiClient.put<Submission>(`/v1/commercial/submissions/${submissionId}`, submission);
    const data = extractApiData<Submission>(response);
    if (!data) {
      throw new Error('Failed to update submission: no data returned');
    }
    return data;
  },

  /**
   * Delete a submission
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/commercial/submissions/${id}`);
  },
};
