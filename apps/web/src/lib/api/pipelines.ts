/**
 * Pipelines API
 * API client for commercial pipelines endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_by_id?: string | null;
  created_at: string;
  updated_at: string;
  stages: PipelineStage[];
  opportunity_count?: number;
}

export interface PipelineStageCreate {
  name: string;
  description?: string | null;
  color?: string | null;
  order?: number;
}

export interface PipelineCreate {
  name: string;
  description?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  stages?: PipelineStageCreate[];
}

export interface PipelineUpdate {
  name?: string;
  description?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

/**
 * Pipelines API client
 */
export const pipelinesAPI = {
  /**
   * Get list of pipelines with pagination
   */
  list: async (
    skip = 0,
    limit = 100,
    is_active?: boolean
  ): Promise<Pipeline[]> => {
    const params: Record<string, string | number | boolean> = {
      skip: Number(skip),
      limit: Number(limit),
      _t: Date.now(), // Cache-busting timestamp
    };

    if (is_active !== undefined && is_active !== null) {
      // is_active is already a boolean, just assign it
      params.is_active = Boolean(is_active);
    }

    const response = await apiClient.get<Pipeline[]>('/v1/commercial/pipelines', {
      params,
    });

    const data = extractApiData<Pipeline[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a pipeline by ID
   */
  get: async (pipelineId: string): Promise<Pipeline> => {
    const response = await apiClient.get<Pipeline>(`/v1/commercial/pipelines/${pipelineId}`);
    const data = extractApiData<Pipeline>(response);
    if (!data) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }
    return data;
  },

  /**
   * Create a new pipeline
   */
  create: async (pipeline: PipelineCreate): Promise<Pipeline> => {
    const response = await apiClient.post<Pipeline>('/v1/commercial/pipelines', pipeline);
    const data = extractApiData<Pipeline>(response);
    if (!data) {
      throw new Error('Failed to create pipeline: no data returned');
    }
    return data;
  },

  /**
   * Update a pipeline
   */
  update: async (pipelineId: string, pipeline: PipelineUpdate): Promise<Pipeline> => {
    const response = await apiClient.put<Pipeline>(
      `/v1/commercial/pipelines/${pipelineId}`,
      pipeline
    );
    const data = extractApiData<Pipeline>(response);
    if (!data) {
      throw new Error('Failed to update pipeline: no data returned');
    }
    return data;
  },

  /**
   * Delete a pipeline
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/commercial/pipelines/${id}`);
  },
};
