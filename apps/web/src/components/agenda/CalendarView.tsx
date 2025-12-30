'use client';

import { useState, useEffect, useMemo } from 'react';
import Calendar, { type CalendarEvent } from '@/components/ui/Calendar';
import { Card, Loading, Alert } from '@/components/ui';
import { Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui';
import DayEventsModal, { type DayEvent } from './DayEventsModal';
import { agendaAPI, type CalendarEvent as APICalendarEvent, type CalendarEventCreate } from '@/lib/api/agenda';
import { handleApiError } from '@/lib/errors/api';

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
  const lastDayOfMay = new Date(year, 4, 31); // 31 mai
  const dayOfWeek = lastDayOfMay.getDay(); // 0 = dimanche, 1 = lundi, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Nombre de jours à soustraire pour obtenir le lundi
  return new Date(year, 4, 31 - daysToSubtract);
}

// Fonction pour obtenir le premier lundi de septembre
function getFirstMondayOfSeptember(year: number): Date {
  const firstDayOfSeptember = new Date(year, 8, 1); // 1er septembre
  const dayOfWeek = firstDayOfSeptember.getDay(); // 0 = dimanche, 1 = lundi, etc.
  // Si c'est dimanche (0), on ajoute 1 jour. Sinon, on calcule les jours jusqu'au lundi suivant
  const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  return new Date(year, 8, 1 + daysToAdd - 1);
}

// Fonction pour obtenir le deuxième lundi d'octobre
function getSecondMondayOfOctober(year: number): Date {
  const firstDayOfOctober = new Date(year, 9, 1); // 1er octobre
  const dayOfWeek = firstDayOfOctober.getDay(); // 0 = dimanche, 1 = lundi, etc.
  // Calculer le premier lundi
  const daysToFirstMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  // Ajouter 7 jours pour obtenir le deuxième lundi
  const daysToSecondMonday = daysToFirstMonday + 7;
  return new Date(year, 9, 1 + daysToSecondMonday - 1);
}

// Fonction pour obtenir les jours fériés du Québec pour une année donnée
function getQuebecHolidays(year: number): Array<{ date: string; name: string }> {
  const holidays: Array<{ date: string; name: string }> = [];
  
  // Jour de l'An (1er janvier)
  holidays.push({ date: `${year}-01-01`, name: 'Jour de l\'an' });
  
  // Calculer Pâques
  const easter = calculateEaster(year);
  
  // Vendredi saint (2 jours avant Pâques)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({ 
    date: `${year}-${String(goodFriday.getMonth() + 1).padStart(2, '0')}-${String(goodFriday.getDate()).padStart(2, '0')}`, 
    name: 'Vendredi saint' 
  });
  
  // Lundi de Pâques (le lundi suivant Pâques)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push({ 
    date: `${year}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`, 
    name: 'Lundi de Pâques' 
  });
  
  // Fête des Patriotes (dernier lundi de mai)
  const patriotsDay = getLastMondayOfMay(year);
  holidays.push({ 
    date: `${year}-${String(patriotsDay.getMonth() + 1).padStart(2, '0')}-${String(patriotsDay.getDate()).padStart(2, '0')}`, 
    name: 'Fête des Patriotes' 
  });
  
  // Fête nationale du Québec / Saint-Jean-Baptiste (24 juin)
  holidays.push({ date: `${year}-06-24`, name: 'Fête nationale du Québec' });
  
  // Fête du Canada (1er juillet)
  holidays.push({ date: `${year}-07-01`, name: 'Fête du Canada' });
  
  // Fête du travail (premier lundi de septembre)
  const labourDay = getFirstMondayOfSeptember(year);
  holidays.push({ 
    date: `${year}-${String(labourDay.getMonth() + 1).padStart(2, '0')}-${String(labourDay.getDate()).padStart(2, '0')}`, 
    name: 'Fête du travail' 
  });
  
  // Action de grâce (deuxième lundi d'octobre)
  const thanksgiving = getSecondMondayOfOctober(year);
  holidays.push({ 
    date: `${year}-${String(thanksgiving.getMonth() + 1).padStart(2, '0')}-${String(thanksgiving.getDate()).padStart(2, '0')}`, 
    name: 'Action de grâce' 
  });
  
  // Noël (25 décembre)
  holidays.push({ date: `${year}-12-25`, name: 'Noël' });
  
  return holidays;
}

// Jours fériés français (année 2025) - conservés pour compatibilité
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
  const [apiEvents, setApiEvents] = useState<APICalendarEvent[]>([]); // Événements de l'API
  
  // Filtres
  const [showVacations, setShowVacations] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showSummerVacation, setShowSummerVacation] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Modal pour les événements d'une journée
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Charger les données
  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les événements du calendrier depuis l'API
      const loadedApiEvents = await agendaAPI.list();
      setApiEvents(loadedApiEvents);
      
      // Convertir les événements API en GeneralEvent
      const convertedEvents: GeneralEvent[] = loadedApiEvents
        .filter(apiEvent => ['meeting', 'appointment', 'reminder', 'other'].includes(apiEvent.type))
        .map(apiEvent => ({
          id: apiEvent.id.toString(),
          title: apiEvent.title,
          start_date: apiEvent.date,
          end_date: apiEvent.end_date || apiEvent.date,
          description: apiEvent.description,
          type: apiEvent.type as GeneralEvent['type'],
        }));
      
      setEvents(convertedEvents);

      // TODO: Charger les vacances et deadlines depuis leurs APIs respectives
      // Pour l'instant, on garde les données mockées
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

    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors du chargement du calendrier';
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

    // Jours fériés du Québec (calculés dynamiquement pour l'année courante et les années suivantes)
    if (showHolidays) {
      const currentYear = new Date().getFullYear();
      // Calculer pour l'année courante et les 2 années suivantes
      for (let year = currentYear; year <= currentYear + 2; year++) {
        const quebecHolidays = getQuebecHolidays(year);
        quebecHolidays.forEach((holiday) => {
          eventsList.push({
            id: `holiday-qc-${holiday.date}`,
            title: holiday.name,
            date: new Date(holiday.date),
            color: '#EF4444', // Rouge pour les jours fériés
          });
        });
      }
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
          endDate: event.end_date ? new Date(event.end_date) : undefined,
          color: eventColors[event.type] || '#6B7280',
          description: event.description,
        });
      });
    }

    return eventsList;
  }, [vacations, deadlines, events, apiEvents, showVacations, showHolidays, showSummerVacation, showDeadlines, showEvents]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Ouvrir le modal avec la date de l'événement
    setSelectedDate(new Date(event.date));
    setIsDayModalOpen(true);
  };

  // Convertir CalendarEvent en DayEvent pour le modal
  const getDayEvents = (date: Date | null): DayEvent[] => {
    if (!date) return [];
    
    return calendarEvents
      .filter((event) => {
        const eventDate = new Date(event.date);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        if (!event.endDate) {
          return (
            eventDate.getDate() === checkDate.getDate() &&
            eventDate.getMonth() === checkDate.getMonth() &&
            eventDate.getFullYear() === checkDate.getFullYear()
          );
        }
        
        const eventEndDate = new Date(event.endDate);
        eventEndDate.setHours(23, 59, 59, 999);
        
        return checkDate >= eventDate && checkDate <= eventEndDate;
      })
      .map((event) => {
        // Déterminer le type basé sur l'ID ou la description
        let type: DayEvent['type'] = 'other';
        if (event.id.startsWith('vacation-')) type = 'vacation';
        else if (event.id.startsWith('deadline-')) type = 'deadline';
        else if (event.id.startsWith('holiday-')) type = 'holiday';
        else if (event.id.startsWith('event-')) {
          // Pour les événements de l'API, chercher dans les apiEvents chargés
          const eventIdStr = event.id.replace('event-', '');
          const apiEvent = apiEvents.find(e => e.id.toString() === eventIdStr);
          if (apiEvent) {
            type = apiEvent.type as DayEvent['type'];
          } else {
            // Essayer de déterminer le type depuis la description
            const desc = event.description?.toLowerCase() || '';
            if (desc.includes('meeting') || desc.includes('réunion')) type = 'meeting';
            else if (desc.includes('appointment') || desc.includes('rendez-vous')) type = 'appointment';
            else if (desc.includes('reminder') || desc.includes('rappel')) type = 'reminder';
          }
        }

        // Récupérer les informations complètes depuis l'API si disponible
        let time: string | undefined;
        let location: string | undefined;
        let attendees: string[] | undefined;
        let color: string | undefined = event.color;
        
        if (event.id.startsWith('event-')) {
          const eventIdStr = event.id.replace('event-', '');
          const apiEvent = apiEvents.find(e => e.id.toString() === eventIdStr);
          if (apiEvent) {
            time = apiEvent.time;
            location = apiEvent.location;
            attendees = apiEvent.attendees;
            color = apiEvent.color || color;
          }
        }

        return {
          ...event,
          type,
          time,
          location,
          attendees,
          color,
        } as DayEvent;
      });
  };

  const handleAddEvent = async (eventData: Omit<DayEvent, 'id'>) => {
    try {
      // Vérifier que date est défini
      if (!eventData.date) {
        throw new Error('La date est requise pour créer un événement');
      }
      
      // Extraire la date pour garantir le typage
      const eventDate = eventData.date;
      
      // Convertir la date en format ISO string (YYYY-MM-DD)
      const dateString = eventDate.toISOString().split('T')[0] as string;
      
      // Convertir DayEvent en format API
      const apiEventData: CalendarEventCreate = {
        title: eventData.title,
        description: eventData.description,
        date: dateString,
        end_date: eventData.endDate?.toISOString().split('T')[0],
        time: eventData.time,
        type: (eventData.type || 'other') as CalendarEventCreate['type'],
        location: eventData.location,
        attendees: eventData.attendees,
        color: eventData.color,
      };
      
      // Créer l'événement via l'API
      await agendaAPI.create(apiEventData);
      
      // Recharger les données du calendrier
      await loadCalendarData();
      
      showToast({
        message: 'Événement ajouté avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      const errorMessage = appError.message || 'Erreur lors de l\'ajout de l\'événement';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      throw error;
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<DayEvent>) => {
    try {
      // Extraire l'ID numérique de l'événement
      const numericId = eventId.startsWith('event-') 
        ? parseInt(eventId.replace('event-', ''), 10)
        : parseInt(eventId, 10);
      
      if (isNaN(numericId)) {
        throw new Error('ID d\'événement invalide');
      }
      
      // Convertir DayEvent en format API
      const apiEventData: any = {};
      if (eventData.title !== undefined) apiEventData.title = eventData.title;
      if (eventData.description !== undefined) apiEventData.description = eventData.description;
      if (eventData.date) apiEventData.date = eventData.date.toISOString().split('T')[0];
      if (eventData.endDate) apiEventData.end_date = eventData.endDate.toISOString().split('T')[0];
      if (eventData.time !== undefined) apiEventData.time = eventData.time;
      if (eventData.type !== undefined) apiEventData.type = eventData.type;
      if (eventData.location !== undefined) apiEventData.location = eventData.location;
      if (eventData.attendees !== undefined) apiEventData.attendees = eventData.attendees;
      if (eventData.color !== undefined) apiEventData.color = eventData.color;
      
      // Mettre à jour l'événement via l'API
      await agendaAPI.update(numericId, apiEventData);
      
      // Recharger les données du calendrier
      await loadCalendarData();
      
      showToast({
        message: 'Événement modifié avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      const errorMessage = appError.message || 'Erreur lors de la modification de l\'événement';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Extraire l'ID numérique de l'événement
      const numericId = eventId.startsWith('event-') 
        ? parseInt(eventId.replace('event-', ''), 10)
        : parseInt(eventId, 10);
      
      if (isNaN(numericId)) {
        throw new Error('ID d\'événement invalide');
      }
      
      // Supprimer l'événement via l'API
      await agendaAPI.delete(numericId);
      
      // Recharger les données du calendrier
      await loadCalendarData();
      
      showToast({
        message: 'Événement supprimé avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      const errorMessage = appError.message || 'Erreur lors de la suppression de l\'événement';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      throw error;
    }
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

      {/* Modal pour les événements d'une journée */}
      <DayEventsModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        date={selectedDate}
        events={getDayEvents(selectedDate)}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
}
