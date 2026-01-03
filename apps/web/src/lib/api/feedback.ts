/**
 * Feedback API
 * API client for user feedback and support tickets
 */

import { apiClient } from '../client';
import { extractApiData } from '../utils';

export type FeedbackType = 'bug' | 'feature_request' | 'question' | 'complaint' | 'praise' | 'other';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Feedback {
  id: number;
  user_id?: number | null;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: number; // 1=low, 2=medium, 3=high, 4=critical
  url?: string | null;
  response?: string | null;
  responded_by_id?: number | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreate {
  type: FeedbackType;
  subject: string;
  message: string;
  priority?: number; // 1-4, default 1
  url?: string;
  metadata?: Record<string, any>;
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  priority?: number;
  response?: string;
}

/**
 * Feedback API client
 */
export const feedbackAPI = {
  /**
   * Get list of feedback entries
   */
  list: async (options?: {
    status?: FeedbackStatus;
    type?: FeedbackType;
    limit?: number;
    offset?: number;
  }): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>('/v1/feedback', {
      params: {
        status: options?.status,
        type: options?.type,
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      },
    });
    return extractApiData<Feedback[]>(response);
  },

  /**
   * Get a specific feedback by ID
   */
  get: async (feedbackId: number): Promise<Feedback> => {
    const response = await apiClient.get<Feedback>(`/v1/feedback/${feedbackId}`);
    return extractApiData<Feedback>(response);
  },

  /**
   * Create a new feedback entry
   */
  create: async (feedbackData: FeedbackCreate): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>('/v1/feedback', feedbackData);
    return extractApiData<Feedback>(response);
  },

  /**
   * Update a feedback entry
   */
  update: async (feedbackId: number, feedbackData: FeedbackUpdate): Promise<Feedback> => {
    const response = await apiClient.put<Feedback>(`/v1/feedback/${feedbackId}`, feedbackData);
    return extractApiData<Feedback>(response);
  },

  /**
   * Delete a feedback entry
   */
  delete: async (feedbackId: number): Promise<void> => {
    await apiClient.delete(`/v1/feedback/${feedbackId}`);
  },
};
