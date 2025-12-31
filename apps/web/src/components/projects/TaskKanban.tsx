'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { projectTasksAPI, type ProjectTask, type TaskStatus, type TaskPriority } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { Plus, Edit, Trash2, Calendar, User, AlertCircle, GripVertical } from 'lucide-react';

interface TaskKanbanProps {
  projectId: number;
  teamId: number;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'À faire', color: 'bg-gray-100' },
  { status: 'in_progress', label: 'En cours', color: 'bg-blue-100' },
  { status: 'blocked', label: 'Bloqué', color: 'bg-red-100' },
  { status: 'to_transfer', label: 'À transférer', color: 'bg-yellow-100' },
  { status: 'completed', label: 'Terminé', color: 'bg-green-100' },
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

export default function TaskKanban({ projectId, teamId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignee_id: null as number | null,
    due_date: '',
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectTasksAPI.list({ project_id: projectId });
      setTasks(data || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee_id: null,
      due_date: '',
    });
    setShowTaskModal(true);
  };

  const handleEditTask = (task: ProjectTask) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id || null,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      setError('Le titre de la tâche est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (selectedTask) {
        // Update existing task
        await projectTasksAPI.update(selectedTask.id, {
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          assignee_id: formData.assignee_id,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        });
      } else {
        // Create new task
        await projectTasksAPI.create({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          team_id: teamId,
          project_id: projectId,
          assignee_id: formData.assignee_id,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          order: tasks.length,
        });
      }

      setShowTaskModal(false);
      await loadTasks();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la sauvegarde de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      setLoading(true);
      await projectTasksAPI.delete(taskId);
      await loadTasks();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression de la tâche');
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
      await projectTasksAPI.update(draggedTask.id, {
        status: newStatus,
      });
      await loadTasks();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du déplacement de la tâche');
    } finally {
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
        {STATUS_COLUMNS.map(({ status, label, color }) => {
          const columnTasks = getTasksByStatus(status);
          return (
            <div
              key={status}
              className="flex flex-col min-w-[250px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={`${color} rounded-t-lg p-3 mb-2`}>
                <h3 className="font-semibold text-foreground">
                  {label} ({columnTasks.length})
                </h3>
              </div>
              <div className="space-y-3 flex-1 min-h-[400px]">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="glass-card p-4 cursor-move hover:shadow-lg transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <Badge
                          className={`${PRIORITY_COLORS[task.priority]} text-white text-xs`}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </Badge>
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
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                Statut
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                {STATUS_COLUMNS.map(({ status, label }) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priorité
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveTask} loading={loading}>
              {selectedTask ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
