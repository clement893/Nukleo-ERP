'use client';

import { useEffect, useState } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Card, Loading, Alert } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { CheckSquare, Clock, AlertCircle, ShoppingCart, CheckCircle } from 'lucide-react';

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

export default function EmployeePortalTasks({ employeeId }: EmployeePortalTasksProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <DataTable
            data={tasks as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            emptyMessage="Aucune tâche trouvée"
          />
        </Card>
      )}
    </div>
  );
}
