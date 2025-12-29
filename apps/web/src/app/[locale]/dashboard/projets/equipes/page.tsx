'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Loading, Alert } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { teamsAPI, projectTasksAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import type { Team as TeamType, TeamMember } from '@/lib/api/teams';
import type { ProjectTask } from '@/lib/api/project-tasks';

// Types
interface Employee {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  tasks: ProjectTask[];
}

interface TeamWithStats extends TeamType {
  employees: Employee[];
  totalTasks: number;
  inProgressTasks: number;
}

function EquipesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les équipes
      const teamsResponse = await teamsAPI.list();
      const teamsData = teamsResponse.data?.teams || [];
      
      // Filtrer les 3 équipes spécifiques (Bureau, Studio, Lab)
      const targetTeams = teamsData.filter((team: TeamType) => 
        ['bureau', 'studio', 'lab'].includes(team.slug)
      );
      
      // Charger les tâches et statistiques pour chaque équipe
      const teamsWithStats: TeamWithStats[] = await Promise.all(
        targetTeams.map(async (team: TeamType) => {
          // Charger les tâches de l'équipe
          const tasks = await projectTasksAPI.list({ team_id: team.id });
          
          // Grouper les membres et leurs tâches
          const employees: Employee[] = (team.members || []).map((member: TeamMember) => {
            const memberTasks = tasks.filter(
              (task: ProjectTask) => task.assignee_id === member.user_id
            );
            return {
              id: member.user_id,
              name: member.user?.name || 
                    `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() ||
                    member.user?.email ||
                    'Utilisateur',
              email: member.user?.email || '',
              tasks: memberTasks,
            };
          });
          
          const totalTasks = tasks.length;
          const inProgressTasks = tasks.filter(
            (task: ProjectTask) => task.status === 'in_progress'
          ).length;
          
          return {
            ...team,
            employees,
            totalTasks,
            inProgressTasks,
          };
        })
      );
      
      setTeams(teamsWithStats);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des équipes');
      showToast({
        message: appError.message || 'Erreur lors du chargement des équipes',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (teamSlug: string) => {
    router.push(`/dashboard/projets/equipes/${teamSlug}`);
  };

  const getStatusBadge = (status: ProjectTask['status']) => {
    const statusConfig = {
      todo: { label: 'À faire', variant: 'default' as const, icon: Clock },
      in_progress: { label: 'En cours', variant: 'info' as const, icon: Clock },
      blocked: { label: 'Bloqué', variant: 'error' as const, icon: AlertCircle },
      to_transfer: { label: 'À transférer', variant: 'warning' as const, icon: AlertCircle },
      completed: { label: 'Terminé', variant: 'success' as const, icon: CheckCircle2 },
    };
    return statusConfig[status];
  };

  const _getPriorityColor = (priority: ProjectTask['priority']) => {
    const colors = {
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return colors[priority];
  };

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Équipes"
        description="Gérez vos équipes et leurs projets"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Projets', href: '/dashboard/projets' },
          { label: 'Équipes' },
        ]}
      />

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Aucune équipe trouvée. Veuillez exécuter le script de seed.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTeamClick(team.slug)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {team.name}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Statistiques */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tâches en cours</span>
                    <Badge variant="info">{team.inProgressTasks}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total tâches</span>
                    <Badge variant="default">{team.totalTasks}</Badge>
                  </div>

                  {/* Employés */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Employés</h4>
                    <div className="space-y-3">
                      {team.employees.map((employee) => (
                        <div key={employee.id} className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-semibold text-sm">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {employee.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.email}
                            </p>
                            <div className="mt-2 space-y-1">
                              {employee.tasks.map((task) => {
                                const statusInfo = getStatusBadge(task.status);
                                return (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <span className="flex-1 truncate">{task.title}</span>
                                    <Badge
                                      variant={statusInfo.variant}
                                      className="text-xs px-2 py-0.5"
                                    >
                                      {statusInfo.label}
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MotionDiv>
  );
}

export default function EquipesPage() {
  return <EquipesContent />;
}
