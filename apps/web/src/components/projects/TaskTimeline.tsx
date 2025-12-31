'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { projectTasksAPI, type ProjectTask, type TaskPriority } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { Calendar, User, AlertCircle } from 'lucide-react';

interface TaskTimelineProps {
  projectId: number;
}

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

const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  blocked: 'Bloqué',
  to_transfer: 'À transférer',
  completed: 'Terminé',
};

export default function TaskTimeline({ projectId }: TaskTimelineProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
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
  };

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, ProjectTask[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach((task) => {
      if (!task.due_date) {
        if (!grouped['no-date']) {
          grouped['no-date'] = [];
        }
        grouped['no-date'].push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      if (isNaN(dueDate.getTime())) {
        // Invalid date, skip this task
        return;
      }
      dueDate.setHours(0, 0, 0, 0);
      const dateKey = dueDate.toISOString().split('T')[0];
      if (!dateKey) {
        return;
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === 'no-date') return 1;
      if (b === 'no-date') return -1;
      return a.localeCompare(b);
    });

    return sortedDates.map((date) => ({
      date,
      tasks: grouped[date] || [],
    }));
  }, [tasks]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Demain';
    } else if (diffDays === -1) {
      return 'Hier';
    } else if (diffDays > 0 && diffDays <= 7) {
      return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 0 && diffDays >= -7) {
      return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Planification des tâches</h2>

      {tasksByDate.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground">Aucune tâche avec date d'échéance</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {tasksByDate.map(({ date, tasks: dateTasks }) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  {date === 'no-date' ? 'Sans date' : formatDate(date)}
                </h3>
                <Badge variant="default">{dateTasks.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateTasks.map((task) => {
                  const overdue = isOverdue(task.due_date);
                  return (
                    <Card
                      key={task.id}
                      className={`glass-card p-4 ${
                        overdue ? 'border-red-500 border-2' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${PRIORITY_COLORS[task.priority]} text-white text-xs`}
                          >
                            {PRIORITY_LABELS[task.priority]}
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            {STATUS_LABELS[task.status]}
                          </Badge>
                        </div>
                        {overdue && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
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
                            {new Date(task.due_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
