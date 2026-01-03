'use client';

/**
 * Widget : Complétion Formations
 * Vue d'ensemble de la complétion des formations (basé sur les données disponibles)
 * Note: Ce widget utilise des données simulées basées sur les performances des employés
 */

import { GraduationCap } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
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

interface TrainingData {
  category: string;
  completed: number;
  total: number;
  completionRate: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.category}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value?.toFixed(0) || 0}%
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.completed}/{data.payload.total} employés
        </p>
      </div>
    );
  }
  return null;
};

export function TrainingCompletionWidget({ }: WidgetProps) {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallCompletion, setOverallCompletion] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        const tasks = await projectTasksAPI.list();
        
        // Filter active employees
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        // Simulate training completion based on employee performance metrics
        // This is a placeholder - in a real system, this would come from a training/HR system
        const totalEmployees = activeEmployees.length;
        
        // Group by department/job_title to simulate training categories
        const byCategory: Record<string, number> = {};
        activeEmployees.forEach((emp: any) => {
          const category = emp.department || emp.job_title || 'Général';
          byCategory[category] = (byCategory[category] || 0) + 1;
        });
        
        // Calculate "training completion" based on task completion rate
        // Employees with more completed tasks are considered as having completed more "training"
        const training: TrainingData[] = Object.entries(byCategory).map(([category, employeeCount]) => {
          const categoryEmployees = activeEmployees.filter((emp: any) => 
            (emp.department || emp.job_title || 'Général') === category
          );
          const employeeIds = categoryEmployees.map((emp: any) => emp.user_id).filter(Boolean);
          
          // Count completed tasks for employees in this category
          const completedTasks = tasks.filter((task: any) => 
            task.status === 'completed' && 
            employeeIds.includes(task.assignee_id || task.user_id || 0)
          );
          
          // Simulate: if employees have completed many tasks, they've "completed training"
          // This is a simplified approach - real system would track actual training completion
          const avgTasksPerEmployee = employeeCount > 0 ? completedTasks.length / employeeCount : 0;
          const completionRate = Math.min(100, (avgTasksPerEmployee / 20) * 100); // Normalize to 0-100
          const completed = Math.round((completionRate / 100) * employeeCount);
          
          return {
            category,
            completed,
            total: employeeCount,
            completionRate,
          };
        })
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 8); // Top 8 categories

        setTrainingData(training);
        
        // Calculate overall completion
        if (training.length > 0) {
          const totalCompleted = training.reduce((sum, t) => sum + t.completed, 0);
          const totalTotal = training.reduce((sum, t) => sum + t.total, 0);
          setOverallCompletion(totalTotal > 0 ? (totalCompleted / totalTotal) * 100 : 0);
        }
      } catch (error) {
        console.error('Error loading training completion:', error);
        setTrainingData([]);
        setOverallCompletion(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (trainingData.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Aucune donnée"
        description="Les données de formations apparaîtront ici."
        variant="compact"
      />
    );
  }

  const getBarColor = (rate: number) => {
    if (rate >= 80) return '#10b981'; // green
    if (rate >= 60) return '#3b82f6'; // blue
    if (rate >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Complétion globale</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallCompletion.toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Catégories</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              {trainingData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trainingData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completionRate" radius={[0, 4, 4, 0]}>
              {trainingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.completionRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
