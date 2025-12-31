/**
 * Project Attachments API
 * API client for project/task attachments endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface ProjectAttachment {
  id: number;
  project_id?: number | null;
  task_id?: number | null;
  file_id?: string | null;
  file_url: string;
  filename: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  description?: string | null;
  uploaded_by_id?: number | null;
  uploaded_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAttachmentCreate {
  project_id?: number | null;
  task_id?: number | null;
  description?: string | null;
}

/**
 * Project Attachments API client
 */
export const projectAttachmentsAPI = {
  /**
   * List attachments
   */
  list: async (params?: { project_id?: number; task_id?: number; skip?: number; limit?: number }): Promise<ProjectAttachment[]> => {
    const response = await apiClient.get<ProjectAttachment[]>('/v1/project-attachments', { params });
    return extractApiData<ProjectAttachment[]>(response) || [];
  },

  /**
   * Get a specific attachment
   */
  get: async (attachmentId: number): Promise<ProjectAttachment> => {
    const response = await apiClient.get<ProjectAttachment>(`/v1/project-attachments/${attachmentId}`);
    return extractApiData<ProjectAttachment>(response);
  },

  /**
   * Upload an attachment
   */
  upload: async (
    file: File,
    params: { project_id?: number; task_id?: number; description?: string }
  ): Promise<ProjectAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const queryParams = new URLSearchParams();
    if (params.project_id) queryParams.append('project_id', params.project_id.toString());
    if (params.task_id) queryParams.append('task_id', params.task_id.toString());
    if (params.description) queryParams.append('description', params.description);
    
    const response = await apiClient.post<ProjectAttachment>(
      `/v1/project-attachments?${queryParams.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return extractApiData<ProjectAttachment>(response);
  },

  /**
   * Update an attachment
   */
  update: async (attachmentId: number, data: { description?: string }): Promise<ProjectAttachment> => {
    const response = await apiClient.put<ProjectAttachment>(`/v1/project-attachments/${attachmentId}`, data);
    return extractApiData<ProjectAttachment>(response);
  },

  /**
   * Delete an attachment
   */
  delete: async (attachmentId: number): Promise<void> => {
    await apiClient.delete(`/v1/project-attachments/${attachmentId}`);
  },
};
