'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Badge, Button, Loading, Alert, Modal, Input, Textarea } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Users, CheckCircle2, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
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

interface KanbanColumn {
  id: string;
  title: string;
  status: ProjectTask['status'];
  tasks: ProjectTask[];
  color: string;
  icon: string;
}

function TeamProjectManagementContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const teamSlug = params?.slug as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [, setEmployeesWithCapacity] = useState<EmployeeType[]>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as ProjectTask['priority'],
    status: 'todo' as ProjectTask['status'],
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
        const appError = handleApiError(err);
        if (appError.statusCode === 404) {
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
      
      setTeam(foundTeam);
      
      // Charger les employés
      const employeesResponse = await employeesAPI.list(0, 100);
      setEmployeesWithCapacity(employeesResponse);
      
      const employeesList: Employee[] = (foundTeam.members || []).map((member: TeamMember) => ({
        id: member.user_id,
        name: member.user?.name || 
              `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() ||
              member.user?.email ||
              'Utilisateur',
        email: member.user?.email || '',
      }));
      setEmployees(employeesList);
      
      // Charger les projets
      const projectsResponse = await projectsAPI.list();
      const projectsList = Array.isArray(projectsResponse) ? projectsResponse : [];
      setProjects(projectsList.map((p: any) => ({ id: p.id, name: p.name })));
      
      // Charger les tâches de l'équipe
      const teamTasks = await projectTasksAPI.list({ team_id: foundTeam.id });
      setTasks(teamTasks);
      
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

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      showToast({ message: 'Le titre est requis', type: 'error' });
      return;
    }

    if (!team) {
      showToast({ message: 'Équipe non trouvée', type: 'error' });
      return;
    }

    try {
      setCreatingTask(true);
      
      await projectTasksAPI.create({
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        status: taskForm.status,
        project_id: taskForm.project_id || undefined,
        assignee_id: taskForm.employee_assignee_id || undefined,
        team_id: team.id,
      });
      
      showToast({ message: 'Tâche créée avec succès', type: 'success' });
      setShowCreateTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        project_id: null,
        employee_assignee_id: null,
      });
      
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

  const handleDragStart = (task: ProjectTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: ProjectTask['status']) => {
    if (!draggedTask) return;

    try {
      await projectTasksAPI.update(draggedTask.id, { status });
      showToast({ message: 'Tâche déplacée avec succès', type: 'success' });
      await loadTeamData();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du déplacement de la tâche',
        type: 'error',
      });
    } finally {
      setDraggedTask(null);
    }
  };

  const getPriorityColor = (priority: ProjectTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: ProjectTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Normale';
    }
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
        <Alert variant="error">{error || 'Équipe non trouvée'}</Alert>
      </PageContainer>
    );
  }

  // Organiser les tâches par colonne
  const columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'À faire',
      status: 'todo',
      tasks: tasks.filter(t => t.status === 'todo'),
      color: 'bg-gray-100 dark:bg-gray-800',
      icon: '📋',
    },
    {
      id: 'in_progress',
      title: 'En cours',
      status: 'in_progress',
      tasks: tasks.filter(t => t.status === 'in_progress'),
      color: 'bg-blue-50 dark:bg-blue-900/20',
      icon: '⚡',
    },
    {
      id: 'in_review',
      title: 'En révision',
      status: 'in_review' as any,
      tasks: tasks.filter(t => (t.status as any) === 'in_review'),
      color: 'bg-purple-50 dark:bg-purple-900/20',
      icon: '👁️',
    },
    {
      id: 'completed',
      title: 'Terminé',
      status: 'completed',
      tasks: tasks.filter(t => t.status === 'completed'),
      color: 'bg-green-50 dark:bg-green-900/20',
      icon: '✅',
    },
  ];

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <button
              onClick={() => router.push('/dashboard/projets/equipes')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux équipes</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {team.name}
                </h1>
                <p className="text-white/80 text-lg">
                  {team.description || 'Gérez les tâches et les membres de l\'équipe'}
                </p>
              </div>
              <Button
                onClick={() => setShowCreateTaskModal(true)}
                className="bg-white text-[#523DC9] hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle tâche
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {team.members?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Membres</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {inProgressTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En cours</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {completedTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Terminées</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {completionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Complétion</div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex-1 min-w-[300px] max-w-[350px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.status)}
              >
                <div className="glass-card rounded-xl border border-[#A7A2CF]/20 h-full flex flex-col">
                  {/* Column Header */}
                  <div className={`p-4 rounded-t-xl ${column.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{column.icon}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {column.title}
                        </h3>
                      </div>
                      <Badge variant="default">{column.tasks.length}</Badge>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[600px]">
                    {column.tasks.map((task) => {
                      const assignee = employees.find(e => e.id === task.assignee_id);
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9] hover:shadow-lg transition-all duration-200 cursor-move group"
                        >
                          {/* Priority Badge */}
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="default" className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            {(task as any).deadline && (
                              <span className="text-xs text-gray-500">
                                {new Date((task as any).deadline).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>

                          {/* Task Title */}
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors">
                            {task.title}
                          </h4>

                          {/* Task Description */}
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Assignee */}
                          {assignee && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#523DC9] to-[#5F2B75] flex items-center justify-center text-white text-xs font-bold">
                                {assignee.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {assignee.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {column.tasks.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">Aucune tâche</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MotionDiv>

      {/* Modal Create Task */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        title="Créer une nouvelle tâche"
      >
        <div className="space-y-4">
          <Input
            label="Titre"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Titre de la tâche"
            required
          />

          <Textarea
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Description de la tâche"
            rows={3}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priorité</label>
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as ProjectTask['priority'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
            <select
              value={taskForm.status}
              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as ProjectTask['status'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="in_review">En révision</option>
              <option value="completed">Terminé</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigner à</label>
            <select
              value={taskForm.employee_assignee_id?.toString() || ''}
              onChange={(e) => setTaskForm({ ...taskForm, employee_assignee_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Non assigné</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Projet</label>
            <select
              value={taskForm.project_id?.toString() || ''}
              onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Aucun projet</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateTask}
              disabled={creatingTask}
              className="flex-1"
            >
              {creatingTask ? 'Création...' : 'Créer la tâche'}
            </Button>
            <Button
              onClick={() => setShowCreateTaskModal(false)}
              variant="outline"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

export default function TeamProjectManagementPage() {
  return <TeamProjectManagementContent />;
}
