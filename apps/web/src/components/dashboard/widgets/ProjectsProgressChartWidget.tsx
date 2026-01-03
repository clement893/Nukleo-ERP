'use client';

/**
 * Widget : Progression des Projets
 * Graphique de progression des projets avec barres de progression
 */

import { FolderKanban, TrendingUp } from 'lucide-react';
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
  Cell,
} from 'recharts';

interface ProgressData {
  name: string;
  progress: number;
  completed: number;
  total: number;
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
          {data.payload.progress?.toFixed(0) || 0}%
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.completed || 0} / {data.payload.total || 0} tâches
        </p>
      </div>
    );
  }
  return null;
};

export function ProjectsProgressChartWidget({ }: WidgetProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageProgress, setAverageProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        const tasks = await projectTasksAPI.list();
        
        // Filter active projects
        const activeProjects = projects.filter((p: any) => p.status === 'active');
        
        // Calculate progress for each project
        const progress: ProgressData[] = activeProjects.map((project: any) => {
          const projectTasks = tasks.filter((t: any) => t.project_id === project.id);
          const completedTasks = projectTasks.filter((t: any) => t.status === 'completed');
          const totalTasks = projectTasks.length || 1; // Avoid division by zero
          const progressPercent = (completedTasks.length / totalTasks) * 100;
          
          return {
            name: project.name || 'Sans nom',
            progress: progressPercent,
            completed: completedTasks.length,
            total: projectTasks.length,
          };
        }).sort((a, b) => b.progress - a.progress).slice(0, 10); // Top 10 projects

        setProgressData(progress);
        
        // Calculate average progress
        if (progress.length > 0) {
          const avg = progress.reduce((sum, p) => sum + p.progress, 0) / progress.length;
          setAverageProgress(avg);
        }
      } catch (error) {
        console.error('Error loading projects progress:', error);
        setProgressData([]);
        setAverageProgress(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (progressData.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Aucune donnée"
        description="Créez des projets et des tâches pour voir la progression."
        variant="compact"
      />
    );
  }

  const getBarColor = (progress: number) => {
    if (progress >= 80) return '#10b981'; // green
    if (progress >= 50) return '#3b82f6'; // blue
    if (progress >= 25) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Progression moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageProgress.toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Projets actifs</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {progressData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={progressData} layout="vertical">
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
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
              {progressData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
