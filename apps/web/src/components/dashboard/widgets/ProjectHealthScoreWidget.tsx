'use client';

/**
 * Widget : Score de Santé des Projets
 * Score de santé basé sur plusieurs critères (budget, délais, progression)
 */

import { Activity } from 'lucide-react';
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

interface HealthData {
  name: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    const statusLabels = {
      'healthy': 'Sain',
      'warning': 'Attention',
      'critical': 'Critique',
    };
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.name}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          Score: {data.payload.score?.toFixed(0) || 0}/100
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {statusLabels[data.payload.status as keyof typeof statusLabels] || data.payload.status}
        </p>
      </div>
    );
  }
  return null;
};

export function ProjectHealthScoreWidget({ }: WidgetProps) {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        const tasks = await projectTasksAPI.list();
        
        // Filter active projects
        const activeProjects = projects.filter((p: any) => p.status === 'active');
        
        // Calculate health score for each project
        const health: HealthData[] = activeProjects.map((project: any) => {
          const projectTasks = tasks.filter((t: any) => t.project_id === project.id);
          const completedTasks = projectTasks.filter((t: any) => t.status === 'completed').length;
          const totalTasks = projectTasks.length || 1;
          
          // Progress score (0-40 points)
          const progressScore = (completedTasks / totalTasks) * 40;
          
          // Deadline score (0-30 points)
          let deadlineScore = 30;
          if (project.deadline) {
            const deadline = new Date(project.deadline);
            const now = new Date();
            const daysRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            const projectDuration = deadline.getTime() - new Date(project.created_at).getTime();
            const daysTotal = projectDuration / (1000 * 60 * 60 * 24);
            
            if (daysTotal > 0) {
              const progressPercent = completedTasks / totalTasks;
              const expectedProgress = 1 - (daysRemaining / daysTotal);
              const delay = progressPercent - expectedProgress;
              
              if (delay < -0.2) deadlineScore = 10; // Very behind
              else if (delay < -0.1) deadlineScore = 20; // Behind
              else if (delay > 0.1) deadlineScore = 30; // Ahead
              else deadlineScore = 25; // On track
            }
          }
          
          // Budget score (0-30 points) - simplified, assuming budget is being tracked
          const budgetScore = project.budget ? 30 : 20; // Full points if budget exists
          
          const totalScore = progressScore + deadlineScore + budgetScore;
          
          let status: 'healthy' | 'warning' | 'critical' = 'healthy';
          if (totalScore < 50) status = 'critical';
          else if (totalScore < 70) status = 'warning';
          
          return {
            name: project.name || 'Sans nom',
            score: Math.min(100, Math.max(0, totalScore)),
            status,
          };
        })
        .sort((a, b) => a.score - b.score) // Sort by score ascending (worst first)
        .slice(0, 10); // Top 10 projects (worst health)

        setHealthData(health);
        
        // Calculate average score
        if (health.length > 0) {
          const avg = health.reduce((sum, h) => sum + h.score, 0) / health.length;
          setAverageScore(avg);
        }
      } catch (error) {
        console.error('Error loading project health score:', error);
        setHealthData([]);
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

  if (healthData.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Aucune donnée"
        description="Créez des projets pour voir les scores de santé."
        variant="compact"
      />
    );
  }

  const getBarColor = (status: string) => {
    if (status === 'healthy') return '#10b981'; // green
    if (status === 'warning') return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Score moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageScore.toFixed(0)}/100</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Projets suivis</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {healthData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={healthData} layout="vertical">
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
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {healthData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
