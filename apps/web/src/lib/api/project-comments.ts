/**
 * Project Comments API
 * API client for project/task comments/discussions endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface ProjectComment {
  id: number;
  project_id?: number | null;
  task_id?: number | null;
  content: string;
  parent_id?: number | null;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  user_avatar?: string | null;
  is_edited: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  replies?: ProjectComment[];
}

export interface ProjectCommentCreate {
  project_id?: number | null;
  task_id?: number | null;
  content: string;
  parent_id?: number | null;
}

export interface ProjectCommentUpdate {
  content: string;
  is_pinned?: boolean;
}

/**
 * Project Comments API client
 */
export const projectCommentsAPI = {
  /**
   * List comments
   */
  list: async (params?: { project_id?: number; task_id?: number; skip?: number; limit?: number }): Promise<ProjectComment[]> => {
    const response = await apiClient.get<ProjectComment[]>('/v1/project-comments', { params });
    return extractApiData<ProjectComment[]>(response) || [];
  },

  /**
   * Get a specific comment
   */
  get: async (commentId: number): Promise<ProjectComment> => {
    const response = await apiClient.get<ProjectComment>(`/v1/project-comments/${commentId}`);
    return extractApiData<ProjectComment>(response);
  },

  /**
   * Create a comment
   */
  create: async (data: ProjectCommentCreate): Promise<ProjectComment> => {
    const response = await apiClient.post<ProjectComment>('/v1/project-comments', data);
    return extractApiData<ProjectComment>(response);
  },

  /**
   * Update a comment
   */
  update: async (commentId: number, data: ProjectCommentUpdate): Promise<ProjectComment> => {
    const response = await apiClient.put<ProjectComment>(`/v1/project-comments/${commentId}`, data);
    return extractApiData<ProjectComment>(response);
  },

  /**
   * Delete a comment
   */
  delete: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/v1/project-comments/${commentId}`);
  },
};
