'use client';

/**
 * Widget : Croissance Clients
 */

import { LineChart, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { clientsAPI } from '@/lib/api/clients';
import { useEffect, useState } from 'react';

export function ClientsGrowthWidget({ }: WidgetProps) {
  const [growthData, setGrowthData] = useState<{ month: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const clients = await clientsAPI.list();
        
        // Group by month
        const grouped: Record<string, number> = {};
        clients.forEach((client: any) => {
          if (client.created_at) {
            const date = new Date(client.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            grouped[monthKey] = (grouped[monthKey] || 0) + 1;
          }
        });

        // Convert to array and sort
        const data = Object.entries(grouped)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6); // Last 6 months

        setGrowthData(data);
      } catch (error) {
        console.error('Error loading clients growth:', error);
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
        icon={LineChart}
        title="Aucune donnée"
        description="Pas assez de données pour afficher la croissance."
        variant="compact"
      />
    );
  }

  const maxCount = Math.max(...growthData.map(d => d.count), 1);
  const lastItem = growthData[growthData.length - 1];
  const firstItem = growthData[0];
  const totalGrowth = growthData.length > 1 && lastItem && firstItem
    ? ((lastItem.count - firstItem.count) / Math.max(firstItem.count, 1)) * 100
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Croissance</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              totalGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
              <TrendingUp className={`w-5 h-5 ${totalGrowth < 0 ? 'rotate-180' : ''}`} />
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-2">
        {growthData.map((item, index) => {
          const height = (item.count / maxCount) * 100;
          const monthLabel = new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short' });
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '100px' }}>
                <div
                  className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all hover:bg-blue-700 dark:hover:bg-blue-400"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                  title={`${item.count} clients`}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{monthLabel}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
