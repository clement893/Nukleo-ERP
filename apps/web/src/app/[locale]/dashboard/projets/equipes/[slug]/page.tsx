'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button, Loading, Alert, Modal, Input, Textarea, Select } from '@/components/ui';
import KanbanBoard from '@/components/ui/KanbanBoard';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Users, Clock, AlertCircle, Package, ShoppingCart } from 'lucide-react';
import { teamsAPI } from '@/lib/api/teams';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { extractApiData } from '@/lib/api/utils';
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
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as ProjectTask['priority'],
    assignee_id: null as number | null,
  });

  useEffect(() => {
    if (teamSlug) {
      loadTeamData();
    }
  }, [teamSlug]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let foundTeam: Team | null = null;
      
      // Récupérer l'équipe directement par slug
      try {
        const teamResponse = await teamsAPI.getTeamBySlug(teamSlug);
        foundTeam = extractApiData<Team>(teamResponse);
        
        if (!foundTeam) {
          setError('Équipe non trouvée');
          return;
        }
      } catch (err) {
        // Si l'équipe n'existe pas, essayer de la créer automatiquement
        const appError = handleApiError(err);
        if (appError.statusCode === 404) {
          // Essayer de créer l'équipe si elle correspond aux équipes requises
          const requiredTeams = [
            { name: 'Le Bureau', slug: 'le-bureau' },
            { name: 'Le Studio', slug: 'le-studio' },
            { name: 'Le Lab', slug: 'le-lab' },
            { name: 'Équipe Gestion', slug: 'equipe-gestion' },
          ];
          
          const teamToCreate = requiredTeams.find(t => t.slug === teamSlug);
          if (teamToCreate) {
            try {
              const createResponse = await teamsAPI.create({
                name: teamToCreate.name,
                slug: teamToCreate.slug,
                description: `Équipe ${teamToCreate.name}`,
              });
              foundTeam = extractApiData<Team>(createResponse) as Team | null;
            } catch (createErr) {
              console.error('Error creating team:', createErr);
            }
          }
        }
        
        if (!foundTeam) {
          setError(appError.message || 'Équipe non trouvée');
          return;
        }
      }
      
      // S'assurer qu'on a une équipe avant de continuer
      if (!foundTeam) {
        setError('Équipe non trouvée');
        return;
      }
      
      // Mettre à jour le state avec l'équipe trouvée
      setTeam(foundTeam);
      
      // Charger les tâches de l'équipe
      try {
        const teamTasks = await projectTasksAPI.list({ team_id: foundTeam.id });
        setTasks(teamTasks);
      } catch (taskErr) {
        console.error('Error loading team tasks:', taskErr);
        // Continuer même si les tâches ne peuvent pas être chargées
        setTasks([]);
      }
      
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

  const handleCreateTask = async () => {
    if (!team) return;
    
    if (!taskForm.title.trim()) {
      showToast({
        message: 'Le titre de la tâche est requis',
        type: 'error',
      });
      return;
    }

    try {
      setCreatingTask(true);
      const newTask = await projectTasksAPI.create({
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        team_id: team.id,
        assignee_id: taskForm.assignee_id || null,
        status: 'todo',
      });
      
      setTasks([...tasks, newTask]);
      setShowCreateTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: null,
      });
      
      showToast({
        message: 'Tâche créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de la tâche',
        type: 'error',
      });
    } finally {
      setCreatingTask(false);
    }
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
            { label: 'Modules Opérations', href: '/dashboard/projets' },
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
            <Button size="sm" onClick={() => setShowCreateTaskModal(true)}>
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

      {/* Modal de création de tâche */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => {
          setShowCreateTaskModal(false);
          setTaskForm({
            title: '',
            description: '',
            priority: 'medium',
            assignee_id: null,
          });
        }}
        title="Créer une nouvelle tâche"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateTaskModal(false);
                setTaskForm({
                  title: '',
                  description: '',
                  priority: 'medium',
                  assignee_id: null,
                });
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateTask} loading={creatingTask}>
              Créer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Input
              label="Titre de la tâche *"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Ex: Réaliser le design de la page d'accueil"
              fullWidth
            />
          </div>
          <div>
            <Textarea
              label="Description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Description de la tâche..."
              rows={4}
              fullWidth
            />
          </div>
          <div>
            <Select
              label="Priorité"
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  priority: e.target.value as ProjectTask['priority'],
                })
              }
              fullWidth
              options={[
                { value: 'low', label: 'Basse' },
                { value: 'medium', label: 'Moyenne' },
                { value: 'high', label: 'Haute' },
                { value: 'urgent', label: 'Urgente' },
              ]}
            />
          </div>
          {employees.length > 0 && (
            <div>
              <Select
                label="Assigner à (optionnel)"
                value={taskForm.assignee_id?.toString() || ''}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    assignee_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                fullWidth
                options={[
                  { value: '', label: 'Non assigné' },
                  ...employees.map((emp) => ({
                    value: emp.id.toString(),
                    label: emp.name,
                  })),
                ]}
              />
            </div>
          )}
        </div>
      </Modal>
    </MotionDiv>
  );
}

export default function TeamProjectManagementPage() {
  return <TeamProjectManagementContent />;
}
