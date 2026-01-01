/**
 * Hook personnalisé pour gérer les données des widgets
 */

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import type { WidgetConfig, GlobalFilters, WidgetType } from '@/lib/dashboard/types';
import { fetchDashboardOpportunities } from '@/lib/api/dashboard-opportunities';
import { fetchClientsStats } from '@/lib/api/dashboard-clients';
import { fetchDashboardProjects } from '@/lib/api/dashboard-projects';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';

interface UseWidgetDataOptions {
  widgetType: WidgetType;
  config: WidgetConfig;
  globalFilters?: GlobalFilters;
  enabled?: boolean;
}

/**
 * Hook pour récupérer les données d'un widget
 */
export function useWidgetData<T = any>({
  widgetType,
  config,
  globalFilters,
  enabled = true,
}: UseWidgetDataOptions): UseQueryResult<T> {
  return useQuery({
    queryKey: ['widget-data', widgetType, config, globalFilters],
    queryFn: async () => {
      try {
        // TODO: Implémenter les appels API spécifiques par type de widget
        // Pour l'instant, on retourne des données factices
        const result = await fetchWidgetData(widgetType, config, globalFilters);
        // Ensure we always return valid data
        if (!result) {
          throw new Error(`No data returned for widget ${widgetType}`);
        }
        return result;
      } catch (error) {
        // Log error for debugging
        console.error(`Error fetching widget data for ${widgetType}:`, error);
        // Return fallback data instead of throwing
        // This ensures widgets always have data to display
        return getFallbackData(widgetType) as T;
      }
    },
    enabled,
    staleTime: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : 5 * 60 * 1000, // 5 minutes par défaut
    refetchInterval: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : false,
    // Don't throw errors - return fallback data instead
    throwOnError: false,
    retry: 1, // Retry once on failure
    retryDelay: 1000,
  });
}

/**
 * Get fallback data for a widget type when API calls fail
 */
function getFallbackData(widgetType: WidgetType): any {
  switch (widgetType) {
    case 'opportunities-list':
      return {
        opportunities: [],
        total: 0,
        page: 1,
        page_size: 10,
      };
    
    case 'clients-count':
      return {
        count: 0,
        growth: 0,
        previous_count: 0,
        new_this_month: 0,
        active_count: 0,
        active_growth: 0,
        previous_active_count: 0,
      };
    
    case 'projects-active':
      return {
        projects: [],
        total: 0,
        page: 1,
        page_size: 10,
      };
    
    case 'revenue-chart':
      return {
        data: [],
        total: 0,
        growth: 0,
        period: 'month',
      };
    
    case 'kpi-custom':
      return {
        value: 0,
        unit: '%',
        label: 'KPI',
        growth: 0,
        target: 0,
        progress: 0,
      };
    
    default:
      return {
        message: 'Widget data not available',
        widgetType,
      };
  }
}

/**
 * Fonction pour récupérer les données d'un widget
 * Utilise les vrais appels API avec fallback sur données factices
 */
async function fetchWidgetData(
  widgetType: WidgetType,
  config?: WidgetConfig,
  globalFilters?: GlobalFilters
): Promise<any> {
  
  // Appeler les vrais endpoints API avec gestion d'erreur robuste
  switch (widgetType) {
    case 'opportunities-list':
      try {
        const data = await fetchDashboardOpportunities({
          limit: 5,
          offset: 0,
          company_id: globalFilters?.company_id,
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'opportunities' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching opportunities, using empty data:', error);
        // Return empty data instead of sample data
        return {
          opportunities: [],
          total: 0,
          page: 1,
          page_size: 10,
        };
      }
    
    case 'clients-count':
      try {
        const period = config?.period && config.period !== 'custom' ? config.period : 'month';
        const data = await fetchClientsStats({
          period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'count' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching clients stats, using empty data:', error);
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
    
    case 'projects-active':
      try {
        const data = await fetchDashboardProjects({
          limit: 5,
          offset: 0,
          status: 'ACTIVE',
          client_id: globalFilters?.company_id,
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'projects' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching projects, using empty data:', error);
        return {
          projects: [],
          total: 0,
          page: 1,
          page_size: 10,
        };
      }
    
    case 'revenue-chart':
      const period = config?.period && config.period !== 'custom' ? config.period : 'month';
      try {
        const data = await fetchDashboardRevenue({
          period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
          months: 6,
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching revenue, using empty data:', error);
        return {
          data: [],
          total: 0,
          growth: 0,
          period: period || 'month',
        };
      }
    
    case 'kpi-custom':
      // KPI widget doesn't need API call, return default data
      return {
        value: 0,
        unit: '%',
        label: 'KPI',
        growth: 0,
        target: config?.target || 0,
        progress: 0,
      };
    
    default:
      return {
        message: 'Widget data not implemented yet',
        widgetType,
      };
  }
}

/**
 * Hook pour rafraîchir manuellement les données d'un widget
 */
export function useWidgetRefresh(widgetType: WidgetType) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({
      queryKey: ['widget-data', widgetType],
    });
  };
}
