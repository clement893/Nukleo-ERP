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
import { teamsAPI } from '@/lib/api';
import { projectTasksAPI } from '@/lib/api/project-tasks';
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

// Définition des 3 équipes à créer/afficher
const REQUIRED_TEAMS = [
  { name: 'Le Bureau', slug: 'le-bureau' },
  { name: 'Le Studio', slug: 'le-studio' },
  { name: 'Le Lab', slug: 'le-lab' },
];

function EquipesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const ensureTeamsExist = async (existingTeams: TeamType[]): Promise<TeamType[]> => {
    const teamsToCreate: typeof REQUIRED_TEAMS = [];
    
    // Vérifier quelles équipes manquent
    for (const requiredTeam of REQUIRED_TEAMS) {
      const exists = existingTeams.some(
        (team: TeamType) => 
          team.name === requiredTeam.name || 
          team.slug === requiredTeam.slug ||
          team.slug === generateSlug(requiredTeam.name)
      );
      
      if (!exists) {
        teamsToCreate.push(requiredTeam);
      }
    }
    
    // Créer les équipes manquantes
    const createdTeams: TeamType[] = [];
    for (const teamToCreate of teamsToCreate) {
      try {
        const response = await teamsAPI.create({
          name: teamToCreate.name,
          slug: teamToCreate.slug,
          description: `Équipe ${teamToCreate.name}`,
        });
        if (response.data) {
          createdTeams.push(response.data);
        }
      } catch (err) {
        console.error(`Erreur lors de la création de l'équipe ${teamToCreate.name}:`, err);
        // Continuer même en cas d'erreur
      }
    }
    
    // Retourner toutes les équipes (existantes + créées)
    const allTeams = [...existingTeams, ...createdTeams];
    
    // Filtrer pour ne garder que les 3 équipes requises dans l'ordre spécifié
    const orderedTeams: TeamType[] = [];
    for (const requiredTeam of REQUIRED_TEAMS) {
      const foundTeam = allTeams.find(
        (team: TeamType) => 
          team.name === requiredTeam.name || 
          team.slug === requiredTeam.slug ||
          team.slug === generateSlug(requiredTeam.name)
      );
      if (foundTeam) {
        orderedTeams.push(foundTeam);
      }
    }
    return orderedTeams;
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les équipes
      const teamsResponse = await teamsAPI.list();
      const teamsData = teamsResponse.data?.teams || [];
      
      // S'assurer que les 3 équipes existent
      const targetTeams = await ensureTeamsExist(teamsData);
      
      if (targetTeams.length === 0) {
        setError('Impossible de charger ou créer les équipes');
        return;
      }
      
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


  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Équipes"
        description="Gérez vos équipes et leurs projets"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules Opérations', href: '/dashboard/projets' },
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">Employés</h4>
                      <Badge variant="default" className="text-xs">
                        {team.employees.length}
                      </Badge>
                    </div>
                    {team.employees.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Aucun employé dans cette équipe
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {team.employees.map((employee) => (
                          <div key={employee.id} className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-semibold text-sm">
                                {employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {employee.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {employee.email}
                              </p>
                              {employee.tasks.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {employee.tasks.slice(0, 3).map((task) => {
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
                                  {employee.tasks.length > 3 && (
                                    <p className="text-xs text-muted-foreground italic">
                                      +{employee.tasks.length - 3} autre(s) tâche(s)
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
