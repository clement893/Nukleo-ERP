'use client';

import { useState, useEffect } from 'react';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { TrendingUp, Clock, DollarSign, Target, AlertCircle } from 'lucide-react';
import { formatHours } from '@/lib/utils/format';

interface ProjectStatisticsProps {
  projectId: number;
  budget?: number | null;
}

export default function ProjectStatistics({ projectId, budget }: ProjectStatisticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  useEffect(() => {
    loadStatistics();
  }, [projectId]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entries, projectTasks] = await Promise.all([
        timeEntriesAPI.list({ project_id: projectId }),
        projectTasksAPI.list({ project_id: projectId }),
      ]);
      setTimeEntries(entries);
      setTasks(projectTasks);
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalHoursSpent = timeEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0);
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const hoursProgress = totalEstimatedHours > 0 ? (totalHoursSpent / totalEstimatedHours) * 100 : 0;
  
  // Budget calculations (if budget is in hours)
  const budgetHours = budget || null;
  const budgetUtilization = budgetHours ? (totalHoursSpent / budgetHours) * 100 : null;
  const remainingHours = budgetHours ? Math.max(0, budgetHours - totalHoursSpent) : null;
  const overBudget = budgetHours ? totalHoursSpent > budgetHours : false;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Hours Spent */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Heures dépensées</h3>
          <Clock className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{formatHours(totalHoursSpent)}</p>
        {totalEstimatedHours > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            sur {formatHours(totalEstimatedHours)} prévues ({hoursProgress.toFixed(0)}%)
          </p>
        )}
      </Card>

      {/* Estimated Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Heures prévues</h3>
          <Target className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{formatHours(totalEstimatedHours)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
        </p>
      </Card>

      {/* Completion Rate */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Taux de complétion</h3>
          <TrendingUp className="w-5 h-5 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{completionRate.toFixed(0)}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {completedTasks} / {totalTasks} tâches terminées
        </p>
        <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </Card>

      {/* Budget Utilization */}
      {budgetHours !== null ? (
        <Card className={`p-6 ${overBudget ? 'border-red-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Budget heures</h3>
            {overBudget ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <DollarSign className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">{formatHours(totalHoursSpent)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            sur {formatHours(budgetHours)} ({budgetUtilization?.toFixed(0)}%)
          </p>
          {remainingHours !== null && (
            <p className={`text-xs mt-1 ${overBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
              {overBudget ? (
                <Badge variant="error">Dépassement de {formatHours(totalHoursSpent - budgetHours)}</Badge>
              ) : (
                `Restant: ${formatHours(remainingHours)}`
              )}
            </p>
          )}
          <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-orange-500'}`}
              style={{ width: `${Math.min(100, budgetUtilization || 0)}%` }}
            ></div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Budget heures</h3>
            <DollarSign className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Non défini</p>
        </Card>
      )}
    </div>
  );
}
