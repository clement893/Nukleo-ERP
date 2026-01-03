'use client';

/**
 * Widget : Satisfaction Employés
 * Indicateur de satisfaction basé sur les métriques de performance et charge de travail
 * Note: Ce widget utilise des données dérivées - un vrai système aurait des sondages de satisfaction
 */

import { Smile, Heart } from 'lucide-react';
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

interface SatisfactionData {
  department: string;
  score: number;
  employees: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.department}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value?.toFixed(1) || 0}/10
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.employees} employé{data.payload.employees !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function EmployeeSatisfactionWidget({ }: WidgetProps) {
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [employees, tasks, timeEntries] = await Promise.all([
          employeesAPI.list(),
          projectTasksAPI.list(),
          timeEntriesAPI.list({}),
        ]);
        
        // Filter active employees
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        // Calculate satisfaction score based on:
        // - Task completion rate (higher = better)
        // - Workload balance (not overloaded = better)
        // - Time tracking consistency (consistent = better)
        const byDepartment: Record<string, any[]> = {};
        activeEmployees.forEach((emp: any) => {
          const dept = emp.department || 'Non spécifié';
          if (!byDepartment[dept]) {
            byDepartment[dept] = [];
          }
          byDepartment[dept].push(emp);
        });
        
        const satisfaction: SatisfactionData[] = Object.entries(byDepartment).map(([department, deptEmployees]) => {
          const employeeIds = deptEmployees.map((emp: any) => emp.user_id).filter(Boolean);
          
          // Calculate metrics for this department
          const deptTasks = tasks.filter((task: any) => 
            employeeIds.includes(task.assignee_id || task.user_id || 0)
          );
          const completedTasks = deptTasks.filter((t: any) => t.status === 'completed');
          const completionRate = deptTasks.length > 0 ? (completedTasks.length / deptTasks.length) * 100 : 0;
          
          // Calculate average workload (tasks per employee)
          const avgTasksPerEmployee = deptEmployees.length > 0 ? deptTasks.length / deptEmployees.length : 0;
          const workloadScore = avgTasksPerEmployee <= 10 ? 100 : Math.max(0, 100 - (avgTasksPerEmployee - 10) * 5); // Penalize overload
          
          // Calculate time tracking consistency (employees with time entries)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const deptTimeEntries = timeEntries.filter((entry: any) => {
            if (!employeeIds.includes(entry.user_id)) return false;
            const entryDate = new Date(entry.date);
            return entryDate >= thirtyDaysAgo;
          });
          const employeesWithTracking = new Set(deptTimeEntries.map((e: any) => e.user_id)).size;
          const trackingScore = deptEmployees.length > 0 ? (employeesWithTracking / deptEmployees.length) * 100 : 0;
          
          // Combine metrics into satisfaction score (0-10 scale)
          const score = (
            (completionRate * 0.4) + // 40% weight on completion
            (workloadScore * 0.3) + // 30% weight on workload balance
            (trackingScore * 0.3) // 30% weight on tracking consistency
          ) / 10; // Scale to 0-10
          
          return {
            department,
            score: Math.min(10, Math.max(0, score)),
            employees: deptEmployees.length,
          };
        })
        .filter(d => d.employees > 0)
        .sort((a, b) => b.score - a.score);

        setSatisfactionData(satisfaction);
        
        // Calculate average score
        if (satisfaction.length > 0) {
          const avg = satisfaction.reduce((sum, s) => sum + s.score, 0) / satisfaction.length;
          setAverageScore(avg);
        }
      } catch (error) {
        console.error('Error loading employee satisfaction:', error);
        setSatisfactionData([]);
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

  if (satisfactionData.length === 0) {
    return (
      <EmptyState
        icon={Smile}
        title="Aucune donnée"
        description="Les données de satisfaction apparaîtront ici."
        variant="compact"
      />
    );
  }

  const getBarColor = (score: number) => {
    if (score >= 8) return '#10b981'; // green
    if (score >= 6) return '#3b82f6'; // blue
    if (score >= 4) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Score moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageScore.toFixed(1)}/10</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Satisfaction</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              averageScore >= 7
                ? 'text-green-600 dark:text-green-400'
                : averageScore >= 5
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              <Heart className="w-5 h-5" />
              {averageScore >= 7 ? 'Élevée' : averageScore >= 5 ? 'Moyenne' : 'Faible'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={satisfactionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              domain={[0, 10]}
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              type="category"
              dataKey="department"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {satisfactionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
