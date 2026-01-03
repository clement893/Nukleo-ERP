'use client';

/**
 * Widget : Tâches par Priorité
 * Répartition des tâches par niveau de priorité
 */

import { AlertCircle, Target } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectTasksAPI } from '@/lib/api/project-tasks';
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

interface PriorityData {
  priority: string;
  count: number;
  label: string;
  percentage: number;
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
          {data.value} tâche{(data.value as number) !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.percentage?.toFixed(1) || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export function TasksByPriorityWidget({ }: WidgetProps) {
  const [priorityData, setPriorityData] = useState<PriorityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const tasks = await projectTasksAPI.list();
        
        setTotal(tasks.length);
        
        // Group by priority
        const grouped: Record<string, number> = {};
        tasks.forEach((task: any) => {
          const priority = task.priority || 'medium';
          grouped[priority] = (grouped[priority] || 0) + 1;
        });

        const priorityLabels: Record<string, string> = {
          'urgent': 'Urgente',
          'high': 'Haute',
          'medium': 'Moyenne',
          'low': 'Basse',
        };

        const priorityColors: Record<string, string> = {
          'urgent': '#ef4444', // red
          'high': '#f59e0b', // amber
          'medium': '#3b82f6', // blue
          'low': '#6b7280', // gray
        };

        // Convert to array with percentages
        const data: PriorityData[] = Object.entries(grouped)
          .map(([priority, count]) => ({
            priority,
            count,
            label: priorityLabels[priority] || priority,
            percentage: tasks.length > 0 ? (count / tasks.length) * 100 : 0,
          }))
          .sort((a, b) => {
            // Sort by priority order
            const order: Record<string, number> = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
            return (order[a.priority] || 99) - (order[b.priority] || 99);
          });

        setPriorityData(data);
      } catch (error) {
        console.error('Error loading tasks by priority:', error);
        setPriorityData([]);
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

  if (priorityData.length === 0 || total === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Aucune donnée"
        description="Créez des tâches pour voir la répartition par priorité."
        variant="compact"
      />
    );
  }

  const priorityColors: Record<string, string> = {
    'urgent': '#ef4444',
    'high': '#f59e0b',
    'medium': '#3b82f6',
    'low': '#6b7280',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total tâches</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Urgentes</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {priorityData.find(p => p.priority === 'urgent')?.count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priorityData}>
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
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={priorityColors[entry.priority] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
