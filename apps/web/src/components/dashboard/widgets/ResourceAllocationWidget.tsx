'use client';

/**
 * Widget : Allocation des Ressources
 * Répartition des ressources (employés) par projet
 */

import { Users, FolderKanban } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/lib/api/projects';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { employeesAPI } from '@/lib/api/employees';
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

interface AllocationData {
  project: string;
  employees: number;
  tasks: number;
  utilization: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.project}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-600 dark:text-gray-400">Employés: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.employees}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Tâches: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.tasks}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Utilisation: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.utilization.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function ResourceAllocationWidget({ }: WidgetProps) {
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projects, tasks, employees] = await Promise.all([
          projectsAPI.list(),
          projectTasksAPI.list(),
          employeesAPI.list(),
        ]);
        
        // Filter active projects and employees
        const activeProjects = projects.filter((p: any) => p.status === 'active');
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        setTotalEmployees(activeEmployees.length);
        
        // Calculate allocation for each project
        const allocation: AllocationData[] = activeProjects.map((project: any) => {
          const projectTasks = tasks.filter((t: any) => t.project_id === project.id);
          
          // Get unique employee IDs assigned to tasks
          const employeeIds = new Set<number>();
          projectTasks.forEach((task: any) => {
            if (task.assignee_id) employeeIds.add(task.assignee_id);
          });
          
          const employeeCount = employeeIds.size;
          const taskCount = projectTasks.length;
          const utilization = activeEmployees.length > 0 
            ? (employeeCount / activeEmployees.length) * 100 
            : 0;
          
          return {
            project: project.name || 'Sans nom',
            employees: employeeCount,
            tasks: taskCount,
            utilization,
          };
        })
        .filter(p => p.employees > 0) // Only projects with employees
        .sort((a, b) => b.employees - a.employees)
        .slice(0, 10); // Top 10 projects

        setAllocationData(allocation);
      } catch (error) {
        console.error('Error loading resource allocation:', error);
        setAllocationData([]);
        setTotalEmployees(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (allocationData.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucune donnée"
        description="Créez des projets et assignez des tâches pour voir l'allocation."
        variant="compact"
      />
    );
  }

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#6b7280', '#f97316',
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total employés</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEmployees}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Projets actifs</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <FolderKanban className="w-5 h-5" />
              {allocationData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={allocationData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              type="category"
              dataKey="project"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="employees" radius={[0, 4, 4, 0]}>
              {allocationData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
