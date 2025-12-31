'use client';

import { useState, useEffect } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectGanttProps {
  projectId: number;
  startDate?: string | null;
  endDate?: string | null;
}

export default function ProjectGantt({ projectId, startDate, endDate }: ProjectGanttProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectTasksAPI.list({ project_id: projectId });
      setTasks(data.filter(task => task.due_date || task.started_at));
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      case 'to_transfer':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'blocked':
        return 'Bloqué';
      case 'to_transfer':
        return 'À transférer';
      default:
        return 'À faire';
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTaskPosition = (task: ProjectTask) => {
    if (!task.due_date && !task.started_at) return null;
    
    const taskDate = task.due_date ? new Date(task.due_date) : (task.started_at ? new Date(task.started_at) : null);
    if (!taskDate) return null;

    const dayIndex = weekDays.findIndex(day => isSameDay(day, taskDate));
    return dayIndex >= 0 ? dayIndex : null;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const tasksWithDates = tasks.filter(task => task.due_date || task.started_at);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Vue Gantt
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[200px] text-center">
            {format(weekStart, 'd MMM', { locale: fr })} - {format(weekEnd, 'd MMM yyyy', { locale: fr })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>
      </div>

      {tasksWithDates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune tâche avec date</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`text-center p-2 rounded ${
                    isSameDay(day, new Date())
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {tasksWithDates.map((task) => {
                const position = getTaskPosition(task);
                if (position === null) return null;

                return (
                  <div key={task.id} className="relative h-12">
                    <div
                      className={`absolute top-0 left-0 h-full rounded flex items-center px-2 ${getStatusColor(task.status)} text-white text-sm font-medium`}
                      style={{
                        left: `${(position / 7) * 100}%`,
                        width: `${(1 / 7) * 100}%`,
                      }}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>À faire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Terminé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Bloqué</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>À transférer</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
