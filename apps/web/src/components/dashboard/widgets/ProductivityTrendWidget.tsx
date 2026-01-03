'use client';

/**
 * Widget : Tendance Productivité
 * Évolution de la productivité de l'équipe (tâches complétées par période)
 */

import { TrendingUp, Activity } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface ProductivityDataPoint {
  week: string;
  completed: number;
  total: number;
  productivity: number; // tasks per employee average
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>●</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
              <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ProductivityTrendWidget({ }: WidgetProps) {
  const [productivityData, setProductivityData] = useState<ProductivityDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageProductivity, setAverageProductivity] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const tasks = await projectTasksAPI.list();
        
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
        
        // Group by week
        const grouped: Record<string, number> = {};
        completedTasks.forEach((task: any) => {
          if (!task.completed_at) return;
          
          const completedDate = new Date(task.completed_at);
          const weekKey = getWeekKey(completedDate);
          grouped[weekKey] = (grouped[weekKey] || 0) + 1;
        });
        
        // Convert to array and calculate productivity (tasks per week)
        const data: ProductivityDataPoint[] = Object.entries(grouped)
          .map(([week, completed]) => ({
            week,
            completed,
            total: completed, // For this widget, we focus on completed tasks
            productivity: completed, // Simple metric: tasks completed per week
          }))
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-12); // Last 12 weeks

        // Format week labels
        const formattedData = data.map(item => ({
          ...item,
          week: formatWeekLabel(item.week),
        }));

        setProductivityData(formattedData);
        
        // Calculate average productivity
        if (formattedData.length > 0) {
          const avg = formattedData.reduce((sum, d) => sum + d.productivity, 0) / formattedData.length;
          setAverageProductivity(avg);
        }
      } catch (error) {
        console.error('Error loading productivity trend:', error);
        setProductivityData([]);
        setAverageProductivity(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getWeekKey = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const formatWeekLabel = (weekKey: string): string => {
    const [, week] = weekKey.split('-W');
    return `S${week}`;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (productivityData.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Aucune donnée"
        description="Les données de productivité apparaîtront ici."
        variant="compact"
      />
    );
  }

  const lastWeek = productivityData[productivityData.length - 1];
  const previousWeek = productivityData.length > 1 ? productivityData[productivityData.length - 2] : null;
  const growth = previousWeek && lastWeek && previousWeek.productivity > 0
    ? ((lastWeek.productivity - previousWeek.productivity) / previousWeek.productivity) * 100
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Productivité moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageProductivity.toFixed(1)} tâches/semaine</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Évolution</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              growth >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {growth >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5 rotate-180" />
              )}
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={productivityData}>
            <defs>
              <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="week"
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
            <Area
              type="monotone"
              dataKey="productivity"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#productivityGradient)"
              name="Tâches complétées"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
