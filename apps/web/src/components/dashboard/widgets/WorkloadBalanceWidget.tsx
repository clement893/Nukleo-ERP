'use client';

/**
 * Widget : Équilibre de Charge
 * Distribution de la charge de travail entre les employés
 */

import { Scale, AlertTriangle } from 'lucide-react';
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
  ReferenceLine,
  Cell,
} from 'recharts';

interface BalanceData {
  name: string;
  tasks: number;
  average: number;
  deviation: number;
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
          {data.payload.tasks} tâche{(data.payload.tasks as number) !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Écart: {data.payload.deviation >= 0 ? '+' : ''}{data.payload.deviation.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
};

export function WorkloadBalanceWidget({ }: WidgetProps) {
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageTasks, setAverageTasks] = useState(0);

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
        
        // Count tasks per employee (by assignee_id or user_id)
        const tasksByEmployee: Record<number, number> = {};
        tasks.forEach((task: any) => {
          const assigneeId = task.assignee_id || task.user_id;
          if (assigneeId) {
            tasksByEmployee[assigneeId] = (tasksByEmployee[assigneeId] || 0) + 1;
          }
        });
        
        // Calculate average
        const employeeIds = activeEmployees.map((emp: any) => emp.user_id).filter(Boolean);
        const taskCounts = employeeIds.map(id => tasksByEmployee[id] || 0);
        const avg = taskCounts.length > 0 
          ? taskCounts.reduce((sum, count) => sum + count, 0) / taskCounts.length 
          : 0;
        setAverageTasks(avg);
        
        // Build balance data
        const balance: BalanceData[] = activeEmployees
          .filter((emp: any) => emp.user_id)
          .map((emp: any) => {
            const taskCount = tasksByEmployee[emp.user_id] || 0;
            return {
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employé',
              tasks: taskCount,
              average: avg,
              deviation: taskCount - avg,
            };
          })
          .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)) // Sort by deviation (most imbalanced first)
          .slice(0, 10); // Top 10 employees

        setBalanceData(balance);
      } catch (error) {
        console.error('Error loading workload balance:', error);
        setBalanceData([]);
        setAverageTasks(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (balanceData.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="Aucune donnée"
        description="Créez des tâches et assignez-les pour voir l'équilibre."
        variant="compact"
      />
    );
  }

  const getBarColor = (deviation: number) => {
    const absDev = Math.abs(deviation);
    if (absDev < averageTasks * 0.2) return '#10b981'; // green - well balanced
    if (absDev < averageTasks * 0.5) return '#f59e0b'; // amber - moderate imbalance
    return '#ef4444'; // red - high imbalance
  };

  const imbalancedCount = balanceData.filter(b => Math.abs(b.deviation) > averageTasks * 0.3).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageTasks.toFixed(1)} tâches</p>
          </div>
          {imbalancedCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-amber-600 dark:text-amber-400">Déséquilibrés</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {imbalancedCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={balanceData} layout="vertical">
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
            <ReferenceLine x={averageTasks} stroke="#6b7280" strokeDasharray="3 3" label={{ value: 'Moyenne', position: 'top' }} />
            <Bar dataKey="tasks" radius={[0, 4, 4, 0]}>
              {balanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.deviation)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
