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

type ViewMode = 'month' | 'week' | 'day';
type FilterType = 'all' | 'holidays' | 'summer' | 'vacations' | 'deadlines' | 'events' | 'birthdays' | 'hiredates';

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
  
  holidays.push({ id: `h-${year}-01-01`, title: 'Jour de l\'an', date: `${year}-01-01`, type: 'holiday', color: '#EF4444' });
  
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({ 
    id: `h-${year}-easter`, 
    title: 'Vendredi saint', 
    date: goodFriday.toISOString().split('T')[0], 
    type: 'holiday', 
    color: '#EF4444' 
  });
  
  holidays.push({ id: `h-${year}-05-24`, title: 'Fête de la Reine', date: `${year}-05-24`, type: 'holiday', color: '#EF4444' });
  holidays.push({ id: `h-${year}-06-24`, title: 'Fête nationale', date: `${year}-06-24`, type: 'holiday', color: '#EF4444' });
  holidays.push({ id: `h-${year}-07-01`, title: 'Fête du Canada', date: `${year}-07-01`, type: 'holiday', color: '#EF4444' });
  holidays.push({ id: `h-${year}-09-07`, title: 'Fête du Travail', date: `${year}-09-07`, type: 'holiday', color: '#EF4444' });
  holidays.push({ id: `h-${year}-10-12`, title: 'Action de grâce', date: `${year}-10-12`, type: 'holiday', color: '#EF4444' });
  holidays.push({ id: `h-${year}-12-25`, title: 'Noël', date: `${year}-12-25`, type: 'holiday', color: '#EF4444' });
  
  return holidays;
}

// Vacances d'été
function getSummerVacation(year: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const startDate = new Date(year, 6, 1); // 1er juillet
  const endDate = new Date(year, 7, 31); // 31 août
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    events.push({
      id: `summer-${d.toISOString().split('T')[0]}`,
      title: 'Vacances d\'été',
      date: d.toISOString().split('T')[0],
      type: 'summer',
      color: '#F59E0B'
    });
  }
  
  return events;
}

function CalendrierContent() {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

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
            allEvents.push({
              id: `vac-${vac.id}-${d.toISOString().split('T')[0]}`,
              title: `Vacances - ${vac.employee_first_name} ${vac.employee_last_name}`,
              date: d.toISOString().split('T')[0],
              type: 'vacation',
              color: '#10B981'
            });
          }
        });
      } catch (err) {
        console.warn('Could not load vacations:', err);
      }
      
      // Événements
      try {
        const apiEvents = await agendaAPI.list();
        apiEvents.forEach((event: any) => {
          allEvents.push({
            id: `event-${event.id}`,
            title: event.title,
            date: event.date,
            type: event.type === 'holiday' ? 'holiday' : 'event',
            color: '#3B82F6'
          });
        });
      } catch (err) {
        console.warn('Could not load events:', err);
      }
      
      // Employés pour anniversaires et dates d'embauche
      try {
        const emps = await employeesAPI.list(0, 1000);
        setEmployees(emps);
        
        emps.forEach((emp: Employee) => {
          if (emp.date_of_birth) {
            allEvents.push({
              id: `birthday-${emp.id}`,
              title: `Anniversaire - ${emp.first_name} ${emp.last_name}`,
              date: emp.date_of_birth.substring(0, 10),
              type: 'birthday',
              color: '#EC4899'
            });
          }
          if (emp.hire_date) {
            allEvents.push({
              id: `hire-${emp.id}`,
              title: `Embauche - ${emp.first_name} ${emp.last_name}`,
              date: emp.hire_date.substring(0, 10),
              type: 'hiredate',
              color: '#06B6D4'
            });
          }
        });
      } catch (err) {
        console.warn('Could not load employees:', err);
      }
      
      setEvents(allEvents);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur de chargement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => {
      if (filterType === 'holidays') return e.type === 'holiday';
      if (filterType === 'summer') return e.type === 'summer';
      if (filterType === 'vacations') return e.type === 'vacation';
      if (filterType === 'deadlines') return e.type === 'deadline';
      if (filterType === 'events') return e.type === 'event';
      if (filterType === 'birthdays') return e.type === 'birthday';
      if (filterType === 'hiredates') return e.type === 'hiredate';
      return true;
    });
  }, [events, filterType]);

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
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Calendrier
              </h1>
              <p className="text-white/80 text-lg">
                Gérez vos événements, deadlines et jours fériés avec style
              </p>
            </div>
            <Button className="bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <Star className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.holidays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jours fériés</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Briefcase className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.vacations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vacances</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.events}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Événements</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#EC4899]/10 border border-[#EC4899]/30">
                <Cake className="w-6 h-6 text-[#EC4899]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.birthdays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Anniversaires</div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="glass-card rounded-xl border border-[#A7A2CF]/20 p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={goToPreviousMonth} className="p-2 rounded-lg hover:bg-[#523DC9]/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-[#523DC9]/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={goToToday} variant="outline">Aujourd'hui</Button>
              <div className="flex gap-2">
                <Button variant={viewMode === 'month' ? 'default' : 'outline'} onClick={() => setViewMode('month')}>Mois</Button>
                <Button variant={viewMode === 'week' ? 'default' : 'outline'} onClick={() => setViewMode('week')}>Semaine</Button>
                <Button variant={viewMode === 'day' ? 'default' : 'outline'} onClick={() => setViewMode('day')}>Jour</Button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant={filterType === 'all' ? 'default' : 'outline'} onClick={() => setFilterType('all')}>Tous</Button>
            <Button variant={filterType === 'holidays' ? 'default' : 'outline'} onClick={() => setFilterType('holidays')}>Jours fériés</Button>
            <Button variant={filterType === 'summer' ? 'default' : 'outline'} onClick={() => setFilterType('summer')}>Vacances d'été</Button>
            <Button variant={filterType === 'vacations' ? 'default' : 'outline'} onClick={() => setFilterType('vacations')}>Vacances approuvées</Button>
            <Button variant={filterType === 'events' ? 'default' : 'outline'} onClick={() => setFilterType('events')}>Événements</Button>
            <Button variant={filterType === 'birthdays' ? 'default' : 'outline'} onClick={() => setFilterType('birthdays')}>Anniversaires</Button>
            <Button variant={filterType === 'hiredates' ? 'default' : 'outline'} onClick={() => setFilterType('hiredates')}>Dates d'embauche</Button>
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
                  day.date ? 'border-gray-200 dark:border-gray-700 hover:border-[#523DC9] cursor-pointer' : 'border-transparent'
                } ${
                  day.date?.toDateString() === new Date().toDateString() ? 'bg-[#523DC9]/10 border-[#523DC9]' : ''
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
