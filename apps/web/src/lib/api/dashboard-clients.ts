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
    const response = await apiClient.get(`/v1/commercial/companies/stats?period=${period}`);
    const data = response.data as ClientsStatsResponse;
    
    // Validate response structure
    if (data && typeof data === 'object' && 'count' in data) {
      return data;
    }
    
    // If response structure is invalid, fall through to fallback
    throw new Error('Invalid response structure from stats endpoint');
  } catch (error) {
    console.warn('Error fetching clients stats from endpoint, calculating from list:', error);
    
    // Fallback: calculate from companies list if stats endpoint doesn't exist or fails
    try {
      const companiesResponse = await apiClient.get('/v1/commercial/companies?limit=10000');
      const companiesData = companiesResponse.data as { items?: any[] } | any[] | undefined;
      const companies = (Array.isArray(companiesData) ? companiesData : companiesData?.items || []) as any[];
      
      if (!companies || companies.length === 0) {
        console.warn('No companies found in fallback calculation');
        return {
          count: 0,
          growth: 0,
          previous_count: 0,
          new_this_month: 0,
          active_count: 0,
        };
      }
      
      // Calculate stats from raw data
      const now = new Date();
      const periodStart = getPeriodStart(now, period);
      
      const currentCount = companies.length;
      const newThisPeriod = companies.filter((c: any) => {
        if (!c.created_at) return false;
        try {
          return new Date(c.created_at) >= periodStart;
        } catch {
          return false;
        }
      }).length;
      
      const previousCount = companies.filter((c: any) => {
        if (!c.created_at) return false;
        try {
          return new Date(c.created_at) < periodStart;
        } catch {
          return false;
        }
      }).length;
      
      const growth = previousCount > 0 
        ? ((currentCount - previousCount) / previousCount) * 100 
        : (currentCount > 0 ? 100 : 0); // 100% growth if we went from 0 to currentCount
      
      const activeCount = companies.filter((c: any) => c.is_client === true).length;
      
      console.log('Clients stats calculated from fallback:', {
        currentCount,
        previousCount,
        newThisPeriod,
        growth,
        activeCount,
      });
      
      return {
        count: currentCount,
        growth: Math.round(growth * 10) / 10,
        previous_count: previousCount,
        new_this_month: newThisPeriod,
        active_count: activeCount || currentCount,
      };
    } catch (fallbackError) {
      console.error('Error in fallback calculation for clients stats:', fallbackError);
      // Return zero values only as last resort
      return {
        count: 0,
        growth: 0,
        previous_count: 0,
        new_this_month: 0,
        active_count: 0,
      };
    }
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
