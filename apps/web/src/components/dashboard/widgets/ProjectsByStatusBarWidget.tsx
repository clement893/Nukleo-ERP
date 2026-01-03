'use client';

/**
 * Widget : Projets par Statut (BarChart)
 * Répartition des projets par statut en barres
 */

import { BarChart3 } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/lib/api/projects';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface StatusData {
  status: string;
  count: number;
  label: string;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value} projet{(data.value as number) !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function ProjectsByStatusBarWidget({ }: WidgetProps) {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        
        setTotal(projects.length);
        
        // Group by status
        const grouped: Record<string, number> = {};
        projects.forEach((project: any) => {
          const status = (project.status || 'active').toLowerCase();
          grouped[status] = (grouped[status] || 0) + 1;
        });

        const statusLabels: Record<string, string> = {
          'active': 'Actifs',
          'completed': 'Terminés',
          'archived': 'Archivés',
        };

        // Convert to array
        const data: StatusData[] = Object.entries(grouped)
          .map(([status, count]) => ({
            status,
            count,
            label: statusLabels[status] || status,
          }))
          .sort((a, b) => b.count - a.count);

        setStatusData(data);
      } catch (error) {
        console.error('Error loading projects by status:', error);
        setStatusData([]);
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

  if (statusData.length === 0 || total === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Aucune donnée"
        description="Créez des projets pour voir la répartition par statut."
        variant="compact"
      />
    );
  }

  const statusColors: Record<string, string> = {
    'active': '#10b981',
    'completed': '#3b82f6',
    'archived': '#6b7280',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total projets</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
