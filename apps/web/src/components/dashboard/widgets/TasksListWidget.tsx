'use client';

/**
 * Widget : Liste des Tâches
 */

import { CheckSquare, ExternalLink, Clock } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export function TasksListWidget({ globalFilters }: WidgetProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await projectTasksAPI.list({
          project_id: globalFilters?.project_id,
          assignee_id: globalFilters?.employee_id,
        });
        // Sort by priority and due date
        const sorted = (data || []).sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
          if (aPriority !== bPriority) return aPriority - bPriority;
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          return 0;
        });
        setTasks(sorted.slice(0, 5));
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [globalFilters?.project_id, globalFilters?.employee_id]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Aucune tâche"
        description="Les tâches assignées apparaîtront ici."
        variant="compact"
      />
    );
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-2">
        {tasks.map((task) => {
          const dueDate = formatDate(task.due_date);
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
          
          return (
            <Link
              key={task.id}
              href={`/dashboard/projets/${task.project_id || ''}#tasks`}
              className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-gray-500'}`} />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {task.title || 'Sans titre'}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  {task.project_name && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                      {task.project_name}
                    </p>
                  )}
                  {dueDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className={`w-3 h-3 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {dueDate}
                      </span>
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : task.status === 'in_progress'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {task.status === 'completed' ? 'Terminé' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
