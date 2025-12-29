'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button, Loading, Alert } from '@/components/ui';
import KanbanBoard from '@/components/ui/KanbanBoard';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Users, Clock, AlertCircle, Package, ShoppingCart } from 'lucide-react';
import { teamsAPI } from '@/lib/api';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import type { Team, TeamMember } from '@/lib/api/teams';
import type { ProjectTask } from '@/lib/api/project-tasks';

// Types
interface Employee {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

function TeamProjectManagementContent() {
  const params = useParams();
  const { showToast } = useToast();
  const teamSlug = params?.slug as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_updatingTask, setUpdatingTask] = useState<string | null>(null);

  useEffect(() => {
    if (teamSlug) {
      loadTeamData();
    }
  }, [teamSlug]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Trouver l'équipe par slug
      const teamsResponse = await teamsAPI.list();
      const teams = teamsResponse.data?.teams || [];
      const foundTeam = teams.find((t: Team) => t.slug === teamSlug);
      
      if (!foundTeam) {
        setError('Équipe non trouvée');
        return;
      }
      
      setTeam(foundTeam);
      
      // Charger les tâches de l'équipe
      const teamTasks = await projectTasksAPI.list({ team_id: foundTeam.id });
      setTasks(teamTasks);
      
      // Grouper les membres
      const teamEmployees: Employee[] = (foundTeam.members || []).map((member: TeamMember) => ({
        id: member.user_id,
        name: member.user?.name || 
              `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() ||
              member.user?.email ||
              'Utilisateur',
        email: member.user?.email || '',
      }));
      
      setEmployees(teamEmployees);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des données');
      showToast({
        message: appError.message || 'Erreur lors du chargement des données',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Convertir les tâches en format Kanban
  const kanbanCards = tasks.map((task: ProjectTask) => ({
    id: task.id.toString(),
    title: task.title,
    description: task.description || undefined,
    priority: (task.priority === 'urgent' ? 'high' : task.priority) as 'low' | 'medium' | 'high' | undefined,
    assignee: task.assignee_name || undefined,
    status: task.status,
  }));

  // Colonnes du Kanban
  const columns = [
    {
      id: 'todo',
      title: 'The Shelf',
      status: 'todo',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'in_progress',
      title: 'En cours',
      status: 'in_progress',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'blocked',
      title: 'The Storage',
      status: 'blocked',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      id: 'to_transfer',
      title: 'The Checkout',
      status: 'to_transfer',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
  ];

  // Grouper les tâches par employé
  const tasksByEmployee = employees.map((employee) => ({
    employee,
    tasks: tasks.filter((task) => task.assignee_id === employee.id && task.status === 'in_progress'),
  }));

  const handleCardMove = async (cardId: string, newStatus: string) => {
    const taskId = parseInt(cardId);
    const task = tasks.find((t) => t.id === taskId);
    
    if (!task) return;
    
    try {
      setUpdatingTask(cardId);
      await projectTasksAPI.update(taskId, { status: newStatus as ProjectTask['status'] });
      
      // Mettre à jour localement
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as ProjectTask['status'] } : t
        )
      );
      
      showToast({
        message: 'Tâche mise à jour avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour de la tâche',
        type: 'error',
      });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleCardClick = (card: { id: string }) => {
    // TODO: Ouvrir modal de détails de la tâche
    console.log('Card clicked:', card.id);
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high' | 'urgent') => {
    const colors = {
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getTeamName = (slug: string) => {
    const names: Record<string, string> = {
      bureau: 'Bureau',
      studio: 'Studio',
      lab: 'Lab',
    };
    return names[slug] || slug;
  };

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      </MotionDiv>
    );
  }

  if (error || !team) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title={`Gestion de projet - ${getTeamName(teamSlug)}`}
          description="Gérez les tâches et les employés de l'équipe"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Projets', href: '/dashboard/projets' },
            { label: 'Équipes', href: '/dashboard/projets/equipes' },
            { label: getTeamName(teamSlug) },
          ]}
        />
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title={`Gestion de projet - ${team.name}`}
        description="Gérez les tâches et les employés de l'équipe"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Projets', href: '/dashboard/projets' },
          { label: 'Équipes', href: '/dashboard/projets/equipes' },
          { label: team.name },
        ]}
      />

      {/* Vue des employés et leurs tâches en cours */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              Employés et tâches en cours
            </h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une tâche
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tasksByEmployee.map(({ employee, tasks: employeeTasks }) => (
              <div
                key={employee.id}
                className="border border-border rounded-lg p-4 bg-muted/30"
              >
                <div className="flex items-center gap-3 mb-4">
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
                  </div>
                </div>

                <div className="space-y-2">
                  {employeeTasks.length > 0 ? (
                    employeeTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        className="p-3 rounded-lg bg-background border border-border cursor-move hover:shadow-sm transition-shadow"
                      >
                        <p className="text-sm font-medium text-foreground mb-1">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs px-2 py-0.5 ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Aucune tâche en cours
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Kanban Board avec les 3 sections */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Gestion des tâches</h2>
          <KanbanBoard
            columns={columns.map(col => ({ id: col.id, title: col.title, status: col.status }))}
            cards={kanbanCards.map(card => ({
              id: card.id,
              title: card.title,
              description: card.description,
              status: card.status,
              priority: card.priority as 'low' | 'medium' | 'high' | undefined,
              assignee: card.assignee,
            }))}
            onCardMove={handleCardMove}
            onCardClick={(card) => handleCardClick({ id: card.id })}
          />
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function TeamProjectManagementPage() {
  return <TeamProjectManagementContent />;
}
