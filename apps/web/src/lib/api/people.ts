/**
 * People API
 * API client for people endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export type PeopleStatus = 'active' | 'inactive' | 'maintenance';

export interface People {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  birthday?: string | null; // ISO date string
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
  status: PeopleStatus;
  created_at: string;
  updated_at: string;
}

export interface PeopleCreate {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  birthday?: string | null; // ISO date string (YYYY-MM-DD)
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  comments?: string | null;
  portal_url?: string | null;
  status?: PeopleStatus;
}

export interface PeopleUpdate extends Partial<PeopleCreate> {}

/**
 * People API client
 */
export const peopleAPI = {
  /**
   * Get list of people with pagination
   */
  list: async (skip = 0, limit = 100, filters?: { status?: string; search?: string }): Promise<People[]> => {
    const skipNum = Number(skip);
    const limitNum = Number(limit);
    
    // Log parameters before sending
    console.log('[PeopleAPI] list() called with:', {
      skip: { original: skip, type: typeof skip, converted: skipNum, isNaN: isNaN(skipNum) },
      limit: { original: limit, type: typeof limit, converted: limitNum, isNaN: isNaN(limitNum) },
      filters,
    });
    
    const params = { 
      skip: skipNum, 
      limit: limitNum,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
    };
    
    console.log('[PeopleAPI] Sending request with params:', params, 'Types:', {
      skip: typeof params.skip,
      limit: typeof params.limit,
    });
    
    try {
      const response = await apiClient.get<People[]>('/v1/projects/people', { params });
      console.log('[PeopleAPI] Response received:', {
        success: response.success,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
      });
    
      const data = extractApiData<People[] | { items: People[] }>(response);
      console.log('[PeopleAPI] Extracted data:', {
        isArray: Array.isArray(data),
        hasItems: data && typeof data === 'object' && 'items' in data,
        dataType: typeof data,
      });
      
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'items' in data) {
        return (data as { items: People[] }).items;
      }
      return [];
    } catch (error: any) {
      console.error('[PeopleAPI] Error in list():', {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        params: { skip: skipNum, limit: limitNum, filters },
      });
      throw error;
    }
  },

  /**
   * Get a person by ID
   */
  get: async (peopleId: number): Promise<People> => {
    const response = await apiClient.get<People>(`/v1/projects/people/${peopleId}`);
    const data = extractApiData<People>(response);
    if (!data) {
      throw new Error(`Person not found: ${peopleId}`);
    }
    return data;
  },

  /**
   * Create a new person
   */
  create: async (person: PeopleCreate): Promise<People> => {
    const response = await apiClient.post<People>('/v1/projects/people', person);
    const data = extractApiData<People>(response);
    if (!data) {
      throw new Error('Failed to create person: no data returned');
    }
    return data;
  },

  /**
   * Update a person
   */
  update: async (peopleId: number, person: PeopleUpdate): Promise<People> => {
    const response = await apiClient.put<People>(`/v1/projects/people/${peopleId}`, person);
    const data = extractApiData<People>(response);
    if (!data) {
      throw new Error('Failed to update person: no data returned');
    }
    return data;
  },

  /**
   * Delete a person
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/projects/people/${id}`);
  },

  /**
   * Get projects for a person
   */
  getProjects: async (peopleId: number): Promise<Array<{
    id: number;
    name: string;
    description?: string | null;
    status: string;
    client_id?: number | null;
  }>> => {
    const response = await apiClient.get<Array<{
      id: number;
      name: string;
      description?: string | null;
      status: string;
      client_id?: number | null;
    }>>(`/v1/projects/people/${peopleId}/projects`);
    return extractApiData(response) || [];
  },

  /**
   * Get contacts for a person
   */
  getContacts: async (peopleId: number): Promise<Array<Record<string, unknown>>> => {
    const response = await apiClient.get<Array<Record<string, unknown>>>(`/v1/projects/people/${peopleId}/contacts`);
    return extractApiData(response) || [];
  },
};
