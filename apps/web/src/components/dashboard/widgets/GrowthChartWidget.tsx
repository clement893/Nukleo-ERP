'use client';

/**
 * Widget : Croissance Globale
 */

import { TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { clientsAPI } from '@/lib/api/clients';
import { projectsAPI } from '@/lib/api/projects';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';

export function GrowthChartWidget({ }: WidgetProps) {
  const [growthData, setGrowthData] = useState<{ month: string; clients: number; projects: number; opportunities: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [clients, projects, opportunities] = await Promise.all([
          clientsAPI.list(),
          projectsAPI.list(),
          opportunitiesAPI.list(0, 1000),
        ]);
        
        // Group by month
        const clientsByMonth: Record<string, number> = {};
        const projectsByMonth: Record<string, number> = {};
        const opportunitiesByMonth: Record<string, number> = {};
        
        clients.forEach((client: any) => {
          if (client.created_at) {
            const date = new Date(client.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            clientsByMonth[monthKey] = (clientsByMonth[monthKey] || 0) + 1;
          }
        });
        
        projects.forEach((project: any) => {
          if (project.created_at) {
            const date = new Date(project.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            projectsByMonth[monthKey] = (projectsByMonth[monthKey] || 0) + 1;
          }
        });
        
        opportunities.forEach((opp: any) => {
          if (opp.created_at) {
            const date = new Date(opp.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            opportunitiesByMonth[monthKey] = (opportunitiesByMonth[monthKey] || 0) + 1;
          }
        });
        
        // Combine all months
        const allMonths = new Set([
          ...Object.keys(clientsByMonth),
          ...Object.keys(projectsByMonth),
          ...Object.keys(opportunitiesByMonth),
        ]);
        
        const combined = Array.from(allMonths)
          .map(month => ({
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            clients: clientsByMonth[month] || 0,
            projects: projectsByMonth[month] || 0,
            opportunities: opportunitiesByMonth[month] || 0,
            total: (clientsByMonth[month] || 0) + (projectsByMonth[month] || 0) + (opportunitiesByMonth[month] || 0),
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);
        
        setGrowthData(combined);
      } catch (error) {
        console.error('Error loading growth data:', error);
        setGrowthData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (growthData.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Aucune donnée"
        description="Pas assez de données pour afficher la croissance."
        variant="compact"
      />
    );
  }

  const maxTotal = Math.max(...growthData.map(d => d.clients + d.projects + d.opportunities), 1);

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Croissance globale</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Évolution des clients, projets et opportunités
        </p>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-2">
        {growthData.map((item, index) => {
          const total = item.clients + item.projects + item.opportunities;
          const height = (total / maxTotal) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-end justify-end gap-0.5" style={{ height: '100px' }}>
                <div
                  className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all hover:bg-blue-700 dark:hover:bg-blue-400"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                  title={`Total: ${total} (Clients: ${item.clients}, Projets: ${item.projects}, Opportunités: ${item.opportunities})`}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.month}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
