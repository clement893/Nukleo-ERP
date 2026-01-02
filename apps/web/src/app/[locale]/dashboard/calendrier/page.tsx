'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  AlertCircle,
  Briefcase,
  Plane,
  Loader2
} from 'lucide-react';
import { projectsAPI } from '@/lib/api/projects';
import { vacationRequestsAPI, type VacationRequest } from '@/lib/api/vacationRequests';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { useToast } from '@/lib/toast';

type EventType = 'project' | 'deadline' | 'vacation' | 'timesheet' | 'all';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: EventType;
  description?: string;
  location?: string;
  attendees?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
}

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<EventType>('all');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les données en parallèle
      const [projects, vacations, timeEntries, employees] = await Promise.all([
        projectsAPI.list(0, 100),
        vacationRequestsAPI.list({ limit: 100 }),
        timeEntriesAPI.list({ limit: 500 }),
        employeesAPI.list(0, 100)
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Créer un map des employés pour référence rapide
      const employeeMap = new Map(employees.map((emp: Employee) => [emp.id, `${emp.first_name} ${emp.last_name}`]));

      // Ajouter les projets (début et fin)
      projects.forEach((project) => {
        if (project.start_date) {
          const startDateStr = project.start_date.split('T')[0] || project.start_date.substring(0, 10);
          calendarEvents.push({
            id: `project-start-${project.id}`,
            title: `🚀 Début: ${project.name}`,
            date: startDateStr,
            type: 'project',
            description: project.description || undefined,
            priority: 'high',
            color: '#523DC9'
          });
        }

        if (project.end_date) {
          const endDateStr = project.end_date.split('T')[0] || project.end_date.substring(0, 10);
          calendarEvents.push({
            id: `project-end-${project.id}`,
            title: `🏁 Fin: ${project.name}`,
            date: endDateStr,
            type: 'deadline',
            description: project.description || undefined,
            priority: 'urgent',
            color: '#6B1817'
          });
        }
      });

      // Ajouter les vacances
      vacations.forEach((vacation: VacationRequest) => {
        const employeeName = employeeMap.get(vacation.employee_id) || 'Employé';
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        
        // Ajouter un événement pour chaque jour de vacances
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0] || d.toISOString().substring(0, 10);
          calendarEvents.push({
            id: `vacation-${vacation.id}-${d.toISOString()}`,
            title: `🏖️ ${employeeName} en vacances`,
            date: dateStr,
            type: 'vacation',
            description: vacation.reason || 'Vacances',
            priority: 'low',
            color: '#0EA5E9'
          });
        }
      });

      // Grouper les time entries par date
      const timeEntriesByDate = new Map<string, TimeEntry[]>();
      timeEntries.forEach((entry: TimeEntry) => {
        const date = entry.date.split('T')[0] || entry.date.substring(0, 10);
        if (!timeEntriesByDate.has(date)) {
          timeEntriesByDate.set(date, []);
        }
        timeEntriesByDate.get(date)!.push(entry);
      });

      // Ajouter les feuilles de temps (agrégées par jour)
      timeEntriesByDate.forEach((entries, date) => {
        // Convertir duration (secondes) en heures
        const totalHours = entries.reduce((sum, e) => sum + (e.duration / 3600), 0);
        const uniqueEmployees = new Set(entries.map(e => e.user_id));
        
        calendarEvents.push({
          id: `timesheet-${date}`,
          title: `⏰ ${totalHours.toFixed(1)}h travaillées`,
          date,
          type: 'timesheet',
          description: `${uniqueEmployees.size} employé(s)`,
          priority: 'medium',
          color: '#8B5CF6'
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les données du calendrier',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get event colors based on type
  const getEventColors = (type: EventType) => {
    const colors = {
      project: {
        bg: 'bg-[#523DC9]/10',
        text: 'text-[#523DC9]',
        border: 'border-[#523DC9]/30',
        icon: Briefcase
      },
      deadline: {
        bg: 'bg-[#6B1817]/10',
        text: 'text-[#6B1817]',
        border: 'border-[#6B1817]/30',
        icon: AlertCircle
      },
      vacation: {
        bg: 'bg-primary-500/10',
        text: 'text-primary-600 dark:text-primary-400',
        border: 'border-primary-500/30',
        icon: Plane
      },
      timesheet: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
        icon: Clock
      },
      all: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-500/30',
        icon: CalendarIcon
      }
    };
    return colors[type];
  };


  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [filterType, events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(e => e.date === dateStr);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  // Calculate stats
  const stats = {
    total: events.length,
    projects: events.filter(e => e.type === 'project').length,
    deadlines: events.filter(e => e.type === 'deadline').length,
    vacations: events.filter(e => e.type === 'vacation').length,
    timesheets: events.filter(e => e.type === 'timesheet').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header with Aurora Borealis Gradient */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        {/* Aurora Borealis Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        
        {/* Grain Texture Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Calendrier
              </h1>
              <p className="text-white/80 text-lg">
                Gérez vos projets, vacances et feuilles de temps
              </p>
            </div>
            <button
              onClick={() => {}}
              className="px-6 py-3 rounded-xl flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Nouvel événement
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total Événements</p>
                  <p className="text-white text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Projets</p>
                  <p className="text-white text-2xl font-bold">{stats.projects + stats.deadlines}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Vacances</p>
                  <p className="text-white text-2xl font-bold">{stats.vacations}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Feuilles Temps</p>
                  <p className="text-white text-2xl font-bold">{stats.timesheets}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls and Filters */}
      <div className="glass-card p-4 rounded-xl mb-6 border border-[#A7A2CF]/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-lg bg-[#523DC9] text-white hover:bg-[#523DC9]/90 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EventType)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Tous les événements</option>
              <option value="project">Projets</option>
              <option value="deadline">Deadlines</option>
              <option value="vacation">Vacances</option>
              <option value="timesheet">Feuilles de temps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dayEvents = date ? getEventsForDate(date) : [];
            const isCurrentDay = isToday(date);
            const isCurrentMonth = isSameMonth(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                  !date
                    ? 'bg-gray-50 dark:bg-gray-900/50 border-transparent'
                    : isCurrentDay
                    ? 'bg-[#523DC9]/10 border-[#523DC9] ring-2 ring-[#523DC9]/30'
                    : isCurrentMonth
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/50 hover:shadow-md'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-50'
                }`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold mb-2 ${
                      isCurrentDay ? 'text-[#523DC9]' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const colors = getEventColors(event.type);
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded ${colors.bg} ${colors.text} border ${colors.border} truncate`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
        <h3 className="text-sm font-semibold mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { type: 'project' as EventType, label: 'Projets' },
            { type: 'deadline' as EventType, label: 'Deadlines' },
            { type: 'vacation' as EventType, label: 'Vacances' },
            { type: 'timesheet' as EventType, label: 'Feuilles de temps' }
          ].map(({ type, label }) => {
            const colors = getEventColors(type);
            const Icon = colors.icon;
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${colors.bg} border ${colors.border}`}>
                  <Icon className={`w-3 h-3 ${colors.text}`} />
                </div>
                <span className="text-sm">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
