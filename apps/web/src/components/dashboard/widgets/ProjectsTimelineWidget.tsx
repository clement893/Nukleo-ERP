'use client';

/**
 * Widget : Timeline des Projets
 * Évolution du nombre de projets dans le temps par statut
 */

import { FolderKanban, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/lib/api/projects';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TimelineDataPoint {
  month: string;
  active: number;
  completed: number;
  archived: number;
  total: number;
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

export function ProjectsTimelineWidget({ }: WidgetProps) {
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        
        setTotalProjects(projects.length);
        
        // Group by month and status
        const grouped: Record<string, { active: number; completed: number; archived: number }> = {};
        
        projects.forEach((project: any) => {
          const createdDate = new Date(project.created_at);
          const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!grouped[monthKey]) {
            grouped[monthKey] = { active: 0, completed: 0, archived: 0 };
          }
          
          const status = project.status?.toLowerCase() || 'active';
          if (status === 'completed') {
            grouped[monthKey].completed++;
          } else if (status === 'archived') {
            grouped[monthKey].archived++;
          } else {
            grouped[monthKey].active++;
          }
        });

        // Convert to array and sort
        const data: TimelineDataPoint[] = Object.entries(grouped)
          .map(([month, counts]) => ({
            month,
            ...counts,
            total: counts.active + counts.completed + counts.archived,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6); // Last 6 months

        // Format month labels
        const formattedData = data.map(item => ({
          ...item,
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        }));

        setTimelineData(formattedData);
      } catch (error) {
        console.error('Error loading projects timeline:', error);
        setTimelineData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (timelineData.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Aucune donnée"
        description="Créez des projets pour voir la timeline."
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Total projets</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProjects}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Évolution</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {timelineData.length > 0 && timelineData[timelineData.length - 1]?.total || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="active" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Actifs"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Terminés"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="archived" 
              stroke="#6b7280" 
              strokeWidth={2}
              name="Archivés"
              dot={{ fill: '#6b7280', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
