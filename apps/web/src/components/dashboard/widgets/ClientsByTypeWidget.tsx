'use client';

/**
 * Widget : Répartition des Clients par Type
 * Répartition des clients par type
 */

import { Building2 } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { clientsAPI } from '@/lib/api/clients';
import { useEffect, useState } from 'react';
import {
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface TypeData {
  type: string;
  count: number;
  percentage: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value} client{(data.value as number) !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload?.percentage?.toFixed(1) || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export function ClientsByTypeWidget({ }: WidgetProps) {
  const [typeData, setTypeData] = useState<TypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const clients = await clientsAPI.list();
        
        // Filter active clients
        const activeClients = clients.filter((client: any) => 
          client.status === 'ACTIVE' || !client.status
        );
        
        setTotal(activeClients.length);
        
        // Group by type
        const grouped: Record<string, number> = {};
        activeClients.forEach((client: any) => {
          const type = client.type || 'Non spécifié';
          grouped[type] = (grouped[type] || 0) + 1;
        });

        // Convert to array with percentages
        const data: TypeData[] = Object.entries(grouped)
          .map(([type, count]) => ({
            type,
            count,
            percentage: activeClients.length > 0 ? (count / activeClients.length) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setTypeData(data);
      } catch (error) {
        console.error('Error loading clients by type:', error);
        setTypeData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (typeData.length === 0 || total === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aucune donnée"
        description="Les données de répartition par type apparaîtront ici."
        variant="compact"
      />
    );
  }

  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#6b7280', // gray-500
  ];

  const chartData = typeData.map(item => ({
    name: item.type,
    value: item.count,
    percentage: item.percentage,
  }));

  const COLORS = chartData.map((_, index) => colors[index % colors.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total clients actifs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Types</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{typeData.length}</p>
          </div>
        </div>
      </div>

      {/* Chart - Use BarChart for better readability */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs max-h-24 overflow-y-auto">
          {typeData.slice(0, 8).map((item, index) => (
            <div key={item.type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-600 dark:text-gray-400 truncate">{item.type}</span>
              <span className="ml-auto font-semibold text-gray-900 dark:text-white">
                {item.count}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({item.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
