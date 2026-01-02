'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  Briefcase,
  Plane,
  Loader2,
  Star,
  Cake,
  Users,
  Sun,
  CheckCircle2
} from 'lucide-react';
import { projectsAPI } from '@/lib/api/projects';
import { vacationRequestsAPI, type VacationRequest } from '@/lib/api/vacationRequests';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { agendaAPI } from '@/lib/api/agenda';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

type EventType = 'all' | 'holiday' | 'vacation' | 'project' | 'deadline' | 'birthday' | 'hiredate' | 'event' | 'summer' | 'timesheet';

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

// Fonction pour calculer Pâques (algorithme de Meeus/Jones/Butcher)
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Fonction pour obtenir le dernier lundi de mai
function getLastMondayOfMay(year: number): Date {
  const lastDayOfMay = new Date(year, 4, 31);
  const dayOfWeek = lastDayOfMay.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return new Date(year, 4, 31 - daysToSubtract);
}

// Fonction pour obtenir le premier lundi de septembre
function getFirstMondayOfSeptember(year: number): Date {
  const firstDayOfSeptember = new Date(year, 8, 1);
  const dayOfWeek = firstDayOfSeptember.getDay();
  const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  return new Date(year, 8, 1 + daysToAdd - 1);
}

// Fonction pour obtenir le deuxième lundi d'octobre
function getSecondMondayOfOctober(year: number): Date {
  const firstDayOfOctober = new Date(year, 9, 1);
  const dayOfWeek = firstDayOfOctober.getDay();
  const daysToFirstMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  const daysToSecondMonday = daysToFirstMonday + 7;
  return new Date(year, 9, 1 + daysToSecondMonday - 1);
}

// Fonction pour obtenir les jours fériés du Québec
function getQuebecHolidays(year: number): Array<{ date: string; name: string }> {
  const holidays: Array<{ date: string; name: string }> = [];
  
  holidays.push({ date: `${year}-01-01`, name: 'Jour de l\'an' });
  
  const easter = calculateEaster(year);
  
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({ 
    date: `${year}-${String(goodFriday.getMonth() + 1).padStart(2, '0')}-${String(goodFriday.getDate()).padStart(2, '0')}`, 
    name: 'Vendredi saint' 
  });
  
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push({ 
    date: `${year}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`, 
    name: 'Lundi de Pâques' 
  });
  
  const patriotsDay = getLastMondayOfMay(year);
  holidays.push({ 
    date: `${year}-${String(patriotsDay.getMonth() + 1).padStart(2, '0')}-${String(patriotsDay.getDate()).padStart(2, '0')}`, 
    name: 'Fête des Patriotes' 
  });
  
  holidays.push({ date: `${year}-06-24`, name: 'Fête nationale du Québec' });
  holidays.push({ date: `${year}-07-01`, name: 'Fête du Canada' });
  
  const labourDay = getFirstMondayOfSeptember(year);
  holidays.push({ 
    date: `${year}-${String(labourDay.getMonth() + 1).padStart(2, '0')}-${String(labourDay.getDate()).padStart(2, '0')}`, 
    name: 'Fête du travail' 
  });
  
  const thanksgiving = getSecondMondayOfOctober(year);
  holidays.push({ 
    date: `${year}-${String(thanksgiving.getMonth() + 1).padStart(2, '0')}-${String(thanksgiving.getDate()).padStart(2, '0')}`, 
    name: 'Action de grâce' 
  });
  
  holidays.push({ date: `${year}-12-25`, name: 'Noël' });
  
  return holidays;
}

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set(['all']));
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      const currentYear = new Date().getFullYear();
      const calendarEvents: CalendarEvent[] = [];

      // Charger toutes les données en parallèle
      const [projects, vacations, timeEntries, employees, apiEvents] = await Promise.all([
        projectsAPI.list(0, 100),
        vacationRequestsAPI.list({ limit: 100 }),
        timeEntriesAPI.list({ limit: 500 }),
        employeesAPI.list(0, 1000),
        agendaAPI.list().catch(() => []) // Ignore errors
      ]);

      const employeeMap = new Map(employees.map((emp: Employee) => [emp.id, `${emp.first_name} ${emp.last_name}`]));

      // Jours fériés du Québec (année courante et suivante)
      for (let year = currentYear; year <= currentYear + 1; year++) {
        const holidays = getQuebecHolidays(year);
        holidays.forEach(holiday => {
          calendarEvents.push({
            id: `holiday-${holiday.date}`,
            title: `🎉 ${holiday.name}`,
            date: holiday.date,
            type: 'holiday',
            color: 'var(--color-danger-500)'
          });
        });
      }

      // Vacances d'été (1er juillet - 31 août)
      const summerStart = new Date(currentYear, 6, 1);
      const summerEnd = new Date(currentYear, 7, 31);
      for (let d = new Date(summerStart); d <= summerEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0] || d.toISOString().substring(0, 10);
        calendarEvents.push({
          id: `summer-${dateStr}`,
          title: '☀️ Vacances d\'été',
          date: dateStr,
          type: 'summer',
          color: 'var(--color-warning-500)'
        });
      }

      // Projets (début et fin)
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
            color: 'var(--color-primary-500)'
          });
        }

        if (project.end_date || project.deadline) {
          const endDate = project.end_date || project.deadline;
          const endDateStr = endDate!.split('T')[0] || endDate!.substring(0, 10);
          calendarEvents.push({
            id: `project-end-${project.id}`,
            title: `🏁 Fin: ${project.name}`,
            date: endDateStr,
            type: 'deadline',
            description: project.description || undefined,
            priority: 'urgent',
            color: 'var(--color-danger-700)'
          });
        }
      });

      // Vacances
      vacations.forEach((vacation: VacationRequest) => {
        const employeeName = employeeMap.get(vacation.employee_id) || 'Employé';
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0] || d.toISOString().substring(0, 10);
          calendarEvents.push({
            id: `vacation-${vacation.id}-${d.toISOString()}`,
            title: `🏖️ ${employeeName} en vacances`,
            date: dateStr,
            type: 'vacation',
            description: vacation.reason || 'Vacances',
            priority: vacation.status === 'approved' ? 'low' : 'medium',
            color: vacation.status === 'approved' ? 'var(--color-success-500)' : 'var(--color-warning-500)'
          });
        }
      });

      // Anniversaires
      for (let year = currentYear; year <= currentYear + 1; year++) {
        employees.forEach((emp: Employee) => {
          if (emp.birthday) {
            const birthDate = new Date(emp.birthday);
            if (!isNaN(birthDate.getTime())) {
              const birthdayThisYear = new Date(year, birthDate.getMonth(), birthDate.getDate());
              const age = year - birthDate.getFullYear();
              const dateStr = birthdayThisYear.toISOString().split('T')[0] || birthdayThisYear.toISOString().substring(0, 10);
              calendarEvents.push({
                id: `birthday-${emp.id}-${year}`,
                title: `🎂 ${emp.first_name} ${emp.last_name}${age > 0 ? ` (${age} ans)` : ''}`,
                date: dateStr,
                type: 'birthday',
                color: 'var(--color-primary-400)'
              });
            }
          }
        });
      }

      // Dates d'embauche
      for (let year = currentYear; year <= currentYear + 1; year++) {
        employees.forEach((emp: Employee) => {
          if (emp.hire_date) {
            const hireDate = new Date(emp.hire_date);
            if (!isNaN(hireDate.getTime())) {
              const hireDateThisYear = new Date(year, hireDate.getMonth(), hireDate.getDate());
              const yearsOfService = year - hireDate.getFullYear();
              if (yearsOfService >= 0) {
                const dateStr = hireDateThisYear.toISOString().split('T')[0] || hireDateThisYear.toISOString().substring(0, 10);
                calendarEvents.push({
                  id: `hiredate-${emp.id}-${year}`,
                  title: `🎉 ${emp.first_name} ${emp.last_name}${yearsOfService > 0 ? ` (${yearsOfService} an${yearsOfService > 1 ? 's' : ''} de service)` : ' (Nouvel employé)'}`,
                  date: dateStr,
                  type: 'hiredate',
                  color: 'var(--color-info-500)'
                });
              }
            }
          }
        });
      }

      // Événements généraux
      apiEvents.forEach((event) => {
        const eventColors: Record<string, string> = {
          meeting: 'var(--color-primary-500)',
          appointment: 'var(--color-primary-400)',
          reminder: 'var(--color-primary-400)',
          holiday: 'var(--color-danger-500)',
          other: 'var(--color-gray-500)',
        };
        calendarEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          date: event.date,
          type: 'event',
          description: event.description,
          color: eventColors[event.type] || 'var(--color-gray-500)'
        });
      });

      // Feuilles de temps
      const timeEntriesByDate = new Map<string, TimeEntry[]>();
      timeEntries.forEach((entry: TimeEntry) => {
        const date = entry.date.split('T')[0] || entry.date.substring(0, 10);
        if (!timeEntriesByDate.has(date)) {
          timeEntriesByDate.set(date, []);
        }
        timeEntriesByDate.get(date)!.push(entry);
      });

      timeEntriesByDate.forEach((entries, date) => {
        const totalHours = entries.reduce((sum, e) => sum + (e.duration / 3600), 0);
        const uniqueEmployees = new Set(entries.map(e => e.user_id));
        
        calendarEvents.push({
          id: `timesheet-${date}`,
          title: `⏰ ${totalHours.toFixed(1)}h travaillées`,
          date,
          type: 'timesheet',
          description: `${uniqueEmployees.size} employé(s)`,
          priority: 'medium',
          color: 'var(--color-primary-400)'
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      logger.error('Erreur lors du chargement du calendrier', error);
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
    const colors: Record<EventType, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
      all: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-500/30',
        icon: CalendarIcon
      },
      holiday: {
        bg: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/30',
        icon: Star
      },
      vacation: {
        bg: 'bg-green-500/10',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-500/30',
        icon: Plane
      },
      project: {
        bg: 'bg-primary-500/10',
        text: 'text-primary-500',
        border: 'border-primary-500/30',
        icon: Briefcase
      },
      deadline: {
        bg: 'bg-danger-700/10',
        text: 'text-danger-700',
        border: 'border-danger-700/30',
        icon: AlertCircle
      },
      birthday: {
        bg: 'bg-pink-500/10',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-500/30',
        icon: Cake
      },
      hiredate: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500/30',
        icon: Users
      },
      event: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30',
        icon: CheckCircle2
      },
      summer: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/30',
        icon: Sun
      },
      timesheet: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
        icon: Clock
      }
    };
    return colors[type] || colors.all;
  };

  // Quickfilters avec compteurs
  const quickFilters = useMemo(() => {
    const counts = {
      all: events.length,
      holiday: events.filter(e => e.type === 'holiday').length,
      vacation: events.filter(e => e.type === 'vacation').length,
      project: events.filter(e => e.type === 'project').length,
      deadline: events.filter(e => e.type === 'deadline').length,
      birthday: events.filter(e => e.type === 'birthday').length,
      hiredate: events.filter(e => e.type === 'hiredate').length,
      event: events.filter(e => e.type === 'event').length,
      summer: events.filter(e => e.type === 'summer').length,
      timesheet: events.filter(e => e.type === 'timesheet').length,
    };

    return [
      { id: 'all' as EventType, label: 'Tous', icon: CalendarIcon, count: counts.all, color: 'var(--color-primary-500)' },
      { id: 'holiday' as EventType, label: 'Jours fériés', icon: Star, count: counts.holiday, color: 'var(--color-danger-500)' },
      { id: 'vacation' as EventType, label: 'Vacances', icon: Plane, count: counts.vacation, color: 'var(--color-success-500)' },
      { id: 'project' as EventType, label: 'Projets', icon: Briefcase, count: counts.project, color: 'var(--color-primary-500)' },
      { id: 'deadline' as EventType, label: 'Deadlines', icon: AlertCircle, count: counts.deadline, color: 'var(--color-danger-700)' },
      { id: 'birthday' as EventType, label: 'Anniversaires', icon: Cake, count: counts.birthday, color: 'var(--color-primary-400)' },
      { id: 'hiredate' as EventType, label: 'Dates embauche', icon: Users, count: counts.hiredate, color: 'var(--color-info-500)' },
      { id: 'event' as EventType, label: 'Événements', icon: CheckCircle2, count: counts.event, color: 'var(--color-primary-500)' },
      { id: 'summer' as EventType, label: 'Vacances été', icon: Sun, count: counts.summer, color: 'var(--color-warning-500)' },
      { id: 'timesheet' as EventType, label: 'Feuilles temps', icon: Clock, count: counts.timesheet, color: 'var(--color-primary-400)' },
    ];
  }, [events]);

  // Toggle filter
  const toggleFilter = (filterId: EventType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (filterId === 'all') {
        if (newFilters.has('all')) {
          newFilters.clear();
          newFilters.add('all');
        } else {
          newFilters.clear();
          newFilters.add('all');
        }
      } else {
        newFilters.delete('all');
        if (newFilters.has(filterId)) {
          newFilters.delete(filterId);
          if (newFilters.size === 0) {
            newFilters.add('all');
          }
        } else {
          newFilters.add(filterId);
        }
      }
      return newFilters;
    });
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilters.has('all') || activeFilters.size === 0) {
      return events;
    }
    return events.filter(e => activeFilters.has(e.type));
  }, [activeFilters, events]);

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
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
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
  const stats = useMemo(() => ({
    total: events.length,
    holidays: events.filter(e => e.type === 'holiday').length,
    vacations: events.filter(e => e.type === 'vacation').length,
    projects: events.filter(e => e.type === 'project').length,
    deadlines: events.filter(e => e.type === 'deadline').length,
    birthdays: events.filter(e => e.type === 'birthday').length,
    hiredates: events.filter(e => e.type === 'hiredate').length,
    events: events.filter(e => e.type === 'event').length,
    timesheets: events.filter(e => e.type === 'timesheet').length
  }), [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 font-nukleo">
                Calendrier
              </h1>
              <p className="text-white/80 text-lg">
                Gérez vos événements, projets, vacances et jours fériés
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total</p>
                  <p className="text-white text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Jours fériés</p>
                  <p className="text-white text-2xl font-bold">{stats.holidays}</p>
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
                  <Cake className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Anniversaires</p>
                  <p className="text-white text-2xl font-bold">{stats.birthdays}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quickfilters */}
      <div className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => {
            const isActive = activeFilters.has(filter.id);
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{filter.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 rounded-xl mb-6 border border-[#A7A2CF]/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-bold font-nukleo">
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
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

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
                    ? 'bg-primary-500/10 border-primary-500 ring-2 ring-primary-500/30'
                    : isCurrentMonth
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500/50 hover:shadow-md'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-50'
                }`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold mb-2 ${
                      isCurrentDay ? 'text-primary-500' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const eventColor = event.color || 'var(--color-gray-500)';
                        return (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate border"
                            style={{
                              backgroundColor: `${eventColor}20`,
                              color: eventColor,
                              borderColor: `${eventColor}40`
                            }}
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
      <div className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
        <h3 className="text-sm font-semibold mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          {quickFilters.filter(f => f.id !== 'all').map((filter) => {
            const colors = getEventColors(filter.id);
            const Icon = colors.icon;
            return (
              <div key={filter.id} className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${colors.bg} border ${colors.border}`}>
                  <Icon className={`w-3 h-3 ${colors.text}`} />
                </div>
                <span className="text-sm">{filter.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
