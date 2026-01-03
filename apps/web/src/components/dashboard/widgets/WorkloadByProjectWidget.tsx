'use client';

/**
 * Widget : Charge par Projet
 * Nombre de tâches par projet pour identifier la charge de travail
 */

import { Briefcase, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/lib/api/projects';
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
} from 'recharts';

interface WorkloadData {
  name: string;
  tasks: number;
  completed: number;
  inProgress: number;
  todo: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.name}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-600 dark:text-gray-400">Total: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.tasks}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Complétées: </span>
            <span className="font-bold text-green-600 dark:text-green-400">{data.payload.completed}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">En cours: </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{data.payload.inProgress}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">À faire: </span>
            <span className="font-bold text-gray-600 dark:text-gray-400">{data.payload.todo}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function WorkloadByProjectWidget({ }: WidgetProps) {
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        const tasks = await projectTasksAPI.list();
        
        setTotalTasks(tasks.length);
        
        // Filter active projects
        const activeProjects = projects.filter((p: any) => p.status === 'active');
        
        // Calculate workload for each project
        const workload: WorkloadData[] = activeProjects.map((project: any) => {
          const projectTasks = tasks.filter((t: any) => t.project_id === project.id);
          const completed = projectTasks.filter((t: any) => t.status === 'completed').length;
          const inProgress = projectTasks.filter((t: any) => t.status === 'in_progress').length;
          const todo = projectTasks.filter((t: any) => t.status === 'todo').length;
          
          return {
            name: project.name || 'Sans nom',
            tasks: projectTasks.length,
            completed,
            inProgress,
            todo,
          };
        })
        .filter(p => p.tasks > 0) // Only projects with tasks
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 10); // Top 10 projects

        setWorkloadData(workload);
      } catch (error) {
        console.error('Error loading workload by project:', error);
        setWorkloadData([]);
        setTotalTasks(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (workloadData.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Aucune donnée"
        description="Créez des projets et des tâches pour voir la charge de travail."
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Total tâches</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Projets affichés</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {workloadData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={workloadData} layout="vertical">
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
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tasks" radius={[0, 4, 4, 0]} fill="#3b82f6" name="Total tâches" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
