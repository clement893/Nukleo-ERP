/**
 * API Client for Dashboard Opportunities Widget
 * 
 * This module provides functions to fetch opportunities data for the dashboard.
 * Used by OpportunitiesListWidget to display real-time opportunity information.
 * 
 * @module dashboard-opportunities
 */

import { apiClient } from './client';

export interface OpportunityListItem {
  id: number;
  name: string;
  company: string;
  company_id: number;
  amount: number;
  stage: string;
  probability: number;
  created_at: string;
  updated_at: string;
}

export interface OpportunitiesResponse {
  opportunities: OpportunityListItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Fetch opportunities for dashboard widget
 * 
 * @param params - Query parameters
 * @param params.limit - Number of opportunities to fetch (default: 5)
 * @param params.offset - Offset for pagination (default: 0)
 * @param params.stage - Filter by stage (optional)
 * @param params.company_id - Filter by company (optional)
 * @returns Promise with opportunities data
 */
export async function fetchDashboardOpportunities(params?: {
  limit?: number;
  offset?: number;
  stage?: string;
  company_id?: number;
}): Promise<OpportunitiesResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.stage) queryParams.append('stage', params.stage);
  if (params?.company_id) queryParams.append('company_id', params.company_id.toString());

  const response = await apiClient.get(
    `/api/v1/commercial/opportunities?${queryParams.toString()}`
  );

  return {
    opportunities: response.data.items || [],
    total: response.data.total || 0,
    page: response.data.page || 1,
    page_size: response.data.page_size || 10,
  };
}

/**
 * Fetch opportunities statistics
 * 
 * @returns Promise with opportunities statistics
 */
export async function fetchOpportunitiesStats(): Promise<{
  total: number;
  by_stage: Record<string, number>;
  total_amount: number;
  avg_probability: number;
}> {
  const response = await apiClient.get('/api/v1/commercial/opportunities/stats');
  return response.data;
}
