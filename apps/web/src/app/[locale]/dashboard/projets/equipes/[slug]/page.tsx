'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Badge, Button, Loading, Alert, Modal, Input, Textarea, Select, Heading, Text } from '@/components/ui';
import TaskKanban from '@/components/projects/TaskKanban';
import CapacityVisualization from '@/components/projects/CapacityVisualization';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Users, ArrowLeft } from 'lucide-react';
import { teamsAPI } from '@/lib/api/teams';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api';
import { employeesAPI, type Employee as EmployeeType } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { extractApiData } from '@/lib/api/utils';
import { useRouter } from '@/i18n/routing';
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
  const router = useRouter();
  const { showToast } = useToast();
  const teamSlug = params?.slug as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesWithCapacity, setEmployeesWithCapacity] = useState<EmployeeType[]>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as ProjectTask['priority'],
    project_id: null as number | null,
    employee_assignee_id: null as number | null,
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
      
      // Charger les employés avec leurs capacités
      try {
        const allEmployees = await employeesAPI.list();
        // Filtrer les employés de cette équipe
        const teamEmployeesData = allEmployees.filter(
          (emp) => emp.team_id === foundTeam.id
        );
        setEmployeesWithCapacity(teamEmployeesData);
      } catch (empErr) {
        console.error('Error loading employees:', empErr);
        setEmployeesWithCapacity([]);
      }
      
      // Charger les projets
      try {
        const projectsData = await projectsAPI.list();
        const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
        setProjects(projectsList.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
      } catch (projErr) {
        console.error('Error loading projects:', projErr);
        setProjects([]);
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

  // Grouper les tâches par employé
  const tasksByEmployee = employees.map((employee) => ({
    employee,
    tasks: tasks.filter((task) => task.assignee_id === employee.id && task.status === 'in_progress'),
  }));

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
        project_id: taskForm.project_id || null,
        employee_assignee_id: taskForm.employee_assignee_id || null,
        status: 'todo',
      });
      
      setTasks([...tasks, newTask]);
      setShowCreateTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium' as ProjectTask['priority'],
        project_id: null,
        employee_assignee_id: null,
      });
      
      showToast({
        message: 'Tâche créée avec succès',
        type: 'success',
      });
      
      // Recharger les données
      await loadTeamData();
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

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error || !team) {
    return (
      <PageContainer>
        <MotionDiv variant="slideUp" duration="normal" className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
              backgroundSize: '200px 200px'
            }} />
            
            <div className="relative">
              <Heading level={1} className="text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Équipe
              </Heading>
              <Text variant="body" className="text-white/80 text-lg">Gestion de projet</Text>
            </div>
          </div>
          
          {error && <Alert variant="error">{error}</Alert>}
        </MotionDiv>
      </PageContainer>
    );
  }

  return (
    <div className="flex flex-col h-screen min-h-screen -mx-3 sm:-mx-4 md:-mx-6 xl:-mx-8 2xl:-mx-10 px-3 sm:px-4 md:px-6 xl:px-8 2xl:px-10 py-4 sm:py-6 md:py-8 2xl:py-8">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 min-h-0 space-y-6">
        {/* Header avec gradient Aurora Borealis */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <button
              onClick={() => router.push('/dashboard/projets/equipes')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
              aria-label="Retour à la liste des équipes"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Retour aux équipes</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <Heading level={1} className="text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {team.name}
                </Heading>
                <Text variant="body" className="text-white/80 text-lg">
                  {team.description || 'Gérez les tâches et les employés de l\'équipe'}
                </Text>
              </div>
              <Button 
                className="bg-white text-[#523DC9] hover:bg-white/90"
                onClick={() => setShowCreateTaskModal(true)}
                aria-label="Ajouter une nouvelle tâche"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Ajouter une tâche
              </Button>
            </div>
          </div>
        </div>

        {/* Vue des employés et leurs tâches en cours */}
        <div className="glass-card p-lg rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#523DC9]" aria-hidden="true" />
            <Heading level={2} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Employés et tâches en cours
            </Heading>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tasksByEmployee.map(({ employee, tasks: employeeTasks }) => (
              <div
                key={employee.id}
                className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:scale-102 transition-transform"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#523DC9] to-[#5F2B75] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {employee.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text variant="small" className="font-medium text-foreground truncate">
                      {employee.name}
                    </Text>
                    <Text variant="caption" className="text-muted-foreground truncate">
                      {employee.email}
                    </Text>
                  </div>
                </div>

                <div className="space-y-2">
                  {employeeTasks.length > 0 ? (
                    employeeTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-border cursor-move hover:shadow-sm hover:border-[#523DC9]/40 transition-all"
                        aria-label={`Tâche ${task.title}, priorité ${task.priority}`}
                      >
                        <Text variant="small" className="font-medium text-foreground mb-1">
                          {task.title}
                        </Text>
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
                    <Text variant="small" className="text-muted-foreground text-center py-2">
                      Aucune tâche en cours
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visualisation de la capacité */}
        {team && employeesWithCapacity.length > 0 && (
          <div className="glass-card p-lg rounded-xl border border-border">
            <CapacityVisualization
              tasks={tasks}
              employees={employeesWithCapacity}
              teamId={team.id}
            />
          </div>
        )}

        {/* Kanban Board avec le composant TaskKanban */}
        <div className="glass-card p-lg rounded-xl border border-border flex-1 flex flex-col min-h-0">
          {team && (
            <div className="flex-1 flex flex-col min-h-0">
              <TaskKanban teamId={team.id} />
            </div>
          )}
        </div>

        {/* Modal de création de tâche */}
        <Modal
          isOpen={showCreateTaskModal}
          onClose={() => {
            setShowCreateTaskModal(false);
            setTaskForm({
              title: '',
              description: '',
              priority: 'medium' as ProjectTask['priority'],
              project_id: null,
              employee_assignee_id: null,
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
                    priority: 'medium' as ProjectTask['priority'],
                    project_id: null,
                    employee_assignee_id: null,
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
                label="Projet"
                value={taskForm.project_id?.toString() || ''}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    project_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                fullWidth
                options={[
                  { value: '', label: 'Non assigné' },
                  ...projects.map((proj) => ({
                    value: proj.id.toString(),
                    label: proj.name,
                  }))
                ]}
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
                  label="Assigner à"
                  value={taskForm.employee_assignee_id?.toString() || ''}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      employee_assignee_id: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  fullWidth
                  options={[
                    { value: '', label: 'Non assigné' },
                    ...employees.map((emp) => ({
                      value: emp.id.toString(),
                      label: emp.name,
                    }))
                  ]}
                />
              </div>
            )}
          </div>
        </Modal>
      </MotionDiv>
    </div>
  );
}

export default function TeamProjectManagementPage() {
  return <TeamProjectManagementContent />;
}
