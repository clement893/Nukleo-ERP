'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Star,
  Briefcase,
  Cake
} from 'lucide-react';
import { Button, Loading } from '@/components/ui';
import { agendaAPI } from '@/lib/api/agenda';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { vacationRequestsAPI, type VacationRequest } from '@/lib/api/vacationRequests';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';

type ViewMode = 'month' | 'week' | 'day';
type FilterType = 'holidays' | 'summer' | 'vacations' | 'deadlines' | 'events' | 'birthdays' | 'hiredates';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'summer' | 'vacation' | 'deadline' | 'event' | 'birthday' | 'hiredate';
  color: string;
}

// Fonction pour calculer Pâques
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

// Jours fériés Québec
function getQuebecHolidays(year: number): CalendarEvent[] {
  const holidays: CalendarEvent[] = [];
  
  holidays.push({ id: `h-${year}-01-01`, title: 'Jour de l\'an', date: `${year}-01-01`, type: 'holiday', color: 'var(--color-danger-500)' });
  
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({ 
    id: `h-${year}-easter`, 
    title: 'Vendredi saint', 
    date: goodFriday.toISOString().split('T')[0] || `${year}-03-30`, 
    type: 'holiday', 
    color: 'var(--color-danger-500)' 
  });
  
  holidays.push({ id: `h-${year}-05-24`, title: 'Fête de la Reine', date: `${year}-05-24`, type: 'holiday', color: 'var(--color-danger-500)' });
  holidays.push({ id: `h-${year}-06-24`, title: 'Fête nationale', date: `${year}-06-24`, type: 'holiday', color: 'var(--color-danger-500)' });
  holidays.push({ id: `h-${year}-07-01`, title: 'Fête du Canada', date: `${year}-07-01`, type: 'holiday', color: 'var(--color-danger-500)' });
  holidays.push({ id: `h-${year}-09-07`, title: 'Fête du Travail', date: `${year}-09-07`, type: 'holiday', color: 'var(--color-danger-500)' });
  holidays.push({ id: `h-${year}-10-12`, title: 'Action de grâce', date: `${year}-10-12`, type: 'holiday', color: 'var(--color-danger-500)' });
  holidays.push({ id: `h-${year}-12-25`, title: 'Noël', date: `${year}-12-25`, type: 'holiday', color: 'var(--color-danger-500)' });
  
  return holidays;
}

// Vacances d'été
function getSummerVacation(year: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const startDate = new Date(year, 6, 1); // 1er juillet
  const endDate = new Date(year, 7, 31); // 31 août
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0] || '';
    if (dateStr) {
      events.push({
        id: `summer-${dateStr}`,
        title: 'Vacances d\'été',
        date: dateStr,
        type: 'summer',
        color: 'var(--color-warning-500)'
      });
    }
  }
  
  return events;
}

function CalendrierContent() {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(['holidays', 'summer', 'vacations', 'events', 'birthdays', 'hiredates']));
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const allEvents: CalendarEvent[] = [];
      
      // Jours fériés
      const year = new Date().getFullYear();
      const holidays = getQuebecHolidays(year);
      allEvents.push(...holidays);
      
      // Vacances d'été
      const summer = getSummerVacation(year);
      allEvents.push(...summer);
      
      // Vacances approuvées
      try {
        const vacations = await vacationRequestsAPI.list({ status: 'approved', limit: 1000 });
        vacations.forEach((vac: VacationRequest) => {
          const start = new Date(vac.start_date);
          const end = new Date(vac.end_date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0] || '';
            if (dateStr) {
              allEvents.push({
                id: `vac-${vac.id}-${dateStr}`,
                title: `Vacances - ${vac.employee_first_name} ${vac.employee_last_name}`,
                date: dateStr,
                type: 'vacation',
                color: 'var(--color-success-500)'
              });
            }
          }
        });
      } catch (err) {
        logger.warn('Could not load vacations', err);
      }
      
      // Événements
      try {
        const apiEvents = await agendaAPI.list();
        apiEvents.forEach((event) => {
          allEvents.push({
            id: `event-${event.id}`,
            title: event.title,
            date: event.date,
            type: event.type === 'holiday' ? 'holiday' : 'event',
            color: 'var(--color-primary-500)'
          });
        });
      } catch (err) {
        logger.warn('Could not load events', err);
      }
      
      // Employés pour anniversaires et dates d'embauche
      try {
        const emps = await employeesAPI.list(0, 1000);
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        emps.forEach((emp: Employee) => {
          // Ajouter les anniversaires pour l'année courante et suivante
          if (emp.birthday) {
            const birthdayDate = new Date(emp.birthday);
            const birthdayMonth = birthdayDate.getMonth();
            const birthdayDay = birthdayDate.getDate();
            
            // Anniversaire cette année
            const thisYearBirthday = new Date(currentYear, birthdayMonth, birthdayDay);
            allEvents.push({
              id: `birthday-${emp.id}-${currentYear}`,
              title: `🎂 Anniversaire - ${emp.first_name} ${emp.last_name}`,
              date: thisYearBirthday.toISOString().split('T')[0] || '',
              type: 'birthday',
              color: 'var(--color-primary-400)'
            });
            
            // Anniversaire l'année prochaine (pour les calendriers qui affichent plusieurs mois)
            const nextYearBirthday = new Date(nextYear, birthdayMonth, birthdayDay);
            allEvents.push({
              id: `birthday-${emp.id}-${nextYear}`,
              title: `🎂 Anniversaire - ${emp.first_name} ${emp.last_name}`,
              date: nextYearBirthday.toISOString().split('T')[0] || '',
              type: 'birthday',
              color: 'var(--color-primary-400)'
            });
          }
          
          // Dates d'embauche (anniversaires d'embauche pour l'année courante)
          if (emp.hire_date) {
            const hireDate = new Date(emp.hire_date);
            const hireMonth = hireDate.getMonth();
            const hireDay = hireDate.getDate();
            
            // Date d'embauche cette année (si embauché cette année)
            const hireYear = hireDate.getFullYear();
            if (hireYear <= currentYear) {
              const thisYearHireDate = new Date(currentYear, hireMonth, hireDay);
              allEvents.push({
                id: `hire-${emp.id}-${currentYear}`,
                title: `🎉 Embauche - ${emp.first_name} ${emp.last_name}`,
                date: thisYearHireDate.toISOString().split('T')[0] || '',
                type: 'hiredate',
                color: 'var(--color-info-500)'
              });
            }
          }
        });
      } catch (err) {
        logger.warn('Could not load employees', err);
      }
      
      setEvents(allEvents);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur de chargement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle filter
  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  // Filtrer les événements (permettre plusieurs filtres actifs)
  const filteredEvents = useMemo(() => {
    if (activeFilters.size === 0) return [];
    return events.filter(e => {
      if (e.type === 'holiday') return activeFilters.has('holidays');
      if (e.type === 'summer') return activeFilters.has('summer');
      if (e.type === 'vacation') return activeFilters.has('vacations');
      if (e.type === 'deadline') return activeFilters.has('deadlines');
      if (e.type === 'event') return activeFilters.has('events');
      if (e.type === 'birthday') return activeFilters.has('birthdays');
      if (e.type === 'hiredate') return activeFilters.has('hiredates');
      return false;
    });
  }, [events, activeFilters]);

  // Stats
  const stats = useMemo(() => ({
    holidays: events.filter(e => e.type === 'holiday').length,
    vacations: events.filter(e => e.type === 'vacation').length,
    events: events.filter(e => e.type === 'event').length,
    birthdays: events.filter(e => e.type === 'birthday').length,
  }), [events]);

  // Générer le calendrier du mois
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: Date | null; events: CalendarEvent[] }> = [];
    
    // Jours vides avant le 1er
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, events: [] });
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = filteredEvents.filter(e => e.date === dateStr);
      days.push({ date, events: dayEvents });
    }
    
    return days;
  }, [currentDate, filteredEvents]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2 font-nukleo">
                Calendrier
              </h1>
              <p className="text-white/80 text-lg">
                Gérez vos événements, deadlines et jours fériés avec style
              </p>
            </div>
            <Button className="bg-white text-primary-500 hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/30">
                <Star className="w-6 h-6 text-danger-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-nukleo">
              {stats.holidays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jours fériés</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <Briefcase className="w-6 h-6 text-success-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-nukleo">
              {stats.vacations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vacances</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Clock className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-nukleo">
              {stats.events}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Événements</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-400/10 border border-primary-400/30">
                <Cake className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-nukleo">
              {stats.birthdays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Anniversaires</div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="glass-card rounded-xl border border-nukleo-lavender/20 p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={goToPreviousMonth} className="p-2 rounded-lg hover:bg-primary-500/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-nukleo">
                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-primary-500/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={goToToday} variant="outline">Aujourd'hui</Button>
              <div className="flex gap-2">
                <Button variant={viewMode === 'month' ? 'primary' : 'outline'} onClick={() => setViewMode('month')}>Mois</Button>
                <Button variant={viewMode === 'week' ? 'primary' : 'outline'} onClick={() => setViewMode('week')}>Semaine</Button>
                <Button variant={viewMode === 'day' ? 'primary' : 'outline'} onClick={() => setViewMode('day')}>Jour</Button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              variant={activeFilters.has('holidays') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('holidays')}
            >
              Jours fériés
            </Button>
            <Button 
              variant={activeFilters.has('summer') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('summer')}
            >
              Vacances d'été
            </Button>
            <Button 
              variant={activeFilters.has('vacations') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('vacations')}
            >
              Vacances approuvées
            </Button>
            <Button 
              variant={activeFilters.has('events') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('events')}
            >
              Événements
            </Button>
            <Button 
              variant={activeFilters.has('birthdays') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('birthdays')}
            >
              Anniversaires
            </Button>
            <Button 
              variant={activeFilters.has('hiredates') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('hiredates')}
            >
              Dates d'embauche
            </Button>
            <Button 
              variant={activeFilters.has('deadlines') ? 'primary' : 'outline'} 
              onClick={() => toggleFilter('deadlines')}
            >
              Deadlines
            </Button>
          </div>

          {/* Grid calendrier */}
          <div className="grid grid-cols-7 gap-2">
            {/* Headers */}
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center font-bold text-gray-700 dark:text-gray-300 py-2">
                {day}
              </div>
            ))}
            
            {/* Days */}
            {monthDays.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-[100px] p-2 rounded-lg border ${
                  day.date ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 cursor-pointer' : 'border-transparent'
                } ${
                  day.date?.toDateString() === new Date().toDateString() ? 'bg-primary-500/10 border-primary-500' : ''
                }`}
              >
                {day.date && (
                  <>
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {day.events.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs px-2 py-1 rounded truncate"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <div className="text-xs text-gray-500">+{day.events.length - 3} plus</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}

export default function CalendrierPage() {
  return <CalendrierContent />;
}
