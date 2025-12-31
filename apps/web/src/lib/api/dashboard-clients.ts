/**
 * API Client for Dashboard Clients Widget
 * 
 * This module provides functions to fetch clients/companies data for the dashboard.
 * Used by ClientsCountWidget to display client statistics and growth metrics.
 * 
 * @module dashboard-clients
 */

import { apiClient } from './client';

export interface ClientsStatsResponse {
  count: number;
  growth: number;
  previous_count: number;
  new_this_month: number;
  active_count: number;
}

/**
 * Fetch clients statistics for dashboard widget
 * 
 * @param params - Query parameters
 * @param params.period - Time period for comparison ('day' | 'week' | 'month' | 'quarter' | 'year')
 * @returns Promise with clients statistics
 */
export async function fetchClientsStats(params?: {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}): Promise<ClientsStatsResponse> {
  const period = params?.period || 'month';
  
  try {
    const response = await apiClient.get(`/api/v1/commercial/companies/stats?period=${period}`);
    return response.data as ClientsStatsResponse;
  } catch (error) {
    // Fallback: calculate from companies list if stats endpoint doesn't exist
    const companiesResponse = await apiClient.get('/api/v1/commercial/companies');
    const companiesData = companiesResponse.data as { items?: any[] } | any[] | undefined;
    const companies = (Array.isArray(companiesData) ? companiesData : companiesData?.items || []) as any[];
    
    // Calculate stats from raw data
    const now = new Date();
    const periodStart = getPeriodStart(now, period);
    
    const currentCount = companies.length;
    const newThisMonth = companies.filter((c: any) => 
      new Date(c.created_at) >= periodStart
    ).length;
    
    const previousCount = companies.filter((c: any) => 
      new Date(c.created_at) < periodStart
    ).length;
    
    const growth = previousCount > 0 
      ? ((currentCount - previousCount) / previousCount) * 100 
      : 0;
    
    return {
      count: currentCount,
      growth: Math.round(growth * 10) / 10,
      previous_count: previousCount,
      new_this_month: newThisMonth,
      active_count: currentCount,
    };
  }
}

/**
 * Helper function to get period start date
 */
function getPeriodStart(from: Date, period: string): Date {
  const date = new Date(from);
  
  switch (period) {
    case 'day':
      date.setDate(date.getDate() - 1);
      break;
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'quarter':
      date.setMonth(date.getMonth() - 3);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      break;
  }
  
  return date;
}
