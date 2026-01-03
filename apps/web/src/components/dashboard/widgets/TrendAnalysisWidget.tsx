'use client';

/**
 * Widget : Analyse de Tendances
 * Analyse multi-métriques des tendances sur plusieurs périodes
 */

import { TrendingUp, Activity } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { useEffect, useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendData {
  period: string;
  revenue: number;
  opportunities: number;
  tasksCompleted: number;
  growth: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm mb-1">
            <span style={{ color: entry.color }}>●</span>{' '}
            <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {entry.name === 'Revenus' 
                ? entry.value?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) || '0 €'
                : entry.value?.toFixed(0) || '0'
              }
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendAnalysisWidget({ }: WidgetProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallGrowth, setOverallGrowth] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get revenue data (last 6 months)
        const revenueResponse = await fetchDashboardRevenue({ months: 6 });
        const revenueData = revenueResponse.data || [];
        
        // Get opportunities and group by month
        const opportunities = await opportunitiesAPI.list();
        const opportunitiesByMonth: Record<string, number> = {};
        opportunities.forEach((opp: any) => {
          if (opp.created_at) {
            const created = new Date(opp.created_at);
            const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            opportunitiesByMonth[monthKey] = (opportunitiesByMonth[monthKey] || 0) + 1;
          }
        });
        
        // Get tasks and group completed by month
        const tasks = await projectTasksAPI.list();
        const tasksByMonth: Record<string, number> = {};
        tasks.filter((t: any) => t.status === 'completed' && t.completed_at).forEach((task: any) => {
          const completed = new Date(task.completed_at);
          const monthKey = `${completed.getFullYear()}-${String(completed.getMonth() + 1).padStart(2, '0')}`;
          tasksByMonth[monthKey] = (tasksByMonth[monthKey] || 0) + 1;
        });
        
        // Combine data by month
        const combined: TrendData[] = revenueData.map((rev: any, index: number) => {
          const monthKey = rev.month || rev.period || '';
          const revenue = rev.value || rev.revenue || 0;
          const opportunities = opportunitiesByMonth[monthKey] || 0;
          const tasksCompleted = tasksByMonth[monthKey] || 0;
          
          // Calculate growth (simplified: compare to previous period)
          const previousRevenue = index > 0 ? (revenueData[index - 1]?.value || revenueData[index - 1]?.revenue || 0) : revenue;
          const growth = previousRevenue > 0 
            ? ((revenue - previousRevenue) / previousRevenue) * 100 
            : 0;
          
          return {
            period: formatMonthLabel(monthKey),
            revenue,
            opportunities,
            tasksCompleted,
            growth,
          };
        }).slice(-6); // Last 6 months

        setTrendData(combined);
        
        // Calculate overall growth (first vs last)
        if (combined.length > 1) {
          const first = combined[0];
          const last = combined[combined.length - 1];
          const growth = first.revenue > 0 
            ? ((last.revenue - first.revenue) / first.revenue) * 100 
            : 0;
          setOverallGrowth(growth);
        }
      } catch (error) {
        console.error('Error loading trend analysis:', error);
        setTrendData([]);
        setOverallGrowth(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatMonthLabel = (monthKey: string): string => {
    if (!monthKey) return 'N/A';
    const parts = monthKey.split('-');
    if (parts.length >= 2) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }
    return monthKey;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (trendData.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Aucune donnée"
        description="Les données de tendances apparaîtront ici."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Croissance globale</p>
            <p className={`text-2xl font-bold ${
              overallGrowth >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {overallGrowth >= 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Périodes</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {trendData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenus" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="opportunities"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Opportunités"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tasksCompleted"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Tâches complétées"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
