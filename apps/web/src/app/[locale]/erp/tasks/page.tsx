'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import TaskKanban from '@/components/projects/TaskKanban';
import TaskTimeline from '@/components/projects/TaskTimeline';
import TaskTimer from '@/components/projects/TaskTimer';
import GlobalTimer from '@/components/projects/GlobalTimer';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { teamsAPI } from '@/lib/api/teams';
import { extractApiData } from '@/lib/api/utils';
import type { TeamListResponse } from '@/lib/api/teams';
import { CheckCircle2, Clock, AlertCircle, Calendar, User } from 'lucide-react';

type ViewMode = 'kanban' | 'timeline' | 'list';

export default function EmployeeTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [teamId, setTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadTeamId();
      loadMyTasks();
    }
  }, [user?.id]);

  const loadTeamId = async () => {
    try {
      const response = await teamsAPI.getMyTeams();
      const data = extractApiData<TeamListResponse>(response);
      if (data?.teams && data.teams.length > 0) {
        const firstTeam = data.teams[0];
        if (firstTeam) {
          setTeamId(firstTeam.id);
        }
      }
    } catch (err) {
      console.warn('Could not load team ID:', err);
    }
  };

  const loadMyTasks = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const userId = parseInt(user.id);
      const data = await projectTasksAPI.list({ assignee_id: userId });
      setTasks(data || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStats = () => {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      to_transfer: tasks.filter(t => t.status === 'to_transfer').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  };

  const stats = getStatusStats();

  if (loading && tasks.length === 0) {
    return (
      <div className="py-8">
        <Container>
          <Card className="glass-card">
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mes Tâches</h1>
          <p className="text-muted-foreground">
            Gérez vos tâches assignées et suivez votre progression
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Global Timer */}
        <GlobalTimer />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">À faire</p>
                <p className="text-2xl font-bold text-foreground">{stats.todo}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-foreground">{stats.in_progress}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bloqué</p>
                <p className="text-2xl font-bold text-foreground">{stats.blocked}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">À transférer</p>
                <p className="text-2xl font-bold text-foreground">{stats.to_transfer}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terminé</p>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                viewMode === 'kanban'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Kanban
              {viewMode === 'kanban' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                viewMode === 'timeline'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Planification
              {viewMode === 'timeline' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                viewMode === 'list'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Liste
              {viewMode === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'kanban' && user?.id && (
          <Card className="glass-card p-6">
            <TaskKanban assigneeId={parseInt(user.id)} teamId={teamId || undefined} />
          </Card>
        )}

        {viewMode === 'timeline' && user?.id && (
          <Card className="glass-card p-6">
            <TaskTimeline assigneeId={parseInt(user.id)} />
          </Card>
        )}

        {viewMode === 'list' && (
          <Card className="glass-card p-6">
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune tâche assignée</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-2">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <Badge variant="default">{task.status}</Badge>
                          <Badge variant="default">{task.priority}</Badge>
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                      <TaskTimer taskId={task.id} onTimeTracked={loadMyTasks} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </Container>
    </div>
  );
}
