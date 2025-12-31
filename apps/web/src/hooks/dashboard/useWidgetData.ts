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
        return await fetchWidgetData(widgetType, config, globalFilters);
      } catch (error) {
        // Log error but don't throw - let React Query handle it
        console.error(`Error fetching widget data for ${widgetType}:`, error);
        // Re-throw so React Query can handle it properly
        throw error;
      }
    },
    enabled,
    staleTime: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : 5 * 60 * 1000, // 5 minutes par défaut
    refetchInterval: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : false,
    // Don't throw errors - let components handle them
    throwOnError: false,
  });
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
  
  // Appeler les vrais endpoints API
  switch (widgetType) {
    case 'opportunities-list':
      try {
        const data = await fetchDashboardOpportunities({
          limit: 5,
          offset: 0,
          company_id: globalFilters?.company_id,
        });
        return data;
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        // Fallback to sample data
        return {
          opportunities: [
            {
              id: 1,
              name: 'Site Web CDÉNÉ',
              company: 'CDÉNÉ',
              amount: 45000,
              stage: 'Proposition',
              probability: 75,
              created_at: '2025-01-15',
            },
          ],
          total: 1,
        };
      }
    
    case 'clients-count':
      try {
        const period = config?.period && config.period !== 'custom' ? config.period : 'month';
        const data = await fetchClientsStats({
          period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
        });
        return data;
      } catch (error) {
        console.error('Error fetching clients stats:', error);
        return {
          count: 155,
          growth: 15.2,
          previous_count: 135,
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
        return data;
      } catch (error) {
        console.error('Error fetching projects:', error);
        return {
          projects: [
            {
              id: 1,
              name: 'Site Web CDÉNÉ',
              client: 'CDÉNÉ',
              progress: 80,
              status: 'ACTIVE',
              due_date: '2025-02-28',
            },
          ],
          total: 1,
        };
      }
    
    case 'revenue-chart':
      try {
        const period = config?.period && config.period !== 'custom' ? config.period : 'month';
        const data = await fetchDashboardRevenue({
          period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
          months: 6,
        });
        return data;
      } catch (error) {
        console.error('Error fetching revenue:', error);
        return {
          data: [
            { month: 'Jan', value: 65000 },
            { month: 'Fév', value: 59000 },
            { month: 'Mar', value: 80000 },
            { month: 'Avr', value: 81000 },
            { month: 'Mai', value: 56000 },
            { month: 'Jun', value: 55000 },
          ],
          total: 396000,
          growth: 15.3,
        };
      }
    
    case 'kpi-custom':
      return {
        value: 42.5,
        unit: '%',
        label: 'Taux de conversion',
        growth: 5.2,
        target: 45,
        progress: 94,
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
