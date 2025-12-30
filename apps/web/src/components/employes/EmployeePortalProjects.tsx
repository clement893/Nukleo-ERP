'use client';

import { useEffect, useState, useMemo } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { teamsAPI } from '@/lib/api/teams';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Card, Loading, Alert } from '@/components/ui';
import { FolderKanban, Users, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmployeePortalProjectsProps {
  employeeId: number;
}

interface ProjectInfo {
  teamId: number;
  teamName: string;
  teamSlug: string;
  taskCount: number;
  completedTasks: number;
  inProgressTasks: number;
}

export default function EmployeePortalProjects({ employeeId }: EmployeePortalProjectsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les tâches de l'employé
      const tasksData = await projectTasksAPI.list({ assignee_id: employeeId });
      setTasks(tasksData);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des projets');
      showToast({
        message: appError.message || 'Erreur lors du chargement des projets',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Grouper les tâches par équipe (projet)
  const projects = useMemo(() => {
    const projectMap = new Map<number, ProjectInfo>();

    tasks.forEach((task) => {
      if (!projectMap.has(task.team_id)) {
        projectMap.set(task.team_id, {
          teamId: task.team_id,
          teamName: `Équipe ${task.team_id}`, // On pourrait charger les noms d'équipes si nécessaire
          teamSlug: `team-${task.team_id}`,
          taskCount: 0,
          completedTasks: 0,
          inProgressTasks: 0,
        });
      }

      const project = projectMap.get(task.team_id)!;
      project.taskCount++;
      if (task.status === 'completed') {
        project.completedTasks++;
      } else if (task.status === 'in_progress') {
        project.inProgressTasks++;
      }
    });

    return Array.from(projectMap.values());
  }, [tasks]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">{error}</Alert>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mes projets ({projects.length})
        </h3>
      </div>

      {projects.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun projet trouvé</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progress = project.taskCount > 0 
              ? Math.round((project.completedTasks / project.taskCount) * 100) 
              : 0;

            return (
              <Card 
                key={project.teamId}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  const locale = window.location.pathname.split('/')[1] || 'fr';
                  router.push(`/${locale}/dashboard/projets/equipes/${project.teamSlug}`);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary-600" />
                    <h4 className="font-semibold text-lg">{project.teamName}</h4>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tâches</span>
                    <span className="font-medium">{project.taskCount}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progression</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{project.completedTasks} terminées</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{project.inProgressTasks} en cours</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
