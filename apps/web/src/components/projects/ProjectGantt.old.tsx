'use client';

import { useState, useEffect } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
// Date utilities
const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const endOfWeek = (date: Date): Date => {
  const start = startOfWeek(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
};

const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

const subWeeks = (date: Date, weeks: number): Date => {
  return addWeeks(date, -weeks);
};

const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const formatDate = (date: Date, formatStr: string): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthNames = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  const dayNames = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  
  if (formatStr === 'd MMM') {
    return `${day} ${monthNames[month - 1]}`;
  }
  if (formatStr === 'd MMM yyyy') {
    return `${day} ${monthNames[month - 1]} ${year}`;
  }
  if (formatStr === 'EEE') {
    const dayIndex = date.getDay();
    return dayNames[dayIndex] ?? dayNames[0] ?? 'dim';
  }
  return date.toLocaleDateString('fr-FR');
};

interface ProjectGanttProps {
  projectId: number;
  projectName?: string;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null;
}

interface GanttItem {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  type: 'project' | 'deadline' | 'task';
  status?: string;
  color: string;
}

export default function ProjectGantt({ 
  projectId, 
  projectName = 'Projet',
  startDate,
  endDate,
  deadline 
}: ProjectGanttProps) {
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

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Build Gantt items
  const buildGanttItems = (): GanttItem[] => {
    const items: GanttItem[] = [];
    
    // Project timeline
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      items.push({
        id: 'project',
        name: projectName,
        startDate: start,
        endDate: end,
        type: 'project',
        color: 'bg-primary',
      });
    }
    
    // Deadline
    if (deadline) {
      const deadlineDate = new Date(deadline);
      items.push({
        id: 'deadline',
        name: 'Échéance',
        startDate: deadlineDate,
        endDate: deadlineDate,
        type: 'deadline',
        color: 'bg-red-500',
      });
    }
    
    // Tasks
    tasks.forEach(task => {
      if (task.due_date || task.started_at) {
        const taskStart = task.started_at ? new Date(task.started_at) : (task.due_date ? new Date(task.due_date) : null);
        const taskEnd = task.due_date ? new Date(task.due_date) : null;
        
        if (taskStart) {
          items.push({
            id: `task-${task.id}`,
            name: task.title,
            startDate: taskStart,
            endDate: taskEnd,
            type: 'task',
            status: task.status,
            color: getStatusColor(task.status),
          });
        }
      }
    });
    
    return items;
  };

  const getItemPosition = (item: GanttItem) => {
    const itemStart = new Date(item.startDate);
    itemStart.setHours(0, 0, 0, 0);
    const itemEnd = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
    itemEnd.setHours(23, 59, 59, 999);
    
    // Check if item overlaps with current week
    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);
    const weekEndDate = new Date(weekEnd);
    weekEndDate.setHours(23, 59, 59, 999);
    
    // Item is completely outside the week
    if (itemEnd < weekStartDate || itemStart > weekEndDate) {
      return null;
    }
    
    // Find visible start and end within the week
    const visibleStart = itemStart > weekStartDate ? itemStart : weekStartDate;
    const visibleEnd = itemEnd < weekEndDate ? itemEnd : weekEndDate;
    
    // Find day indices
    const startIndex = weekDays.findIndex(day => {
      const dayDate = new Date(day);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= visibleStart;
    });
    
    const endIndex = weekDays.findIndex(day => {
      const dayDate = new Date(day);
      dayDate.setHours(23, 59, 59, 999);
      return dayDate >= visibleEnd;
    });
    
    // If item starts before week, startIndex will be 0
    const actualStartIndex = startIndex >= 0 ? startIndex : 0;
    // If item ends after week, endIndex will be last day
    const actualEndIndex = endIndex >= 0 ? endIndex : (weekDays.length - 1);
    
    // Calculate position
    const left = (actualStartIndex / weekDays.length) * 100;
    const width = ((actualEndIndex - actualStartIndex + 1) / weekDays.length) * 100;
    
    return { left, width };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  // Auto-adjust current week to show project dates if available
  useEffect(() => {
    if (startDate && !loading && !tasks.length) {
      const projectStart = new Date(startDate);
      setCurrentWeek(projectStart);
    }
  }, [startDate, loading, tasks.length]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const ganttItems = buildGanttItems();
  const hasAnyDates = startDate || endDate || deadline || tasks.some(t => t.due_date || t.started_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Vue temporelle (Gantt)
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
            {formatDate(weekStart, 'd MMM')} - {formatDate(weekEnd, 'd MMM yyyy')}
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

      {!hasAnyDates ? (
        <Card className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune date renseignée pour ce projet</p>
            <p className="text-sm mt-2">Ajoutez des dates de début/fin ou des dates aux tâches pour voir la vue Gantt</p>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day: Date, index: number) => (
                  <div
                    key={index}
                    className={`text-center p-2 rounded ${
                      isSameDay(day, new Date())
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="text-xs text-muted-foreground">
                      {formatDate(day, 'EEE')}
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Gantt Items */}
              <div className="space-y-3">
                {ganttItems.map((item) => {
                  const position = getItemPosition(item);
                  if (!position) return null;

                  return (
                    <div key={item.id} className="relative h-10">
                      <div
                        className={`absolute top-0 left-0 h-full rounded flex items-center px-3 ${item.color} text-white text-sm font-medium shadow-sm`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          minWidth: '60px',
                        }}
                        title={`${item.name}${item.startDate ? ` - ${formatDate(item.startDate, 'd MMM yyyy')}` : ''}${item.endDate && !isSameDay(item.startDate, item.endDate) ? ` au ${formatDate(item.endDate, 'd MMM yyyy')}` : ''}`}
                      >
                        <span className="truncate font-medium">{item.name}</span>
                        {item.type === 'deadline' && (
                          <span className="ml-2 text-xs">⚠️</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-3">Légende :</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {startDate && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-primary rounded"></div>
                      <span>Projet</span>
                    </div>
                  )}
                  {deadline && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Échéance</span>
                    </div>
                  )}
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
          </div>
        </Card>
      )}
    </div>
  );
}
