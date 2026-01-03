'use client';

/**
 * Widget : Tendance de Complétion des Tâches
 * Tâches complétées par période, vélocité de l'équipe
 */

import { CheckSquare, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { useEffect, useState } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface CompletionDataPoint {
  week: string;
  completed: number;
  created: number;
  velocity: number;
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

export function TasksCompletionTrendWidget({ }: WidgetProps) {
  const [completionData, setCompletionData] = useState<CompletionDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageVelocity, setAverageVelocity] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const tasks = await projectTasksAPI.list();
        
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
        setTotalCompleted(completedTasks.length);
        
        // Group by week
        const grouped: Record<string, { completed: number; created: number }> = {};
        
        // Process completed tasks
        completedTasks.forEach((task: any) => {
          if (!task.completed_at) return;
          
          const completedDate = new Date(task.completed_at);
          const weekKey = getWeekKey(completedDate);
          
          if (!grouped[weekKey]) {
            grouped[weekKey] = { completed: 0, created: 0 };
          }
          
          grouped[weekKey].completed++;
        });
        
        // Process created tasks
        tasks.forEach((task: any) => {
          const createdDate = new Date(task.created_at);
          const weekKey = getWeekKey(createdDate);
          
          if (!grouped[weekKey]) {
            grouped[weekKey] = { completed: 0, created: 0 };
          }
          
          grouped[weekKey].created++;
        });

        // Convert to array and sort (last 8 weeks)
        const data: CompletionDataPoint[] = Object.entries(grouped)
          .map(([week, counts]) => ({
            week,
            ...counts,
            velocity: counts.completed, // Velocity = tasks completed per week
          }))
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-8);

        // Format week labels
        const formattedData = data.map(item => ({
          ...item,
          week: formatWeekLabel(item.week),
        }));

        setCompletionData(formattedData);
        
        // Calculate average velocity
        if (formattedData.length > 0) {
          const avgVel = formattedData.reduce((sum, d) => sum + d.velocity, 0) / formattedData.length;
          setAverageVelocity(avgVel);
        }
      } catch (error) {
        console.error('Error loading tasks completion trend:', error);
        setCompletionData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Helper function to get week key (YYYY-WW format)
  const getWeekKey = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  // Helper function to format week label
  const formatWeekLabel = (weekKey: string): string => {
    const [, week] = weekKey.split('-W');
    return `S${week}`;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (completionData.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Aucune donnée"
        description="Créez et complétez des tâches pour voir la tendance."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tâches complétées</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCompleted}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Vélocité moyenne</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {averageVelocity.toFixed(1)}/semaine
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={completionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="week"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="Complétées" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="created" fill="#6b7280" name="Créées" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="velocity"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Vélocité"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
