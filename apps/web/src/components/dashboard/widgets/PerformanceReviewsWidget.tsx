'use client';

/**
 * Widget : Aperçu Évaluations Performance
 * Vue d'ensemble des performances basée sur les indicateurs disponibles
 */

import { Star, TrendingUp, Award } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { timeEntriesAPI } from '@/lib/api/time-entries';
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

interface PerformanceData {
  name: string;
  score: number;
  tasksCompleted: number;
  hoursWorked: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.name}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          Score: {data.payload.score?.toFixed(1) || 0}/100
        </p>
        <div className="mt-2 space-y-1 text-sm">
          <p>
            <span className="text-gray-600 dark:text-gray-400">Tâches complétées: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.tasksCompleted}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Heures travaillées: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.hoursWorked.toFixed(1)}h</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceReviewsWidget({ }: WidgetProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        const tasks = await projectTasksAPI.list();
        const timeEntries = await timeEntriesAPI.list({});
        
        // Filter active employees
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        // Calculate performance score for each employee
        const performance: PerformanceData[] = activeEmployees
          .filter((emp: any) => emp.user_id)
          .map((emp: any) => {
            // Count completed tasks
            const employeeTasks = tasks.filter((t: any) => 
              (t.assignee_id === emp.user_id || t.user_id === emp.user_id) && t.status === 'completed'
            );
            
            // Calculate hours worked (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const employeeTimeEntries = timeEntries.filter((entry: any) => {
              if (entry.user_id !== emp.user_id) return false;
              const entryDate = new Date(entry.date);
              return entryDate >= thirtyDaysAgo;
            });
            const hoursWorked = employeeTimeEntries.reduce((sum: number, entry: any) => 
              sum + (entry.duration / 3600), 0
            );
            
            // Calculate performance score (0-100)
            // Based on: tasks completed (60%), hours worked consistency (40%)
            const tasksScore = Math.min(60, (employeeTasks.length / 10) * 60); // Max 60 points for tasks
            const hoursScore = Math.min(40, (hoursWorked / 160) * 40); // Max 40 points for hours (160h = ~1 month full-time)
            const score = tasksScore + hoursScore;
            
            return {
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employé',
              score,
              tasksCompleted: employeeTasks.length,
              hoursWorked,
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Top 10 employees

        setPerformanceData(performance);
        
        // Calculate average score
        if (performance.length > 0) {
          const avg = performance.reduce((sum, p) => sum + p.score, 0) / performance.length;
          setAverageScore(avg);
        }
      } catch (error) {
        console.error('Error loading performance reviews:', error);
        setPerformanceData([]);
        setAverageScore(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (performanceData.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Aucune donnée"
        description="Les données de performance apparaîtront ici."
        variant="compact"
      />
    );
  }

  const getBarColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Score moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageScore.toFixed(1)}/100</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Top performers</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Award className="w-5 h-5" />
              {performanceData.filter(p => p.score >= 80).length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              domain={[0, 100]}
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
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
