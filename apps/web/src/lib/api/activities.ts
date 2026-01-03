/**
 * Activities API
 * API client for activity feed endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Activity {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  user_id: number;
  timestamp: string;
  event_metadata?: Record<string, unknown> | null;
}

export interface ActivityFilters {
  entity_type?: string;
  entity_id?: number | string;
  user_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Activities API client
 */
export const activitiesAPI = {
  /**
   * Get activity feed with optional filters
   */
  list: async (filters?: ActivityFilters): Promise<Activity[]> => {
    const params: Record<string, string | number> = {};
    
    if (filters?.entity_type) params.entity_type = filters.entity_type;
    if (filters?.entity_id !== undefined) {
      params.entity_id = typeof filters.entity_id === 'string' 
        ? parseInt(filters.entity_id, 10) 
        : filters.entity_id;
    }
    if (filters?.user_id) params.user_id = filters.user_id;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.offset) params.offset = filters.offset;

    const response = await apiClient.get<Activity[]>('/v1/activities', { params });
    const data = extractApiData<Activity[]>(response);
    return data || [];
  },

  /**
   * Get activity timeline (more results for timeline view)
   */
  getTimeline: async (filters?: ActivityFilters): Promise<Activity[]> => {
    const params: Record<string, string | number> = {};
    
    if (filters?.entity_type) params.entity_type = filters.entity_type;
    if (filters?.entity_id !== undefined) {
      params.entity_id = typeof filters.entity_id === 'string' 
        ? parseInt(filters.entity_id, 10) 
        : filters.entity_id;
    }
    if (filters?.user_id) params.user_id = filters.user_id;
    if (filters?.limit) params.limit = filters.limit;

    const response = await apiClient.get<Activity[]>('/v1/activities/timeline', { params });
    const data = extractApiData<Activity[]>(response);
    return data || [];
  },
};
