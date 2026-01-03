'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
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
import { Plus, Edit, Trash2, Calendar, User, GripVertical, Clock, MoreVertical, Copy, X, CheckCircle2, Play, MessageSquare, Paperclip } from 'lucide-react';
import TaskTimer from './TaskTimer';
import { timeEntriesAPI } from '@/lib/api/time-entries';
import ProjectAttachments from './ProjectAttachments';
import ProjectComments from './ProjectComments';
import { validateEstimatedHours } from '@/lib/utils/capacity-validation';
import Dropdown from '@/components/ui/Dropdown';

interface TaskKanbanProps {
  projectId?: number;
  teamId?: number;
  assigneeId?: number;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'todo', label: 'À faire', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-500/10' },
  { status: 'in_progress', label: 'En cours', color: 'text-primary-700 dark:text-primary-300', bgColor: 'bg-primary-500/10' },
  { status: 'blocked', label: 'Bloqué', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-500/10' },
  { status: 'to_transfer', label: 'À transférer', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-500/10' },
  { status: 'completed', label: 'Terminé', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-500/10' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-primary-500',
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
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [taskDetails, setTaskDetails] = useState<ProjectTask | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string; email?: string }>>([]);
  const [activeTimer, setActiveTimer] = useState<{ taskId: number; elapsedSeconds: number } | null>(null);
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

  // Load and update active timer status
  useEffect(() => {
    const loadTimerStatus = async () => {
      try {
        const status = await timeEntriesAPI.getTimerStatus();
        if (status.active && status.start_time && status.task_id) {
          const startTime = new Date(status.start_time).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          setActiveTimer({
            taskId: status.task_id,
            elapsedSeconds,
          });
        } else {
          setActiveTimer(null);
        }
      } catch (err) {
        // Silently fail - timer might not be available
        setActiveTimer(null);
      }
    };

    loadTimerStatus();
    const interval = setInterval(loadTimerStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update elapsed time every second if timer is active
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
          };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeTimer]);

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

  const handleOpenTaskDetails = async (task: ProjectTask) => {
    setLoadingDetails(true);
    try {
      const details = await projectTasksAPI.get(task.id);
      setTaskDetails(details);
      setTitleValue(details.title);
      setEditingTitle(false);
      setShowTaskDrawer(true);
    } catch (err) {
      const appError = handleApiError(err);
      showErrorToast(appError.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fonction pour sauvegarder une tâche avec debounce
  const saveTaskField = useCallback(async (updates: Partial<ProjectTask>) => {
    if (!taskDetails) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Update local state optimistically
    setTaskDetails(prev => prev ? { ...prev, ...updates } : null);

    // Debounce the API call
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingTask(true);
        const updatedTask = await projectTasksAPI.update(taskDetails.id, updates as any);
        setTaskDetails(updatedTask);
        // Also update in tasks list
        setTasks(prevTasks => 
          prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
        );
      } catch (err) {
        const appError = handleApiError(err);
        showErrorToast(appError.message || 'Erreur lors de la sauvegarde');
        // Revert on error
        const originalTask = await projectTasksAPI.get(taskDetails.id);
        setTaskDetails(originalTask);
      } finally {
        setSavingTask(false);
      }
    }, 800); // 800ms debounce
  }, [taskDetails, showErrorToast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  const handleDuplicateTask = async (task: ProjectTask) => {
    try {
      setSaving(true);
      // Get full task details if needed
      const taskDetails = await projectTasksAPI.get(task.id);
      
      const duplicatedTask = await projectTasksAPI.create({
        title: `${taskDetails.title} (copie)`,
        description: taskDetails.description || null,
        status: 'todo',
        priority: taskDetails.priority,
        team_id: taskDetails.team_id,
        project_id: taskDetails.project_id,
        assignee_id: taskDetails.assignee_id,
        due_date: taskDetails.due_date || null,
        estimated_hours: taskDetails.estimated_hours || null,
      });
      
      success('Tâche dupliquée avec succès');
      await loadTasks(false, true);
      
      // Open the duplicated task in drawer
      const newTaskDetails = await projectTasksAPI.get(duplicatedTask.id);
      setTaskDetails(newTaskDetails);
      setShowTaskDrawer(true);
    } catch (err) {
      const appError = handleApiError(err);
      showErrorToast(appError.message || 'Erreur lors de la duplication de la tâche');
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
      
      // Close drawer if the deleted task is open
      if (taskDetails?.id === taskId) {
        setShowTaskDrawer(false);
        setTaskDetails(null);
      }
      
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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6">
      {error && (
        <Alert variant="error" className="mb-4 flex-shrink-0">
          {error}
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-foreground">Tâches du projet</h2>
        <Button onClick={handleCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
        {STATUS_COLUMNS.map(({ status, label, color, bgColor }) => {
          const columnTasks = getTasksByStatus(status);
          return (
            <div
              key={status}
              className="flex flex-col min-w-[280px] flex-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={`glass-card rounded-xl p-4 mb-3 ${bgColor} flex-shrink-0`}>
                <h3 className={`font-bold ${color} flex items-center justify-between`}>
                  <span>{label}</span>
                  <span className="glass-badge px-2 py-1 rounded-full text-sm">{columnTasks.length}</span>
                </h3>
              </div>
              <div className="space-y-3 flex-1 min-h-[500px] max-h-full overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="glass-card p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-200"
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onClick={(e: React.MouseEvent) => {
                      // Ne pas ouvrir si on clique sur les boutons d'action
                      if ((e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      handleOpenTaskDetails(task);
                    }}
                  >
                    <Card className="border-0 shadow-none p-0 bg-transparent">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className={`glass-badge px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]} text-white`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                    {/* Active timer indicator */}
                    {activeTimer && activeTimer.taskId === task.id && (
                      <div className="mb-3 p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                            Timer actif
                          </span>
                          <span className="text-sm font-bold text-primary-700 dark:text-primary-300 font-mono ml-auto">
                            {formatTime(activeTimer.elapsedSeconds)}
                          </span>
                        </div>
                      </div>
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
                      <TaskTimer taskId={task.id} onTimeTracked={() => {
                        loadTasks();
                        // Reset active timer when stopped
                        setActiveTimer(null);
                      }} />
                    </div>
                    </Card>
                  </div>
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

      {/* Drawer de détails de la tâche - Version améliorée avec sections verticales */}
      <Drawer
        isOpen={showTaskDrawer}
        onClose={() => {
          setShowTaskDrawer(false);
          setTaskDetails(null);
        }}
        title=""
        position="right"
        size="xl"
        closeOnOverlayClick={true}
        closeOnEscape={true}
        className="!w-[600px]"
        showCloseButton={false}
      >
        {loadingDetails ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : taskDetails ? (
          <div className="flex flex-col h-full">
            {/* Header personnalisé avec titre et menu d'actions */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                {editingTitle ? (
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={() => {
                      if (titleValue.trim() && titleValue !== taskDetails.title) {
                        saveTaskField({ title: titleValue.trim() });
                      } else {
                        setTitleValue(taskDetails.title);
                      }
                      setEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        setTitleValue(taskDetails.title);
                        setEditingTitle(false);
                      }
                    }}
                    className="w-full text-xl font-semibold text-foreground mb-2 bg-transparent border-b-2 border-primary-500 focus:outline-none pb-1"
                    autoFocus
                  />
                ) : (
                  <h2 
                    className="text-xl font-semibold text-foreground mb-2 break-words cursor-text hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    onClick={() => setEditingTitle(true)}
                  >
                    {taskDetails.title}
                  </h2>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLUMNS.find(s => s.status === taskDetails.status)?.bgColor} ${STATUS_COLUMNS.find(s => s.status === taskDetails.status)?.color}`}>
                    {STATUS_COLUMNS.find(s => s.status === taskDetails.status)?.label || taskDetails.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${PRIORITY_COLORS[taskDetails.priority]}`}>
                    {PRIORITY_LABELS[taskDetails.priority]}
                  </span>
                  {savingTask && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                      Enregistrement...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Actions rapides */}
                {taskDetails.status !== 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      await saveTaskField({ status: 'completed' });
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Compléter
                  </Button>
                )}
                {taskDetails.status === 'todo' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await saveTaskField({ status: 'in_progress' });
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    Commencer
                  </Button>
                )}
                <Dropdown
                  trigger={
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      aria-label="Menu d'actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  }
                  items={[
                    {
                      label: 'Dupliquer',
                      icon: <Copy className="w-4 h-4" />,
                      onClick: () => handleDuplicateTask(taskDetails),
                    },
                    {
                      label: 'Supprimer',
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: () => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                          handleDeleteTask(taskDetails.id);
                        }
                      },
                      variant: 'danger',
                    },
                  ]}
                  position="bottom"
                />
                <button
                  onClick={() => {
                    setShowTaskDrawer(false);
                    setTaskDetails(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu avec sections verticales */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Section: Assigné & Échéance */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Assigné & Échéance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      {taskDetails.assignee_name ? (
                        <span className="text-sm text-foreground">{taskDetails.assignee_name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Non assigné</span>
                      )}
                    </div>
                    {taskDetails.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          {new Date(taskDetails.due_date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Statut & Priorité (éditables) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Statut & Priorité
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Statut</label>
                      <Select
                        value={taskDetails.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as TaskStatus;
                          saveTaskField({ status: newStatus });
                        }}
                        options={STATUS_COLUMNS.map(col => ({
                          label: col.label,
                          value: col.status,
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Priorité</label>
                      <Select
                        value={taskDetails.priority}
                        onChange={(e) => {
                          const newPriority = e.target.value as TaskPriority;
                          saveTaskField({ priority: newPriority });
                        }}
                        options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
                          label,
                          value,
                        }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Description */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Description
                  </h3>
                  <RichTextEditor
                    value={taskDetails.description || ''}
                    onChange={(value) => {
                      saveTaskField({ description: value || null });
                    }}
                    placeholder="Ajouter une description..."
                    minHeight="150px"
                    toolbar={true}
                  />
                </div>

                {/* Section: Métadonnées */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Détails
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Heures estimées</label>
                      {taskDetails.estimated_hours !== null && taskDetails.estimated_hours !== undefined ? (
                        <div className="text-sm font-medium text-foreground">{taskDetails.estimated_hours}h</div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">Non définies</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Projet</label>
                      <Select
                        value={taskDetails.project_id?.toString() || ''}
                        onChange={(e) => {
                          const newProjectId = e.target.value ? parseInt(e.target.value) : null;
                          saveTaskField({ project_id: newProjectId });
                        }}
                        options={[
                          { value: '', label: 'Non assigné' },
                          ...projects.map(p => ({ value: p.id.toString(), label: p.name }))
                        ]}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Commentaires */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Commentaires
                    </h3>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <ProjectComments taskId={taskDetails.id} projectId={taskDetails.project_id || undefined} />
                  </div>
                </div>

                {/* Section: Documents */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Documents
                    </h3>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <ProjectAttachments taskId={taskDetails.id} projectId={taskDetails.project_id || undefined} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
