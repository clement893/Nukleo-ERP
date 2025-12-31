/**
 * Hook personnalisé pour gérer les données des widgets
 */

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import type { WidgetConfig, GlobalFilters, WidgetType } from '@/lib/dashboard/types';

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
      // TODO: Implémenter les appels API spécifiques par type de widget
      // Pour l'instant, on retourne des données factices
      return fetchWidgetData(widgetType);
    },
    enabled,
    staleTime: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : 5 * 60 * 1000, // 5 minutes par défaut
    refetchInterval: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : false,
  });
}

/**
 * Fonction pour récupérer les données d'un widget
 * À implémenter avec les vrais appels API
 */
async function fetchWidgetData(
  widgetType: WidgetType
): Promise<any> {
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Retourner des données factices selon le type de widget
  switch (widgetType) {
    case 'opportunities-list':
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
          {
            id: 2,
            name: 'Rapport Annuel 2024',
            company: 'Maison Jean Lapointe',
            amount: 12000,
            stage: 'Qualifié',
            probability: 60,
            created_at: '2025-01-20',
          },
        ],
        total: 2,
      };
    
    case 'clients-count':
      return {
        count: 155,
        growth: 15.2,
        previous_count: 135,
      };
    
    case 'projects-active':
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
          {
            id: 2,
            name: 'Rapport Annuel 2024',
            client: 'Maison Jean Lapointe',
            progress: 60,
            status: 'ACTIVE',
            due_date: '2025-03-15',
          },
        ],
        total: 15,
      };
    
    case 'revenue-chart':
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
