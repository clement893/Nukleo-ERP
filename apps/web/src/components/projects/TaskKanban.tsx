'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/components/ui';
import { projectTasksAPI, type ProjectTask, type TaskStatus, type TaskPriority } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api';
import { employeesAPI } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { Plus, Edit, Trash2, Calendar, User, GripVertical, Clock } from 'lucide-react';
import TaskTimer from './TaskTimer';
import ProjectAttachments from './ProjectAttachments';
import ProjectComments from './ProjectComments';
import { validateEstimatedHours } from '@/lib/utils/capacity-validation';

interface TaskKanbanProps {
  projectId?: number;
  teamId?: number;
  assigneeId?: number;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'todo', label: 'À faire', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-500/10' },
  { status: 'in_progress', label: 'En cours', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-500/10' },
  { status: 'blocked', label: 'Bloqué', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-500/10' },
  { status: 'to_transfer', label: 'À transférer', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-500/10' },
  { status: 'completed', label: 'Terminé', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-500/10' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Élevée',
  urgent: 'Urgente',
};

export default function TaskKanban({ projectId, teamId, assigneeId }: TaskKanbanProps) {
  const { success, error: showErrorToast } = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string; email?: string }>>([]);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    project_id: number | null;
    employee_assignee_id: number | null;  // Use employee_id instead of user_id
    due_date: string | undefined;
    estimated_hours: number | null;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    project_id: projectId || null,
    employee_assignee_id: null,
    due_date: undefined,
    estimated_hours: null,
  });

  const loadTasks = useCallback(async (showToastOnError = false, bypassCache = false) => {
    try {
      const params: { project_id?: number; team_id?: number; assignee_id?: number; _t?: number } = {};
      if (projectId && projectId > 0) {
        params.project_id = projectId;
      }
      if (teamId) {
        params.team_id = teamId;
      }
      if (assigneeId) {
        params.assignee_id = assigneeId;
      }
      // Add timestamp to bypass cache
      if (bypassCache) {
        params._t = Date.now();
      }
      // Force cache refresh by making a fresh API call with timestamp
      const data = await projectTasksAPI.list(params);
      setTasks(data || []);
      setError(null);
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors du chargement des tâches';
      setError(errorMessage);
      if (showToastOnError) {
        showErrorToast(errorMessage);
      }
    }
  }, [projectId, teamId, assigneeId, showErrorToast]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params: { project_id?: number; team_id?: number; assignee_id?: number } = {};
        if (projectId && projectId > 0) {
          params.project_id = projectId;
        }
        if (teamId) {
          params.team_id = teamId;
        }
        if (assigneeId) {
          params.assignee_id = assigneeId;
        }
        const data = await projectTasksAPI.list(params);
        setTasks(data || []);
        setError(null);
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message || 'Erreur lors du chargement des tâches');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [projectId, teamId, assigneeId]);

  // Load projects and employees for the form
  useEffect(() => {
    const loadProjectsAndEmployees = async () => {
      try {
        // Load projects
        const projectsData = await projectsAPI.list();
        const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
        setProjects(projectsList.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));

        // Load all employees (they can all be assigned - User will be created automatically if needed)
        const employeesData = await employeesAPI.list(0, 1000);
        setEmployees(employeesData.map((e) => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          email: e.email ?? undefined,
        })));
      } catch (err) {
        console.error('Error loading projects/employees:', err);
      }
    };
    loadProjectsAndEmployees();
  }, []);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      project_id: projectId || null,
      employee_assignee_id: null,
      due_date: undefined,
      estimated_hours: null,
    });
    setShowTaskModal(true);
  };

  const handleEditTask = async (task: ProjectTask) => {
    setSelectedTask(task);
    
    // If task has assignee_id, try to find the corresponding employee
    let employee_assignee_id: number | null = null;
    if (task.assignee_id) {
      try {
        // Try to find employee by user_id
        const allEmployees = await employeesAPI.list(0, 1000);
        const matchingEmployee = allEmployees.find(e => e.user_id === task.assignee_id);
        if (matchingEmployee) {
          employee_assignee_id = matchingEmployee.id;
        }
      } catch (err) {
        console.error('Error loading employees for edit:', err);
      }
    }
    
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      project_id: task.project_id ?? null,
      employee_assignee_id: employee_assignee_id,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
      estimated_hours: task.estimated_hours || null,
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      const errorMsg = 'Le titre de la tâche est requis';
      setError(errorMsg);
      showErrorToast(errorMsg);
      return;
    }

    
    // Validate estimated hours
    if (formData.estimated_hours !== null && formData.estimated_hours !== undefined) {
      const validation = validateEstimatedHours(formData.estimated_hours);
      if (!validation.valid) {
        const errorMsg = validation.error || 'Heures prévues invalides';
        setError(errorMsg);
        showErrorToast(errorMsg);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      if (selectedTask) {
        // Update existing task
        const updatedTask = await projectTasksAPI.update(selectedTask.id, {
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          project_id: formData.project_id || null,
          employee_assignee_id: formData.employee_assignee_id || null,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          estimated_hours: formData.estimated_hours || null,
        });
        success('Tâche modifiée avec succès');
        
        // Optimistic update: update task in local state immediately
        setTasks(prevTasks => 
          prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
        );
      } else {
        // Create new task - team_id is required
        if (!teamId) {
          const errorMsg = 'Une équipe est requise pour créer une tâche';
          setError(errorMsg);
          showErrorToast(errorMsg);
          setSaving(false);
          return;
        }
        const newTask = await projectTasksAPI.create({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          team_id: teamId,
          project_id: formData.project_id || null,
          employee_assignee_id: formData.employee_assignee_id || null,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          estimated_hours: formData.estimated_hours || null,
          order: tasks.length,
        });
        success('Tâche créée avec succès');
        
        // Optimistic update: add new task to local state immediately
        setTasks(prevTasks => [...prevTasks, newTask]);
      }

      // Refresh tasks with cache bypass to ensure we have the latest data
      // This runs in background and will update if there are any differences
      loadTasks(false, true).catch(() => {
        // Silently fail - we already updated optimistically
      });
      
      // Close modal only after successful refresh
      setShowTaskModal(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        project_id: projectId || null,
        employee_assignee_id: null,
        due_date: undefined,
        estimated_hours: null,
      });
      setSelectedTask(null);
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors de la sauvegarde de la tâche';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      setLoading(true);
      await projectTasksAPI.delete(taskId);
      success('Tâche supprimée avec succès');
      
      // Optimistic update: remove task from local state immediately
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Refresh with cache bypass in background
      loadTasks(false, true).catch(() => {
        // Silently fail - we already updated optimistically
      });
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors de la suppression de la tâche';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (task: ProjectTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const updatedTask = await projectTasksAPI.update(draggedTask.id, {
        status: newStatus,
      });
      
      // Optimistic update: update task status in local state immediately
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
      
      setDraggedTask(null);
      
      // Refresh with cache bypass in background
      loadTasks(false, true).catch(() => {
        // Silently fail - we already updated optimistically
      });
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors du déplacement de la tâche';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setDraggedTask(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Tâches du projet</h2>
        <Button onClick={handleCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map(({ status, label, color, bgColor }) => {
          const columnTasks = getTasksByStatus(status);
          return (
            <div
              key={status}
              className="flex flex-col min-w-[250px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={`glass-card rounded-xl p-4 mb-3 ${bgColor}`}>
                <h3 className={`font-bold ${color} flex items-center justify-between`}>
                  <span>{label}</span>
                  <span className="glass-badge px-2 py-1 rounded-full text-sm">{columnTasks.length}</span>
                </h3>
              </div>
              <div className="space-y-3 flex-1 min-h-[400px]">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="glass-card p-4 rounded-xl cursor-move hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                    draggable
                    onDragStart={() => handleDragStart(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className={`glass-badge px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]} text-white`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Edit className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium text-foreground mb-2">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.due_date)}
                          </div>
                        )}
                        {task.assignee_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee_name}
                          </div>
                        )}
                      </div>
                      <TaskTimer taskId={task.id} onTimeTracked={loadTasks} />
                    </div>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucune tâche
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={selectedTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Titre *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de la tâche"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la tâche"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Projet
              </label>
              <Select
                value={formData.project_id?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : null })}
                options={[
                  { value: '', label: 'Non assigné' },
                  ...projects.map(p => ({ value: p.id.toString(), label: p.name }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Employé assigné
              </label>
              <Select
                value={formData.employee_assignee_id?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, employee_assignee_id: e.target.value ? parseInt(e.target.value) : null })}
                options={[
                  { value: '', label: 'Non assigné' },
                  ...employees.map(e => ({ 
                    value: e.id.toString(), 
                    label: `${e.first_name} ${e.last_name}${e.email ? ` (${e.email})` : ''}` 
                  }))
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                options={STATUS_COLUMNS.map(({ status, label }) => ({ value: status, label }))}
              />
            </div>

            <div>
              <Select
                label="Priorité"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Date d'échéance
              </label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Heures prévues
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimated_hours: e.target.value ? parseFloat(e.target.value) : null 
                })}
                placeholder="Ex: 8"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTaskModal(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveTask} loading={saving}>
              {selectedTask ? 'Modifier' : 'Créer'}
            </Button>
          </div>

          {/* Files and Comments for existing tasks */}
          {selectedTask && (
            <div className="mt-8 space-y-6 border-t border-border pt-6">
              <div>
                <h4 className="text-md font-semibold text-foreground mb-4">Fichiers attachés</h4>
                <ProjectAttachments taskId={selectedTask.id} projectId={selectedTask.project_id || undefined} />
              </div>
              <div>
                <h4 className="text-md font-semibold text-foreground mb-4">Discussions</h4>
                <ProjectComments taskId={selectedTask.id} projectId={selectedTask.project_id || undefined} />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
