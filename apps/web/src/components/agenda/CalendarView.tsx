'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, type CalendarEvent } from '@/components/ui/Calendar';
import { Card, Button, Badge, Loading, Alert } from '@/components/ui';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui';

// Types pour les différents événements
export interface VacationEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  employee_name?: string;
  type: 'vacation' | 'sick_leave' | 'personal_leave' | 'maternity_leave' | 'paternity_leave' | 'unpaid_leave' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface DeadlineEvent {
  id: string;
  title: string;
  due_date: string;
  project_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
}

export interface GeneralEvent {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  description?: string;
  type: 'meeting' | 'appointment' | 'reminder' | 'holiday' | 'other';
}

export interface CalendarViewProps {
  className?: string;
}

// Jours fériés français (année 2025)
const FRENCH_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: 'Jour de l\'an' },
  { date: '2025-04-21', name: 'Lundi de Pâques' },
  { date: '2025-05-01', name: 'Fête du Travail' },
  { date: '2025-05-08', name: 'Victoire 1945' },
  { date: '2025-05-29', name: 'Ascension' },
  { date: '2025-06-09', name: 'Lundi de Pentecôte' },
  { date: '2025-07-14', name: 'Fête nationale' },
  { date: '2025-08-15', name: 'Assomption' },
  { date: '2025-11-01', name: 'Toussaint' },
  { date: '2025-11-11', name: 'Armistice 1918' },
  { date: '2025-12-25', name: 'Noël' },
];

// Vacances d'été (période fixe)
const SUMMER_VACATION = {
  start: '2025-07-01',
  end: '2025-08-31',
  name: 'Vacances d\'été',
};

export default function CalendarView({ className }: CalendarViewProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Données chargées
  const [vacations, setVacations] = useState<VacationEvent[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineEvent[]>([]);
  const [events, setEvents] = useState<GeneralEvent[]>([]);
  
  // Filtres
  const [showVacations, setShowVacations] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showSummerVacation, setShowSummerVacation] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Charger les données
  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Remplacer par de vrais appels API
      // Pour l'instant, on simule avec des données mockées
      
      // Simuler le chargement des vacances des employés
      // const vacationsData = await fetch('/api/v1/agenda/absences');
      // setVacations(await vacationsData.json());
      
      // Simuler le chargement des deadlines
      // const deadlinesData = await fetch('/api/v1/projects/tasks?with_due_date=true');
      // setDeadlines(await deadlinesData.json());
      
      // Simuler le chargement des événements
      // const eventsData = await fetch('/api/v1/agenda/events');
      // setEvents(await eventsData.json());

      // Données mockées pour la démo
      setVacations([
        {
          id: 'vac-1',
          title: 'Vacances - Jean Dupont',
          start_date: '2025-07-15',
          end_date: '2025-07-30',
          employee_name: 'Jean Dupont',
          type: 'vacation',
          status: 'approved',
        },
        {
          id: 'vac-2',
          title: 'Vacances - Marie Martin',
          start_date: '2025-08-10',
          end_date: '2025-08-25',
          employee_name: 'Marie Martin',
          type: 'vacation',
          status: 'approved',
        },
      ]);

      setDeadlines([
        {
          id: 'deadline-1',
          title: 'Livraison projet Alpha',
          due_date: '2025-07-20',
          project_name: 'Projet Alpha',
          priority: 'high',
          status: 'pending',
        },
        {
          id: 'deadline-2',
          title: 'Rapport mensuel',
          due_date: '2025-08-05',
          priority: 'medium',
          status: 'pending',
        },
      ]);

      setEvents([
        {
          id: 'event-1',
          title: 'Réunion équipe',
          start_date: '2025-07-10',
          end_date: '2025-07-10',
          type: 'meeting',
        },
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du calendrier';
      setError(errorMessage);
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Convertir tous les événements en format CalendarEvent
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const eventsList: CalendarEvent[] = [];

    // Jours fériés
    if (showHolidays) {
      FRENCH_HOLIDAYS_2025.forEach((holiday) => {
        eventsList.push({
          id: `holiday-${holiday.date}`,
          title: holiday.name,
          date: new Date(holiday.date),
          color: '#EF4444', // Rouge pour les jours fériés
        });
      });
    }

    // Vacances d'été (un seul événement avec date de fin)
    if (showSummerVacation) {
      eventsList.push({
        id: 'summer-vacation',
        title: SUMMER_VACATION.name,
        date: new Date(SUMMER_VACATION.start),
        endDate: new Date(SUMMER_VACATION.end),
        color: '#F59E0B', // Orange pour les vacances d'été
      });
    }

    // Vacances des employés (événements multi-jours)
    if (showVacations) {
      vacations.forEach((vacation) => {
        const color = vacation.status === 'approved' 
          ? '#10B981' // Vert pour approuvé
          : vacation.status === 'pending'
          ? '#F59E0B' // Orange pour en attente
          : '#6B7280'; // Gris pour autres statuts

        eventsList.push({
          id: `vacation-${vacation.id}`,
          title: vacation.employee_name ? `${vacation.employee_name} - ${vacation.title}` : vacation.title,
          date: new Date(vacation.start_date),
          endDate: new Date(vacation.end_date),
          color,
          description: `Type: ${vacation.type}, Statut: ${vacation.status}`,
        });
      });
    }

    // Deadlines
    if (showDeadlines) {
      deadlines.forEach((deadline) => {
        const priorityColors = {
          low: '#6B7280',
          medium: '#3B82F6',
          high: '#F59E0B',
          urgent: '#EF4444',
        };

        eventsList.push({
          id: `deadline-${deadline.id}`,
          title: deadline.project_name 
            ? `${deadline.title} (${deadline.project_name})`
            : deadline.title,
          date: new Date(deadline.due_date),
          color: priorityColors[deadline.priority],
          description: `Priorité: ${deadline.priority}, Statut: ${deadline.status}`,
        });
      });
    }

    // Événements généraux
    if (showEvents) {
      events.forEach((event) => {
        const eventColors = {
          meeting: '#3B82F6',
          appointment: '#8B5CF6',
          reminder: '#EC4899',
          holiday: '#EF4444',
          other: '#6B7280',
        };

        eventsList.push({
          id: `event-${event.id}`,
          title: event.title,
          date: new Date(event.start_date),
          color: eventColors[event.type] || '#6B7280',
          description: event.description,
        });
      });
    }

    return eventsList;
  }, [vacations, deadlines, events, showVacations, showHolidays, showSummerVacation, showDeadlines, showEvents]);

  const handleDateClick = (date: Date) => {
    const dayEvents = calendarEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });

    if (dayEvents.length > 0) {
      showToast({
        message: `${dayEvents.length} événement(s) le ${date.toLocaleDateString('fr-FR')}`,
        type: 'info',
      });
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    showToast({
      message: event.description || event.title,
      type: 'info',
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </Card>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Filtres et légende */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filtres</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHolidays}
                onChange={(e) => setShowHolidays(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Jours fériés</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSummerVacation}
                onChange={(e) => setShowSummerVacation(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Vacances d'été</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showVacations}
                onChange={(e) => setShowVacations(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Vacances employés</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDeadlines}
                onChange={(e) => setShowDeadlines(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Deadlines</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(e) => setShowEvents(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Événements</span>
            </label>
          </div>

          {/* Légende */}
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Légende</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
                <span className="text-muted-foreground">Jours fériés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
                <span className="text-muted-foreground">Vacances d'été</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }} />
                <span className="text-muted-foreground">Vacances approuvées</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }} />
                <span className="text-muted-foreground">Deadlines / Événements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
                <span className="text-muted-foreground">Vacances en attente</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendrier */}
      <Card>
        <Calendar
          events={calendarEvents}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      </Card>
    </div>
  );
}
