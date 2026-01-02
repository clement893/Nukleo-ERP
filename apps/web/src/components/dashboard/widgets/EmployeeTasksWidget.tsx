'use client';

/**
 * Widget: Tâches de l'employé
 */

import { useEffect, useState } from 'react';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
// Card not needed here
import EmptyState from '@/components/ui/EmptyState';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';

export function EmployeeTasksWidget({ config, globalFilters }: WidgetProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { employeeId } = useEmployeePortalDashboardStore();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        // Utiliser employeeId du store ou du globalFilters
        const idToUse = employeeId || (globalFilters?.employee_id as number);
        if (!idToUse) {
          setIsLoading(false);
          return;
        }
        
        const data = await projectTasksAPI.list({ assignee_id: idToUse });
        setTasks(data);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [employeeId, globalFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const displayTasks = [...inProgressTasks, ...todoTasks].slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{config.title || 'Mes Tâches'}</h3>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <div className="font-bold text-blue-600">{inProgressTasks.length}</div>
            <div className="text-xs text-gray-500">En cours</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-600">{todoTasks.length}</div>
            <div className="text-xs text-gray-500">À faire</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{completedTasks.length}</div>
            <div className="text-xs text-gray-500">Terminées</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-600">{upcomingDeadlines.length}</div>
            <div className="text-xs text-gray-500">Échéances</div>
          </div>
        </div>
      </div>

      {displayTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche"
          description="Vous n'avez aucune tâche en cours"
          variant="compact"
        />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {displayTasks.map((task) => {
            const isUrgent = task.due_date && new Date(task.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            
            return (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm flex-1">{task.title}</h4>
                  {isUrgent && (
                    <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className={`px-2 py-0.5 rounded ${
                    task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {task.status === 'in_progress' ? 'En cours' :
                     task.status === 'completed' ? 'Terminée' : 'À faire'}
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
