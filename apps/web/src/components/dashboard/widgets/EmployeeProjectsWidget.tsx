'use client';

/**
 * Widget: Projets de l'employé
 */

import { useEffect, useState } from 'react';
import { Briefcase, Users } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api/projects';
import EmptyState from '@/components/ui/EmptyState';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';

export function EmployeeProjectsWidget({ config, globalFilters }: WidgetProps) {
  const [projects, setProjects] = useState<Array<{ id?: number | null; name?: string; taskCount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { employeeId } = useEmployeePortalDashboardStore();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        
        const idToUse = employeeId || (globalFilters?.employee_id as number);
        if (!idToUse) {
          setIsLoading(false);
          return;
        }
        
        const [tasksData, projectsData] = await Promise.all([
          projectTasksAPI.list({ assignee_id: idToUse }),
          projectsAPI.list(),
        ]);

        const projectsList = Array.isArray(projectsData) ? projectsData : [];
        
        // Grouper les tâches par projet
        const projectMap = new Map<number, number>();
        tasksData.forEach((task: ProjectTask) => {
          if (task.project_id) {
            projectMap.set(task.project_id, (projectMap.get(task.project_id) || 0) + 1);
          }
        });

        // Créer la liste des projets avec le nombre de tâches
        const projectsWithTasks = projectsList
          .filter((p: { id?: number | null }) => p.id && projectMap.has(p.id))
          .map((p: { id?: number | null; name?: string }) => ({
            id: p.id,
            name: p.name || 'Sans nom',
            taskCount: p.id ? (projectMap.get(p.id) || 0) : 0,
          }))
          .sort((a: { taskCount: number }, b: { taskCount: number }) => b.taskCount - a.taskCount)
          .slice(0, 5);

        setProjects(projectsWithTasks);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [employeeId, globalFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">{config.title || 'Mes Projets'}</h3>
      
      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucun projet"
          description="Vous n'êtes assigné à aucun projet"
          variant="compact"
        />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-sm">{project.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{project.taskCount} tâche{project.taskCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
