'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge, Select } from '@/components/ui';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { 
  Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, Clock, User, AlertCircle, CheckCircle2
} from 'lucide-react';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';

interface ProjectGanttChartProps {
  projectId: number;
  projectName?: string;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null;
}

type ViewMode = 'day' | 'week' | 'month' | 'quarter';

interface GanttTask {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date | null;
  dueDate: Date | null;
  status: string;
  priority: string;
  assignee?: string;
  progress?: number;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  blocked: 'bg-red-500',
  to_transfer: 'bg-yellow-500',
  todo: 'bg-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-red-500 border-l-4',
  high: 'border-orange-500 border-l-4',
  medium: 'border-blue-500 border-l-4',
  low: 'border-gray-400 border-l-4',
};

export default function ProjectGanttChart({ 
  projectId, 
  projectName = 'Projet',
  startDate,
  endDate,
  deadline 
}: ProjectGanttChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      setError(handleApiError(err).message || 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(quarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Generate all dates in range
  const dates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [dateRange]);

  // Build Gantt tasks
  const ganttTasks = useMemo((): GanttTask[] => {
    const items: GanttTask[] = [];
    
    tasks.forEach(task => {
      let taskStart: Date | null = null;
      let taskEnd: Date | null = null;

      // Determine start date (started_at or due_date or created_at)
      if (task.started_at) {
        taskStart = new Date(task.started_at);
      } else if (task.due_date) {
        // If no start date, use due_date minus estimated duration
        taskStart = new Date(task.due_date);
        if (task.estimated_hours) {
          taskStart.setHours(taskStart.getHours() - task.estimated_hours);
        } else {
          taskStart.setDate(taskStart.getDate() - 1); // Default 1 day duration
        }
      } else if (task.created_at) {
        taskStart = new Date(task.created_at);
      }

      // Determine end date (due_date or completed_at or estimated)
      if (task.completed_at) {
        taskEnd = new Date(task.completed_at);
      } else if (task.due_date) {
        taskEnd = new Date(task.due_date);
      } else if (taskStart && task.estimated_hours) {
        taskEnd = new Date(taskStart);
        taskEnd.setHours(taskEnd.getHours() + task.estimated_hours);
      } else if (taskStart) {
        taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + 1);
      }

      if (taskStart) {
        items.push({
          id: task.id,
          title: task.title,
          startDate: taskStart,
          endDate: taskEnd,
          dueDate: task.due_date ? new Date(task.due_date) : null,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee_name || undefined,
          progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
          color: STATUS_COLORS[task.status] || STATUS_COLORS.todo,
        });
      }
    });

    // Add project timeline if dates available
    if (startDate) {
      const projStart = new Date(startDate);
      const projEnd = endDate ? new Date(endDate) : null;
      items.unshift({
        id: -1,
        title: projectName,
        startDate: projStart,
        endDate: projEnd,
        dueDate: deadline ? new Date(deadline) : null,
        status: 'project',
        priority: 'medium',
        color: 'bg-primary/20 border-primary border-2',
      });
    }

    // Add deadline marker
    if (deadline) {
      items.push({
        id: -2,
        title: 'Échéance',
        startDate: new Date(deadline),
        endDate: new Date(deadline),
        dueDate: new Date(deadline),
        status: 'deadline',
        priority: 'urgent',
        color: 'bg-red-500',
      });
    }

    return items;
  }, [tasks, startDate, endDate, deadline, projectName]);

  // Calculate task position and width
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    taskStart.setHours(0, 0, 0, 0);
    const taskEnd = task.endDate ? new Date(task.endDate) : new Date(task.startDate);
    taskEnd.setHours(23, 59, 59, 999);

    // Check if task overlaps with visible range
    if (taskEnd < dateRange.start || taskStart > dateRange.end) {
      return null;
    }

    // Calculate visible portion
    const visibleStart = taskStart > dateRange.start ? taskStart : dateRange.start;
    const visibleEnd = taskEnd < dateRange.end ? taskEnd : dateRange.end;

    // Find positions
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const startOffset = Math.ceil((visibleStart.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const endOffset = Math.ceil((visibleEnd.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = ((endOffset - startOffset + 1) / totalDays) * 100;

    return { left: Math.max(0, left), width: Math.min(100, width) };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'quarter':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
          break;
      }
      return newDate;
    });
  };

  const formatDateHeader = (date: Date, mode: ViewMode): string => {
    switch (mode) {
      case 'day':
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      case 'week':
        const weekStart = new Date(date);
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `T${quarter} ${date.getFullYear()}`;
    }
  };

  const getDateLabel = (date: Date, mode: ViewMode): string => {
    switch (mode) {
      case 'day':
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      case 'week':
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString('fr-FR', { day: 'numeric' });
      case 'quarter':
        return date.toLocaleDateString('fr-FR', { month: 'short' });
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12">
        <div className="flex items-center justify-center">
          <Loading />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error">{error}</Alert>
    );
  }

  const visibleTasks = ganttTasks.filter(task => getTaskPosition(task) !== null);

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
      {/* Header Controls */}
      <Card className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Diagramme de Gantt</h3>
              <p className="text-sm text-muted-foreground">
                {visibleTasks.length} tâche{visibleTasks.length > 1 ? 's' : ''} visible{visibleTasks.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              options={[
                { label: 'Jour', value: 'day' },
                { label: 'Semaine', value: 'week' },
                { label: 'Mois', value: 'month' },
                { label: 'Trimestre', value: 'quarter' },
              ]}
              className="w-32"
            />

            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-foreground min-w-[200px] text-center px-3">
                {formatDateHeader(currentDate, viewMode)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Réduire
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Plein écran
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Gantt Chart */}
      {visibleTasks.length === 0 ? (
        <Card className="glass-card p-12 text-center rounded-xl">
          <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Aucune tâche avec dates
          </h3>
          <p className="text-muted-foreground">
            Ajoutez des dates de début/fin ou des dates d'échéance aux tâches pour voir le diagramme de Gantt
          </p>
        </Card>
      ) : (
        <Card className="glass-card p-6 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Date Header */}
              <div className="mb-4">
                <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${dates.length}, minmax(60px, 1fr))` }}>
                  <div className="font-semibold text-foreground p-2 border-b border-border">
                    Tâches
                  </div>
                  {dates.map((date, idx) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                      <div
                        key={idx}
                        className={`text-center p-2 border-b border-border ${
                          isToday 
                            ? 'bg-primary/10 border-primary/30 font-bold' 
                            : isWeekend 
                            ? 'bg-muted/30' 
                            : ''
                        }`}
                      >
                        <div className="text-xs text-muted-foreground">
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                          {getDateLabel(date, viewMode)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tasks Rows */}
              <div className="space-y-3">
                {visibleTasks.map((task) => {
                  const position = getTaskPosition(task);
                  if (!position) return null;

                  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'completed';
                  const priorityClass = PRIORITY_COLORS[task.priority] || '';
                  const isProject = task.id === -1;
                  const isDeadline = task.id === -2;

                  return (
                    <div
                      key={task.id}
                      className="relative h-20 border-b border-border/30 hover:bg-accent/30 transition-colors"
                    >
                      {/* Task Info Column */}
                      <div className="absolute left-0 top-0 w-[200px] h-full flex items-center gap-3 p-3 bg-background/80 backdrop-blur-sm border-r border-border z-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${task.color} ${isProject ? 'ring-2 ring-primary' : ''}`} />
                            <span className="text-sm font-semibold text-foreground truncate">
                              {task.title}
                            </span>
                            {isOverdue && !isDeadline && (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            )}
                            {task.status === 'completed' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            )}
                            {isDeadline && (
                              <span className="text-xs">⚠️</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {task.assignee && !isProject && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee}
                              </span>
                            )}
                            {task.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {task.dueDate && task.dueDate.getTime() !== task.startDate.getTime() && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Gantt Bar */}
                      <div
                        className="absolute left-[200px] top-0 right-0 h-full"
                        style={{ width: `calc(100% - 200px)` }}
                      >
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg flex items-center justify-between px-4 text-white text-xs font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group ${task.color} ${priorityClass} ${
                            isOverdue && !isDeadline ? 'ring-2 ring-red-500 animate-pulse' : ''
                          } ${isProject ? 'border-2 border-primary/50' : ''} ${isDeadline ? 'h-3 rounded-full' : ''}`}
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            minWidth: isDeadline ? '4px' : '80px',
                          }}
                          title={`${task.title}${task.startDate ? `\nDébut: ${task.startDate.toLocaleDateString('fr-FR')}` : ''}${task.endDate && task.endDate.getTime() !== task.startDate.getTime() ? `\nFin: ${task.endDate.toLocaleDateString('fr-FR')}` : ''}${task.dueDate ? `\nÉchéance: ${task.dueDate.toLocaleDateString('fr-FR')}` : ''}`}
                        >
                          {!isDeadline && (
                            <>
                              <span className="truncate flex-1 font-bold">
                                {task.title}
                              </span>
                              {task.progress !== undefined && task.progress > 0 && (
                                <div className="ml-2 flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded">
                                  <span className="text-xs font-bold">{task.progress}%</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Progress Bar Overlay */}
                        {!isDeadline && task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-2 bg-white/40 rounded-full"
                            style={{
                              left: `${position.left}%`,
                              width: `${(position.width * task.progress) / 100}%`,
                            }}
                          />
                        )}

                        {/* Milestone marker for deadline */}
                        {isDeadline && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full border-4 border-background shadow-lg"
                            style={{
                              left: `${position.left}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Today Indicator Line */}
              {dates.some(d => d.toDateString() === new Date().toDateString()) && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary z-20 pointer-events-none shadow-lg"
                  style={{
                    left: `calc(200px + ${(() => {
                      const todayIdx = dates.findIndex(d => d.toDateString() === new Date().toDateString());
                      return todayIdx >= 0 ? (todayIdx / dates.length) * 100 : 0;
                    })()}% * (100% - 200px) / 100)`,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">
                    Aujourd'hui
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-semibold text-foreground mb-3">Légende :</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary/20 border-2 border-primary rounded"></div>
                <span>Projet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Échéance</span>
              </div>
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
        </Card>
      )}
    </div>
  );
}
