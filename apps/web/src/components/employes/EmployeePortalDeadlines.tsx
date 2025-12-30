'use client';

import { useEffect, useState } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Card, Loading, Alert } from '@/components/ui';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

interface EmployeePortalDeadlinesProps {
  employeeId: number;
}

export default function EmployeePortalDeadlines({ employeeId }: EmployeePortalDeadlinesProps) {
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
      const data = await projectTasksAPI.list({ assignee_id: employeeId });
      // Filtrer uniquement les tâches avec une date d'échéance
      const tasksWithDeadlines = data.filter(task => task.due_date);
      // Trier par date d'échéance (les plus proches en premier)
      tasksWithDeadlines.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      setTasks(tasksWithDeadlines);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des deadlines');
      showToast({
        message: appError.message || 'Erreur lors du chargement des deadlines',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (dueDate: string | null | undefined) => {
    if (!dueDate) return { status: 'none', label: '', color: '' };
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'overdue', 
        label: `En retard (${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''})`,
        color: 'text-red-600 bg-red-100 dark:bg-red-900/30'
      };
    } else if (diffDays === 0) {
      return { 
        status: 'today', 
        label: 'Aujourd\'hui',
        color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
      };
    } else if (diffDays <= 3) {
      return { 
        status: 'soon', 
        label: `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`,
        color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      };
    } else {
      return { 
        status: 'upcoming', 
        label: `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`,
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
      };
    }
  };

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

  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  });

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const date = new Date(task.due_date);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  const upcomingTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const date = new Date(task.due_date);
    const now = new Date();
    return date > now;
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mes deadlines ({tasks.length})
        </h3>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune deadline à venir</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                En retard ({overdueTasks.length})
              </h4>
              <div className="space-y-2">
                {overdueTasks.map((task) => {
                  const deadlineStatus = getDeadlineStatus(task.due_date);
                  return (
                    <Card key={task.id} className="p-4 border-l-4 border-red-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{task.title}</h5>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <div className={`px-2 py-1 text-xs rounded-full ${deadlineStatus.color}`}>
                            {deadlineStatus.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.due_date && new Date(task.due_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {todayTasks.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 text-orange-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aujourd'hui ({todayTasks.length})
              </h4>
              <div className="space-y-2">
                {todayTasks.map((task) => {
                  const deadlineStatus = getDeadlineStatus(task.due_date);
                  return (
                    <Card key={task.id} className="p-4 border-l-4 border-orange-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{task.title}</h5>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <div className={`px-2 py-1 text-xs rounded-full ${deadlineStatus.color}`}>
                            {deadlineStatus.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.due_date && new Date(task.due_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                À venir ({upcomingTasks.length})
              </h4>
              <div className="space-y-2">
                {upcomingTasks.map((task) => {
                  const deadlineStatus = getDeadlineStatus(task.due_date);
                  return (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{task.title}</h5>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <div className={`px-2 py-1 text-xs rounded-full ${deadlineStatus.color}`}>
                            {deadlineStatus.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.due_date && new Date(task.due_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
