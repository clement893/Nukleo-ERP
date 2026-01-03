'use client';

/**
 * Widget : Timeline des Jalons
 * Timeline des échéances importantes (deadlines projets, tâches importantes)
 */

import { Flag, AlertCircle } from 'lucide-react';
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

interface MilestoneData {
  date: string;
  label: string;
  count: number;
  overdue: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value} jalon{(data.value as number) !== 1 ? 's' : ''}
        </p>
        {data.payload.overdue > 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {data.payload.overdue} en retard
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function MilestonesTimelineWidget({ }: WidgetProps) {
  const [milestoneData, setMilestoneData] = useState<MilestoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projects, tasks] = await Promise.all([
          projectsAPI.list(),
          projectTasksAPI.list(),
        ]);
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        // Collect all milestones (project deadlines and high-priority task due dates)
        const milestones: Array<{ date: Date; isOverdue: boolean }> = [];
        
        // Project deadlines
        projects.forEach((project: any) => {
          if (project.deadline && project.status === 'active') {
            const deadline = new Date(project.deadline);
            deadline.setHours(0, 0, 0, 0);
            milestones.push({
              date: deadline,
              isOverdue: deadline < now,
            });
          }
        });
        
        // High priority task due dates
        tasks.forEach((task: any) => {
          if (task.due_date && (task.priority === 'high' || task.priority === 'urgent') && task.status !== 'completed') {
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate <= thirtyDaysFromNow) {
              milestones.push({
                date: dueDate,
                isOverdue: dueDate < now,
              });
            }
          }
        });
        
        // Group by week (next 4 weeks)
        const grouped: Record<string, { count: number; overdue: number }> = {};
        milestones.forEach(milestone => {
          const weekKey = getWeekKey(milestone.date);
          if (!grouped[weekKey]) {
            grouped[weekKey] = { count: 0, overdue: 0 };
          }
          grouped[weekKey].count += 1;
          if (milestone.isOverdue) {
            grouped[weekKey].overdue += 1;
          }
        });
        
        // Convert to array and filter to upcoming/current weeks
        const data: MilestoneData[] = Object.entries(grouped)
          .map(([weekKey, stats]) => ({
            date: weekKey,
            label: formatWeekLabel(weekKey),
            count: stats.count,
            overdue: stats.overdue,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 4); // Next 4 weeks

        setMilestoneData(data);
        
        // Count upcoming milestones (not overdue)
        const upcoming = milestones.filter(m => !m.isOverdue && m.date >= now).length;
        setUpcomingCount(upcoming);
      } catch (error) {
        console.error('Error loading milestones timeline:', error);
        setMilestoneData([]);
        setUpcomingCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getWeekKey = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const formatWeekLabel = (weekKey: string): string => {
    const [, week] = weekKey.split('-W');
    return `S${week}`;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (milestoneData.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="Aucun jalon"
        description="Les jalons à venir apparaîtront ici."
        variant="compact"
      />
    );
  }

  const overdueCount = milestoneData.reduce((sum, m) => sum + m.overdue, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jalons à venir</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingCount}</p>
          </div>
          {overdueCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-red-600 dark:text-red-400">En retard</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {overdueCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={milestoneData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="label"
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
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {milestoneData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.overdue > 0 ? '#ef4444' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
