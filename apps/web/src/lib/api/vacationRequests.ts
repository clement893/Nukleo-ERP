/**
 * Vacation Requests API
 * API client for vacation requests endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface VacationRequest {
  id: number;
  employee_id: number;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by_id?: number | null;
  approved_at?: string | null; // ISO datetime string
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields when fetched with employee info
  employee_first_name?: string;
  employee_last_name?: string;
  employee_email?: string;
  approved_by_name?: string;
}

export interface VacationRequestCreate {
  employee_id: number;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  reason?: string | null;
}

export interface VacationRequestUpdate {
  start_date?: string;
  end_date?: string;
  reason?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string | null;
}

export interface VacationRequestApprove {
  // Empty, no additional fields needed
}

export interface VacationRequestReject {
  rejection_reason?: string | null;
}

/**
 * Vacation Requests API client
 */
export const vacationRequestsAPI = {
  /**
   * Get list of vacation requests with optional filters
   */
  list: async (params?: {
    employee_id?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
    skip?: number;
    limit?: number;
  }): Promise<VacationRequest[]> => {
    const response = await apiClient.get<VacationRequest[]>('/v1/management/vacation-requests', {
      params: {
        ...params,
        _t: Date.now(), // Cache-busting timestamp
      },
    });
    
    const data = extractApiData<VacationRequest[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a vacation request by ID
   */
  get: async (requestId: number): Promise<VacationRequest> => {
    const response = await apiClient.get<VacationRequest>(`/v1/management/vacation-requests/${requestId}`);
    const data = extractApiData<VacationRequest>(response);
    if (!data) {
      throw new Error(`Vacation request not found: ${requestId}`);
    }
    return data;
  },

  /**
   * Create a new vacation request
   */
  create: async (request: VacationRequestCreate): Promise<VacationRequest> => {
    const response = await apiClient.post<VacationRequest>('/v1/management/vacation-requests', request);
    const data = extractApiData<VacationRequest>(response);
    if (!data) {
      throw new Error('Failed to create vacation request: no data returned');
    }
    return data;
  },

  /**
   * Update a vacation request
   */
  update: async (requestId: number, request: VacationRequestUpdate): Promise<VacationRequest> => {
    const response = await apiClient.put<VacationRequest>(
      `/v1/management/vacation-requests/${requestId}`,
      request
    );
    const data = extractApiData<VacationRequest>(response);
    if (!data) {
      throw new Error('Failed to update vacation request: no data returned');
    }
    return data;
  },

  /**
   * Approve a vacation request
   */
  approve: async (requestId: number): Promise<VacationRequest> => {
    const response = await apiClient.post<VacationRequest>(
      `/v1/management/vacation-requests/${requestId}/approve`,
      {}
    );
    const data = extractApiData<VacationRequest>(response);
    if (!data) {
      throw new Error('Failed to approve vacation request: no data returned');
    }
    return data;
  },

  /**
   * Reject a vacation request
   */
  reject: async (requestId: number, rejectionReason?: string): Promise<VacationRequest> => {
    const response = await apiClient.post<VacationRequest>(
      `/v1/management/vacation-requests/${requestId}/reject`,
      { rejection_reason: rejectionReason || null }
    );
    const data = extractApiData<VacationRequest>(response);
    if (!data) {
      throw new Error('Failed to reject vacation request: no data returned');
    }
    return data;
  },

  /**
   * Delete a vacation request
   */
  delete: async (requestId: number): Promise<void> => {
    await apiClient.delete(`/v1/management/vacation-requests/${requestId}`);
  },
};
