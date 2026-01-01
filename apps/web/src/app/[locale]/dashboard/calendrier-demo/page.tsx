'use client';

import { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Star,
  Briefcase,
  Plane,
  Heart
} from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day';
type EventType = 'meeting' | 'deadline' | 'holiday' | 'vacation' | 'personal';

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
}

export default function CalendrierDemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  // Mock events
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Réunion équipe produit',
      date: '2025-01-02',
      startTime: '09:00',
      endTime: '10:30',
      type: 'meeting',
      location: 'Salle de conférence A',
      attendees: ['Marie Dubois', 'Jean Martin', 'Sophie Tremblay'],
      priority: 'high'
    },
    {
      id: '2',
      title: 'Deadline - Rapport Q4',
      date: '2025-01-05',
      type: 'deadline',
      priority: 'urgent'
    },
    {
      id: '3',
      title: 'Jour de l\'an',
      date: '2025-01-01',
      type: 'holiday'
    },
    {
      id: '4',
      title: 'Vacances - Marie Dubois',
      date: '2025-01-08',
      type: 'vacation'
    },
    {
      id: '5',
      title: 'Déjeuner client',
      date: '2025-01-10',
      startTime: '12:00',
      endTime: '14:00',
      type: 'meeting',
      location: 'Restaurant Le Gourmet',
      priority: 'medium'
    },
    {
      id: '6',
      title: 'Rendez-vous médical',
      date: '2025-01-15',
      startTime: '14:30',
      endTime: '15:30',
      type: 'personal'
    }
  ];

  // Get event colors based on type
  const getEventColors = (type: EventType) => {
    const colors = {
      meeting: {
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
      holiday: {
        bg: 'bg-[#5F2B75]/10',
        text: 'text-[#5F2B75]',
        border: 'border-[#5F2B75]/30',
        icon: Star
      },
      vacation: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30',
        icon: Plane
      },
      personal: {
        bg: 'bg-pink-500/10',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-500/30',
        icon: Heart
      }
    };
    return colors[type];
  };

  // Get priority badge
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const badges = {
      urgent: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Urgent' },
      high: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'Haute' },
      medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', label: 'Moyenne' },
      low: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: 'Basse' }
    };
    
    const badge = badges[priority as keyof typeof badges];
    return (
      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
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

  return (
    <div className="min-h-screen p-6">
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
                Gérez vos événements, deadlines et jours fériés avec style
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
                  <p className="text-white/70 text-sm">Événements</p>
                  <p className="text-white text-2xl font-bold">12</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Deadlines</p>
                  <p className="text-white text-2xl font-bold">5</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Réunions</p>
                  <p className="text-white text-2xl font-bold">8</p>
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
                  <p className="text-white text-2xl font-bold">3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls and Filters */}
      <div className="glass-card p-4 rounded-xl mb-6 border border-[#A7A2CF]/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-[#523DC9]/10 text-gray-700 dark:text-gray-300 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-[200px]">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-[#523DC9]/10 text-gray-700 dark:text-gray-300 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-lg bg-[#523DC9]/10 text-[#523DC9] hover:bg-[#523DC9]/20 transition-all font-medium"
            >
              Aujourd'hui
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-[#523DC9] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-[#523DC9] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-[#523DC9] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Jour
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#A7A2CF]/20">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'all'
                ? 'bg-[#523DC9]/10 text-[#523DC9] border border-[#523DC9]/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            Tous
          </button>
          <button
            onClick={() => setFilterType('meeting')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'meeting'
                ? 'bg-[#523DC9]/10 text-[#523DC9] border border-[#523DC9]/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Réunions
          </button>
          <button
            onClick={() => setFilterType('deadline')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'deadline'
                ? 'bg-[#6B1817]/10 text-[#6B1817] border border-[#6B1817]/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Deadlines
          </button>
          <button
            onClick={() => setFilterType('holiday')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'holiday'
                ? 'bg-[#5F2B75]/10 text-[#5F2B75] border border-[#5F2B75]/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Star className="w-4 h-4" />
            Jours fériés
          </button>
          <button
            onClick={() => setFilterType('vacation')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'vacation'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Plane className="w-4 h-4" />
            Vacances
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-[#523DC9] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dayEvents = date ? getEventsForDate(date) : [];
            const today = isToday(date);
            const sameMonth = isSameMonth(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                  date
                    ? sameMonth
                      ? today
                        ? 'bg-[#523DC9]/10 border-[#523DC9] shadow-lg'
                        : 'bg-white/50 dark:bg-gray-800/50 border-[#A7A2CF]/20 hover:border-[#523DC9]/50 hover:shadow-md cursor-pointer'
                      : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/20 dark:border-gray-700/20 opacity-50'
                    : 'border-transparent'
                }`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold mb-2 ${
                      today 
                        ? 'text-[#523DC9]' 
                        : sameMonth 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => {
                        const colors = getEventColors(event.type);
                        const Icon = colors.icon;
                        return (
                          <div
                            key={event.id}
                            className={`px-2 py-1 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} flex items-center gap-1 truncate`}
                          >
                            <Icon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          +{dayEvents.length - 2} autres
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

      {/* Upcoming Events Sidebar */}
      <div className="mt-6 glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#523DC9]" />
          Événements à venir
        </h3>
        
        <div className="space-y-3">
          {filteredEvents.slice(0, 5).map(event => {
            const colors = getEventColors(event.type);
            const Icon = colors.icon;
            
            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border ${colors.bg} ${colors.border} hover:scale-[1.01] transition-all cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold ${colors.text}`}>{event.title}</h4>
                      {getPriorityBadge(event.priority)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                      
                      {event.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      )}
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500 mt-1">
                        <Users className="w-4 h-4" />
                        {event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
