/**
 * Scheduled Tasks List Component
 * 
 * Displays and manages scheduled tasks.
 */

'use client';

import { useState } from 'react';
import { Button, Card, Badge, Input, Select, Switch } from '@/components/ui';
import { Plus, Search, Clock, Trash2, Edit2, Loader2 } from 'lucide-react';
import { ScheduledTaskForm } from './ScheduledTaskForm';
import type { ScheduledTask, CreateScheduledTaskRequest, UpdateScheduledTaskRequest } from '@/lib/api/automation';

export interface ScheduledTasksListProps {
  tasks: ScheduledTask[];
  isLoading: boolean;
  error: Error | null;
  onCreate: (task: CreateScheduledTaskRequest) => void;
  onUpdate: (id: number, task: UpdateScheduledTaskRequest) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export function ScheduledTasksList({
  tasks,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
}: ScheduledTasksListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesType = typeFilter === 'all' || task.task_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche planifiée ?')) {
      onDelete(id);
    }
  };

  const handleToggle = (id: number) => {
    onToggle(id);
  };

  const getStatusBadge = (status: ScheduledTask['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      completed: 'success',
      running: 'warning',
      failed: 'error',
      pending: 'default',
      cancelled: 'default',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: ScheduledTask['status']) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      running: 'En cours',
      completed: 'Terminée',
      failed: 'Échouée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: ScheduledTask['task_type']) => {
    const labels: Record<string, string> = {
      email: 'Email',
      report: 'Rapport',
      sync: 'Synchronisation',
      custom: 'Personnalisé',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Erreur lors du chargement des tâches</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'pending', label: 'En attente' },
                { value: 'running', label: 'En cours' },
                { value: 'completed', label: 'Terminée' },
                { value: 'failed', label: 'Échouée' },
                { value: 'cancelled', label: 'Annulée' },
              ]}
              className="w-48"
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'email', label: 'Email' },
                { value: 'report', label: 'Rapport' },
                { value: 'sync', label: 'Synchronisation' },
                { value: 'custom', label: 'Personnalisé' },
              ]}
              className="w-48"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Tasks list */}
        {isLoading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {tasks.length === 0 ? 'Aucune tâche planifiée' : 'Aucune tâche ne correspond à vos filtres'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{task.name}</h3>
                      <Badge variant={getStatusBadge(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                      <Badge variant="default">{getTypeLabel(task.task_type)}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prochaine exécution:</span>
                        <p className="font-medium">{formatDate(task.scheduled_at)}</p>
                      </div>
                      {task.recurrence && (
                        <div>
                          <span className="text-muted-foreground">Récurrence:</span>
                          <p className="font-medium capitalize">{task.recurrence}</p>
                        </div>
                      )}
                      {task.started_at && (
                        <div>
                          <span className="text-muted-foreground">Dernière exécution:</span>
                          <p className="font-medium">{formatDate(task.started_at)}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Créée le:</span>
                        <p className="font-medium">{formatDate(task.created_at)}</p>
                      </div>
                    </div>
                    {task.error_message && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          <strong>Erreur:</strong> {task.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={task.status === 'pending'}
                      onChange={() => handleToggle(task.id)}
                      disabled={task.status === 'running'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <ScheduledTaskForm
          task={editingTask}
          onSave={(taskData) => {
            if (editingTask) {
              onUpdate(editingTask.id, taskData);
            } else {
              onCreate(taskData);
            }
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </>
  );
}
