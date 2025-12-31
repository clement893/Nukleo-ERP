'use client';

/**
 * Widget : Tâches Kanban
 */

import { CheckSquare, ExternalLink } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const STATUS_COLUMNS = [
  { status: 'todo', label: 'À faire', color: 'bg-gray-100 dark:bg-gray-700' },
  { status: 'in_progress', label: 'En cours', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { status: 'completed', label: 'Terminé', color: 'bg-green-100 dark:bg-green-900/30' },
];

export function TasksKanbanWidget({ config, globalFilters }: WidgetProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await projectTasksAPI.list({
          project_id: globalFilters?.project_id,
        });
        setTasks(data || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [globalFilters?.project_id]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status).slice(0, 3);
  };

  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Aucune tâche"
        description="Créez votre première tâche pour voir le kanban."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{totalTasks} tâches</p>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-full">
          {STATUS_COLUMNS.map(({ status, label, color }) => {
            const columnTasks = getTasksByStatus(status);
            
            return (
              <div key={status} className="flex-1 min-w-[120px] flex flex-col">
                <div className={`${color} rounded-lg p-2 mb-2`}>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {label} ({columnTasks.length})
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {columnTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/dashboard/projets/${task.project_id || ''}#tasks`}
                      className="block p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                    >
                      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {task.title || 'Sans titre'}
                      </p>
                      {task.project_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {task.project_name}
                        </p>
                      )}
                      <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </Link>
                  ))}
                  {columnTasks.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                      Aucune tâche
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
