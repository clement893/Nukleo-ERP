/**
 * API Client for Dashboard Clients Widget
 * 
 * This module provides functions to fetch clients/companies data for the dashboard.
 * Used by ClientsCountWidget to display client statistics and growth metrics.
 * 
 * @module dashboard-clients
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface ClientsStatsResponse {
  count: number;
  growth: number;
  previous_count: number;
  new_this_month: number;
  active_count: number;
  active_growth?: number;
  previous_active_count?: number;
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
    // Use the same endpoint as the clients page: /v1/projects/clients
    // This endpoint returns clients from the clients table with type='company'
    const clientsResponse = await apiClient.get('/v1/projects/clients?limit=10000');
    
    // Extract data using the standard utility function
    const clientsData = extractApiData<any[]>(clientsResponse);
    
    // Ensure we have an array
    const clients = Array.isArray(clientsData) ? clientsData : [];
    
    console.log('[fetchClientsStats] Raw response:', {
      responseType: typeof clientsResponse,
      hasData: 'data' in clientsResponse,
      extractedDataType: Array.isArray(clientsData) ? 'array' : typeof clientsData,
      extractedDataLength: Array.isArray(clientsData) ? clientsData.length : 'N/A',
      clientsLength: clients.length,
    });
    
    if (!clients || clients.length === 0) {
      console.warn('[fetchClientsStats] No clients found from /v1/projects/clients', {
        clientsData,
        clientsResponse: clientsResponse?.data,
      });
      return {
        count: 0,
        growth: 0,
        previous_count: 0,
        new_this_month: 0,
        active_count: 0,
        active_growth: 0,
        previous_active_count: 0,
      };
    }
    
    // Calculate stats from clients data
    const now = new Date();
    const periodStart = getPeriodStart(now, period);
    
    const currentCount = clients.length;
    const newThisPeriod = clients.filter((c: any) => {
      if (!c.created_at) return false;
      try {
        return new Date(c.created_at) >= periodStart;
      } catch {
        return false;
      }
    }).length;
    
    const previousCount = clients.filter((c: any) => {
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
    
    // Calculate active clients stats (clients with status='ACTIVE')
    const activeCount = clients.filter((c: any) => c.status === 'ACTIVE' || c.status === 'active').length;
    const previousActiveCount = clients.filter((c: any) => {
      if (!c.created_at) return false;
      const isActive = c.status === 'ACTIVE' || c.status === 'active';
      if (!isActive) return false;
      try {
        return new Date(c.created_at) < periodStart;
      } catch {
        return false;
      }
    }).length;
    
    const activeGrowth = previousActiveCount > 0
      ? ((activeCount - previousActiveCount) / previousActiveCount) * 100
      : (activeCount > 0 ? 100 : 0); // 100% growth if we went from 0 to activeCount
    
    console.log('[fetchClientsStats] Clients stats calculated:', {
      totalClients: clients.length,
      currentCount,
      previousCount,
      newThisPeriod,
      growth: `${growth.toFixed(1)}%`,
      activeCount,
      previousActiveCount,
      activeGrowth: `${activeGrowth.toFixed(1)}%`,
    });
    
    return {
      count: currentCount,
      growth: Math.round(growth * 10) / 10,
      previous_count: previousCount,
      new_this_month: newThisPeriod,
      active_count: activeCount || currentCount,
      active_growth: Math.round(activeGrowth * 10) / 10,
      previous_active_count: previousActiveCount,
    };
  } catch (error) {
    console.error('[fetchClientsStats] Error fetching clients stats from /v1/projects/clients:', error);
    // Return zero values on error
    return {
      count: 0,
      growth: 0,
      previous_count: 0,
      new_this_month: 0,
      active_count: 0,
      active_growth: 0,
      previous_active_count: 0,
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
