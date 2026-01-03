'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { NukleoPageHeader } from '@/components/nukleo';
import { Button, Alert, Loading, Badge, Modal } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Drawer from '@/components/ui/Drawer';
import Tabs from '@/components/ui/Tabs';
import Dropdown from '@/components/ui/Dropdown';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { 
  useEvents, 
  useCreateEvent, 
  useUpdateEvent, 
  useDeleteEvent,
  useEvent 
} from '@/lib/query/agenda';
import { type CalendarEvent, type CalendarEventCreate, type CalendarEventUpdate } from '@/lib/api/agenda';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import EventForm from '@/components/agenda/EventForm';
import { DayEvent } from '@/components/agenda/DayEventsModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Clock, 
  Eye,
  Copy,
  MoreVertical,
  CheckSquare as CheckSquareIcon,
  Square,
  Info,
  Search,
  LayoutGrid,
  List as ListIcon,
  Table,
  Star,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

type ViewMode = 'gallery' | 'list' | 'table';

function EvenementsContent() {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  // Selection
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());

  // Calculate date filters for server-side filtering (mémorisé)
  const todayString = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }, []); // Ne change qu'une fois par jour

  // Build API params (optimisé: limite réduite à 100 au lieu de 1000)
  const apiParams = useMemo(() => {
    const params: {
      start_date?: string;
      end_date?: string;
      event_type?: string;
      limit?: number;
    } = {
      limit: 100, // Réduit de 1000 à 100 pour améliorer les performances
    };

    if (filterDate === 'upcoming') {
      params.start_date = todayString;
    } else if (filterDate === 'past') {
      params.end_date = todayString;
    }

    if (filterType !== 'all') {
      params.event_type = filterType;
    }

    return params;
  }, [filterDate, filterType, todayString]);

  // React Query hooks
  const { data: events = [], isLoading, error } = useEvents(apiParams);
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const { data: eventDetail } = useEvent(selectedEventId || 0, !!selectedEventId && showDetailDrawer);

  // Filter events (client-side for search)
  const filteredEvents = useMemo(() => {
    if (!debouncedSearchQuery) return events;

    const query = debouncedSearchQuery.toLowerCase();
    return events.filter((event) => {
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description?.toLowerCase().includes(query) || false;
      const matchesLocation = event.location?.toLowerCase().includes(query) || false;
      return matchesTitle || matchesDescription || matchesLocation;
    });
  }, [events, debouncedSearchQuery]);

  // Sort events by date (upcoming first)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // If same date, sort by time
      const timeA = a.time ? a.time : '00:00';
      const timeB = b.time ? b.time : '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [filteredEvents]);

  // Handle create (mémorisé)
  const handleCreate = useCallback(async (eventData: Omit<DayEvent, 'id'>) => {
    try {
      const eventDate = eventData.date || new Date();
      const dateString: string = eventDate.toISOString().split('T')[0] ?? '';
      const createData: CalendarEventCreate = {
        title: eventData.title,
        description: eventData.description,
        date: dateString,
        end_date: eventData.endDate?.toISOString().split('T')[0],
        time: eventData.time,
        type: eventData.type || 'other',
        location: eventData.location,
        attendees: eventData.attendees,
        color: eventData.color,
      };

      await createEventMutation.mutateAsync(createData);
      setShowCreateModal(false);
      showToast({
        message: 'Événement créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de l\'événement',
        type: 'error',
      });
      throw err;
    }
  }, [createEventMutation, showToast]);

  // Handle update (mémorisé)
  const handleUpdate = useCallback(async (_eventId: string, eventData: Partial<DayEvent>) => {
    if (!selectedEvent) return;

    try {
      const updateData: CalendarEventUpdate = {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date?.toISOString().split('T')[0],
        end_date: eventData.endDate?.toISOString().split('T')[0],
        time: eventData.time,
        type: eventData.type,
        location: eventData.location,
        attendees: eventData.attendees,
        color: eventData.color,
      };

      await updateEventMutation.mutateAsync({ id: selectedEvent.id, data: updateData });
      setShowEditModal(false);
      setSelectedEvent(null);
      showToast({
        message: 'Événement modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification de l\'événement',
        type: 'error',
      });
      throw err;
    }
  }, [selectedEvent, updateEventMutation, showToast]);

  // Handle delete (mémorisé)
  const handleDelete = useCallback(async (event: CalendarEvent) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`)) {
      return;
    }

    try {
      await deleteEventMutation.mutateAsync(event.id);
      showToast({
        message: 'Événement supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de l\'événement',
        type: 'error',
      });
    }
  }, [deleteEventMutation, showToast]);

  // Handle duplicate (mémorisé)
  const handleDuplicate = useCallback(async (event: CalendarEvent) => {
    try {
      const duplicateData: CalendarEventCreate = {
        title: `${event.title} (copie)`,
        description: event.description,
        date: event.date,
        end_date: event.end_date,
        time: event.time,
        type: event.type,
        location: event.location,
        attendees: event.attendees,
        color: event.color,
      };
      await createEventMutation.mutateAsync(duplicateData);
      showToast({ message: 'Événement dupliqué avec succès', type: 'success' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la duplication', type: 'error' });
    }
  }, [createEventMutation, showToast]);

  // Toggle selection (mémorisé)
  const toggleEventSelection = useCallback((eventId: number) => {
    setSelectedEvents(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(eventId)) {
        newSelection.delete(eventId);
      } else {
        newSelection.add(eventId);
      }
      return newSelection;
    });
  }, []);

  // Handle view details (mémorisé)
  const handleViewDetails = useCallback((event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setSelectedEvent(event);
    setShowDetailDrawer(true);
  }, []);

  // Format date (mémorisé)
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Event type labels (mémorisé) - déclaré avant les fonctions qui l'utilisent
  const eventTypeLabels: Record<string, string> = useMemo(() => ({
    meeting: 'Réunion',
    appointment: 'Rendez-vous',
    reminder: 'Rappel',
    deadline: 'Deadline',
    vacation: 'Vacances',
    holiday: 'Jour férié',
    other: 'Autre',
  }), []);

  // Get event type color
  const getEventTypeColor = useCallback((type: string): { bg: string; text: string; border: string } => {
    const defaultColor = { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' };
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      meeting: { bg: 'bg-primary-500/10', text: 'text-primary-600 dark:text-primary-400', border: 'border-primary-500/30' },
      appointment: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
      reminder: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
      deadline: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
      vacation: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
      holiday: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
      other: defaultColor,
    };
    return colors[type] ?? defaultColor;
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((eventId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = events.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = events.filter(e => new Date(e.date) >= today).length;
    const past = events.filter(e => new Date(e.date) < today).length;
    const meetings = events.filter(e => e.type === 'meeting').length;
    return { total, upcoming, past, meetings };
  }, [events]);

  // Table columns (mémorisé)
  const columns: Column<CalendarEvent>[] = useMemo(() => [
    {
      key: 'select',
      label: '',
      render: (_value, event) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleEventSelection(event.id);
          }}
          className="flex items-center justify-center"
        >
          {selectedEvents.has(event.id) ? (
            <CheckSquareIcon className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ),
    },
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (_value, event) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate" title={event.title}>{event.title}</div>
          {event.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">{event.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (_value, event) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium text-foreground">{formatDate(event.date)}</div>
            {event.time && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.time}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant="default" className="text-xs">
          {eventTypeLabels[String(value)] || String(value)}
        </Badge>
      ),
    },
    {
      key: 'location',
      label: 'Lieu',
      render: (value) => (
        value ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{String(value)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'attendees',
      label: 'Participants',
      render: (value) => (
        value && Array.isArray(value) && value.length > 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{value.length} participant{value.length > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, event) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            }
            items={[
              { label: 'Voir les détails', onClick: () => handleViewDetails(event), icon: <Eye className="w-4 h-4" /> },
              { label: 'Modifier', onClick: () => { setSelectedEvent(event); setShowEditModal(true); }, icon: <Edit className="w-4 h-4" /> },
              { label: 'Dupliquer', onClick: () => handleDuplicate(event), icon: <Copy className="w-4 h-4" /> },
              { divider: true },
              { label: 'Supprimer', onClick: () => handleDelete(event), icon: <Trash2 className="w-4 h-4" />, variant: 'danger' },
            ]}
          />
        </div>
      ),
    },
  ], [selectedEvents, eventTypeLabels, toggleEventSelection, handleViewDetails, handleDuplicate, handleDelete, formatDate]);

  const displayEvent = eventDetail || selectedEvent;

  // Loading skeleton
  const EventCardSkeleton = () => (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
      <Skeleton variant="rectangular" height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="50%" height={16} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="space-y-6">
          <div className="mb-6">
            <Skeleton variant="text" width={200} height={36} />
            <Skeleton variant="text" width={300} height={20} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-3 rounded-xl">
                <Skeleton variant="rectangular" width="100%" height={60} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header Nukleo */}
      <NukleoPageHeader
        title="Événements"
        description="Gérez vos événements, réunions et rendez-vous efficacement"
        compact
        actions={
          <div className="flex items-center gap-3">
            <span className="badge-nukleo px-3 py-1.5">
              {stats.total} total
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="glass-button px-6 py-3 rounded-xl flex items-center gap-2 text-white bg-primary-500 hover:bg-primary-600 transition-all hover-nukleo"
              aria-label="Créer un nouvel événement"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Nouvel événement
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <div className="glass-card p-3 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30 flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-nukleo">
                {stats.total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between gap-3">
            <div className="p-2 rounded-lg bg-success-500/10 border border-success-500/30 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-success-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-nukleo">
                {stats.upcoming}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">À venir</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between gap-3">
            <div className="p-2 rounded-lg bg-gray-500/10 border border-gray-500/30 flex-shrink-0">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-nukleo">
                {stats.past}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Passés</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 flex-shrink-0">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-nukleo">
                {stats.meetings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Réunions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-xl mb-6 mt-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher par titre, description, lieu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-lg"
            aria-label="Rechercher des événements"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'gallery'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode galerie"
            aria-pressed={viewMode === 'gallery'}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Galerie
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'list'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode liste"
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon className="w-4 h-4" aria-hidden="true" />
            Liste
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'table'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode tableau"
            aria-pressed={viewMode === 'table'}
          >
            <Table className="w-4 h-4" aria-hidden="true" />
            Tableau
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'all'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4" aria-hidden="true" />
            Tous
          </button>
          <button
            onClick={() => setFilterType('meeting')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'meeting'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            Réunions {events.filter(e => e.type === 'meeting').length > 0 && `(${events.filter(e => e.type === 'meeting').length})`}
          </button>
          <button
            onClick={() => setFilterType('appointment')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'appointment'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            Rendez-vous
          </button>
          <button
            onClick={() => setFilterDate('upcoming')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterDate === 'upcoming'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            À venir
          </button>
          <button
            onClick={() => setFilterDate('past')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterDate === 'past'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            Passés
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-muted-accessible">
        {searchQuery || filterType !== 'all' || filterDate !== 'all'
          ? `${sortedEvents.length} événement${sortedEvents.length > 1 ? 's' : ''} trouvé${sortedEvents.length > 1 ? 's' : ''}`
          : `${stats.total} événement${stats.total > 1 ? 's' : ''} au total`
        }
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" className="mb-6">
          {error instanceof Error ? error.message : 'Erreur lors du chargement des événements'}
        </Alert>
      )}

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {sortedEvents.map((event) => {
            const typeColors = getEventTypeColor(event.type) || { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' };
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date();
            
            return (
              <div
                key={event.id}
                onClick={() => handleViewDetails(event)}
                className="glass-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewDetails(event);
                  }
                }}
                aria-label={`Voir les détails de ${event.title}`}
              >
                {/* Date Header */}
                <div className={`p-3 ${typeColors.bg} ${typeColors.border} border-b`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className={`w-4 h-4 ${typeColors.text}`} />
                      <span className={`text-sm font-semibold ${typeColors.text}`}>
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(event.id);
                      }}
                      className="glass-badge p-1 rounded-full hover:scale-110 transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label={favorites.has(event.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      title={favorites.has(event.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.has(event.id)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {event.time && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${typeColors.text}`}>
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-muted-accessible line-clamp-2 mt-1">{event.description}</p>
                    )}
                  </div>

                  {/* Badge Type */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
                      {eventTypeLabels[event.type] || event.type}
                    </span>
                    {isPast && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium border bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">
                        Passé
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-accessible">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-accessible">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewDetails(event)}
                      className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`Voir les détails de ${event.title}`}
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEditModal(true);
                      }}
                      className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`Modifier ${event.title}`}
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="glass-badge p-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`Supprimer ${event.title}`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {sortedEvents.map((event) => {
            const typeColors = getEventTypeColor(event.type) || { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' };
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date();
            
            return (
              <div
                key={event.id}
                onClick={() => handleViewDetails(event)}
                className="glass-card p-4 rounded-xl hover:scale-[1.005] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewDetails(event);
                  }
                }}
                aria-label={`Voir les détails de ${event.title}`}
              >
                <div className="flex items-center gap-4">
                  {/* Date/Type Icon */}
                  <div className={`w-16 h-16 rounded-lg ${typeColors.bg} ${typeColors.border} border flex items-center justify-center flex-shrink-0`}>
                    <CalendarIcon className={`w-6 h-6 ${typeColors.text}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {event.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
                        {eventTypeLabels[event.type] || event.type}
                      </span>
                      {isPast && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">
                          Passé
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-accessible line-clamp-1">
                        {event.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-accessible mt-1">
                      {formatDate(event.date)} {event.time && `• ${event.time}`}
                      {event.location && ` • ${event.location}`}
                      {event.attendees && event.attendees.length > 0 && ` • ${event.attendees.length} participant${event.attendees.length > 1 ? 's' : ''}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(event.id)}
                      className="glass-badge p-2 rounded-lg hover:scale-110 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={favorites.has(event.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      title={favorites.has(event.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.has(event.id)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={() => handleViewDetails(event)}
                      className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Voir les détails de ${event.title}`}
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEditModal(true);
                      }}
                      className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Modifier ${event.title}`}
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="glass-badge p-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Supprimer ${event.title}`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card rounded-xl border border-nukleo-lavender/20">
          <DataTable
            data={sortedEvents as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={true}
            pageSize={20}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun événement trouvé"
          />
        </div>
      )}

      {/* Empty State */}
      {sortedEvents.length === 0 && !isLoading && (
        <EmptyState
          icon={CalendarIcon}
          title="Aucun événement trouvé"
          description="Essayez de modifier vos filtres ou créez un nouvel événement"
          variant="default"
          action={{
            label: "Nouvel événement",
            onClick: () => setShowCreateModal(true)
          }}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouvel événement"
        size="lg"
      >
        <EventForm
          date={new Date()}
          onSubmit={async (eventData) => {
            await handleCreate(eventData);
          }}
          onCancel={() => setShowCreateModal(false)}
          loading={createEventMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedEvent !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        title="Modifier l'événement"
        size="lg"
      >
        {selectedEvent && (
          <EventForm
            date={new Date(selectedEvent.date)}
            event={{
              id: selectedEvent.id.toString(),
              title: selectedEvent.title,
              description: selectedEvent.description,
              date: new Date(selectedEvent.date),
              endDate: selectedEvent.end_date ? new Date(selectedEvent.end_date) : undefined,
              time: selectedEvent.time,
              type: selectedEvent.type,
              location: selectedEvent.location,
              attendees: selectedEvent.attendees,
              color: selectedEvent.color,
            }}
            onSubmit={async (eventData) => {
              await handleUpdate(selectedEvent.id.toString(), eventData);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedEvent(null);
            }}
            loading={updateEventMutation.isPending}
          />
        )}
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedEventId(null);
          setSelectedEvent(null);
        }}
        title={displayEvent?.title || 'Détails de l\'événement'}
        position="right"
        size="lg"
      >
        {displayEvent ? (
          <Tabs
            tabs={[
              {
                id: 'info',
                label: 'Informations',
                icon: <Info className="w-4 h-4" />,
                content: (
                  <div className="space-y-6 py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Description
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {displayEvent.description || 'Aucune description'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Date
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(displayEvent.date)}
                        </p>
                      </div>
                      {displayEvent.end_date && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Date de fin
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(displayEvent.end_date)}
                          </p>
                        </div>
                      )}
                      {displayEvent.time && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Heure
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {displayEvent.time}
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Type
                        </h4>
                        <Badge variant="default" className="text-xs">
                          {eventTypeLabels[displayEvent.type] || displayEvent.type}
                        </Badge>
                      </div>
                      {displayEvent.location && (
                        <div className="col-span-2">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Lieu
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {displayEvent.location}
                          </p>
                        </div>
                      )}
                      {displayEvent.attendees && displayEvent.attendees.length > 0 && (
                        <div className="col-span-2">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Participants
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {displayEvent.attendees.map((attendee, index) => (
                              <Badge key={index} variant="default" className="text-xs">
                                {attendee}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Créé le
                        </h4>
                        <p className="text-xs text-gray-900 dark:text-white">
                          {new Date(displayEvent.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'edit',
                label: 'Modifier',
                icon: <Edit className="w-4 h-4" />,
                content: (
                  <div className="py-4">
                    <EventForm
                      date={new Date(displayEvent.date)}
                      event={{
                        id: displayEvent.id.toString(),
                        title: displayEvent.title,
                        description: displayEvent.description,
                        date: new Date(displayEvent.date),
                        endDate: displayEvent.end_date ? new Date(displayEvent.end_date) : undefined,
                        time: displayEvent.time,
                        type: displayEvent.type,
                        location: displayEvent.location,
                        attendees: displayEvent.attendees,
                        color: displayEvent.color,
                      }}
                      onSubmit={async (eventData) => {
                        await handleUpdate(displayEvent.id.toString(), eventData);
                        setShowDetailDrawer(false);
                        setSelectedEventId(null);
                        setSelectedEvent(null);
                      }}
                      onCancel={() => {
                        setShowDetailDrawer(false);
                        setSelectedEventId(null);
                        setSelectedEvent(null);
                      }}
                      loading={updateEventMutation.isPending}
                    />
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <div className="py-8 text-center">
            <Loading />
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function EvenementsPage() {
  return <EvenementsContent />;
}
