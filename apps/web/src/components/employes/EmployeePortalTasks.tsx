'use client';

import { useEffect, useState } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Card, Loading, Alert, Modal } from '@/components/ui';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Tabs, { type Tab } from '@/components/ui/Tabs';
import { CheckSquare, Clock, AlertCircle, ShoppingCart, CheckCircle, Info, MessageSquare, Paperclip } from 'lucide-react';

interface EmployeePortalTasksProps {
  employeeId: number;
}

const statusIcons = {
  todo: CheckSquare,
  in_progress: Clock,
  blocked: AlertCircle,
  to_transfer: ShoppingCart,
  completed: CheckCircle,
};

const statusLabels = {
  todo: 'À faire',
  in_progress: 'En cours',
  blocked: 'Bloqué',
  to_transfer: 'À transférer',
  completed: 'Terminé',
};

const priorityLabels = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

/**
 * Component to render task details content with tabs
 */
function TaskDetailsContent({ taskDetails }: { taskDetails: ProjectTask }) {
  const tabs: Tab[] = [
    {
      id: 'info',
      label: 'Informations',
      icon: <Info className="w-4 h-4" />,
      content: <TaskInfoTab taskDetails={taskDetails} />,
    },
    {
      id: 'comments',
      label: 'Commentaires',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: 0, // Will be updated when comments are loaded
      content: <TaskCommentsTab taskId={taskDetails.id} />,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <Paperclip className="w-4 h-4" />,
      badge: 0, // Will be updated when attachments are loaded
      content: <TaskDocumentsTab taskId={taskDetails.id} />,
    },
  ];

  return <Tabs tabs={tabs} defaultTab="info" />;
}

/**
 * Tab content for task information
 */
function TaskInfoTab({ taskDetails }: { taskDetails: ProjectTask }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {taskDetails.description && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Description
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {taskDetails.description}
          </p>
        </div>
      )}

      {/* Informations principales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Statut
          </h4>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = statusIcons[taskDetails.status];
              return <Icon className="w-4 h-4" />;
            })()}
            <span>{statusLabels[taskDetails.status]}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Priorité
          </h4>
          {(() => {
            const priorityColors = {
              low: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
              medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
              high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
              urgent: 'text-red-600 bg-red-100 dark:bg-red-900/30',
            };
            return (
              <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[taskDetails.priority]}`}>
                {priorityLabels[taskDetails.priority]}
              </span>
            );
          })()}
        </div>

        {taskDetails.due_date && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Échéance
            </h4>
            {(() => {
              const date = new Date(taskDetails.due_date);
              const now = new Date();
              const isOverdue = date < now && taskDetails.status !== 'completed';
              return (
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              );
            })()}
          </div>
        )}

        {taskDetails.estimated_hours && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Heures estimées
            </h4>
            <span>{taskDetails.estimated_hours}h</span>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        {taskDetails.created_at && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Créée le
            </h4>
            <span className="text-sm">
              {new Date(taskDetails.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {taskDetails.updated_at && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Modifiée le
            </h4>
            <span className="text-sm">
              {new Date(taskDetails.updated_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {taskDetails.started_at && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Commencée le
            </h4>
            <span className="text-sm">
              {new Date(taskDetails.started_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {taskDetails.completed_at && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Terminée le
            </h4>
            <span className="text-sm text-green-600 dark:text-green-400">
              {new Date(taskDetails.completed_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Assigné à */}
      {taskDetails.assignee_name && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Assigné à
          </h4>
          <div>
            <span className="text-sm">{taskDetails.assignee_name}</span>
            {taskDetails.assignee_email && (
              <span className="text-sm text-muted-foreground ml-2">
                ({taskDetails.assignee_email})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tab content for task comments (placeholder for Batch 2)
 */
function TaskCommentsTab({ taskId }: { taskId: number }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Les commentaires seront disponibles dans le prochain batch.</p>
      <p className="text-xs mt-2">Task ID: {taskId}</p>
    </div>
  );
}

/**
 * Tab content for task documents (placeholder for Batch 4)
 */
function TaskDocumentsTab({ taskId }: { taskId: number }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Les documents seront disponibles dans un prochain batch.</p>
      <p className="text-xs mt-2">Task ID: {taskId}</p>
    </div>
  );
}

export default function EmployeePortalTasks({ employeeId }: EmployeePortalTasksProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [taskDetails, setTaskDetails] = useState<ProjectTask | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [employeeId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectTasksAPI.list({ employee_assignee_id: employeeId });
      setTasks(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des tâches');
      showToast({
        message: appError.message || 'Erreur lors du chargement des tâches',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: ProjectTask) => {
    setSelectedTask(task);
    try {
      setLoadingDetails(true);
      const details = await projectTasksAPI.get(task.id);
      setTaskDetails(details);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement des détails de la tâche',
        type: 'error',
      });
      // Use the task from the list if API call fails
      setTaskDetails(task);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setTaskDetails(null);
  };

  const columns: Column<ProjectTask>[] = [
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (value, task) => (
        <div>
          <div className="font-medium">{String(value)}</div>
          {task.description && (
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => {
        const status = value as ProjectTask['status'];
        const Icon = statusIcons[status];
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span>{statusLabels[status]}</span>
          </div>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priorité',
      sortable: true,
      render: (value) => {
        const priority = value as ProjectTask['priority'];
        const priorityColors = {
          low: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
          medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
          high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
          urgent: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[priority]}`}>
            {priorityLabels[priority]}
          </span>
        );
      },
    },
    {
      key: 'due_date',
      label: 'Échéance',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        const date = new Date(String(value));
        const now = new Date();
        const isOverdue = date < now;
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {date.toLocaleDateString('fr-FR')}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">{error}</Alert>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mes tâches ({tasks.length})
        </h3>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune tâche assignée</p>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable<Record<string, unknown>>
            data={tasks as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            emptyMessage="Aucune tâche trouvée"
            onRowClick={(row) => {
              handleTaskClick(row as unknown as ProjectTask);
            }}
          />
        </Card>
      )}

      {/* Modal de détails de la tâche */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={handleCloseModal}
          title={taskDetails?.title || selectedTask.title}
          size="lg"
          footer={
            <Button variant="outline" onClick={handleCloseModal}>
              Fermer
            </Button>
          }
        >
          {loadingDetails ? (
            <div className="py-8 text-center">
              <Loading />
            </div>
          ) : (
            taskDetails && (
              <TaskDetailsContent taskDetails={taskDetails} />
            )
          )}
        </Modal>
      )}
    </div>
  );
}
