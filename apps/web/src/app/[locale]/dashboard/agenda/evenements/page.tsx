'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { PageHeader, PageContainer } from '@/components/layout';
import { Button, Alert, Loading, Badge, Modal } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SearchBar from '@/components/ui/SearchBar';
import MotionDiv from '@/components/motion/MotionDiv';
import Drawer from '@/components/ui/Drawer';
import Tabs from '@/components/ui/Tabs';
import Dropdown from '@/components/ui/Dropdown';
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
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Eye,
  Copy,
  MoreVertical,
  Download,
  FileDown,
  CheckSquare as CheckSquareIcon,
  Square,
  Info
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

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

  // Handle delete selected (mémorisé avec batch)
  const handleDeleteSelected = useCallback(async () => {
    if (selectedEvents.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedEvents.size} événement(s) ?`)) return;

    try {
      const eventIds = Array.from(selectedEvents);
      const batchSize = 10; // Limiter à 10 requêtes parallèles
      
      // Traiter par batch
      for (let i = 0; i < eventIds.length; i += batchSize) {
        const batch = eventIds.slice(i, i + batchSize);
        await Promise.all(batch.map(id => deleteEventMutation.mutateAsync(id)));
      }
      
      showToast({ message: `${selectedEvents.size} événement(s) supprimé(s) avec succès`, type: 'success' });
      setSelectedEvents(new Set());
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  }, [selectedEvents, deleteEventMutation, showToast]);

  // Handle bulk type change (mémorisé avec batch)
  const handleBulkTypeChange = useCallback(async (newType: string) => {
    if (selectedEvents.size === 0) return;

    try {
      const eventIds = Array.from(selectedEvents);
      const batchSize = 10; // Limiter à 10 requêtes parallèles
      
      // Traiter par batch
      for (let i = 0; i < eventIds.length; i += batchSize) {
        const batch = eventIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(id => {
            const event = events.find(e => e.id === id);
            if (!event) return Promise.resolve();
            return updateEventMutation.mutateAsync({ 
              id, 
              data: { type: newType as CalendarEvent['type'] } 
            });
          })
        );
      }
      
      showToast({ message: `${selectedEvents.size} événement(s) mis(e) à jour`, type: 'success' });
      setSelectedEvents(new Set());
    } catch (error) {
      showToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    }
  }, [selectedEvents, events, updateEventMutation, showToast]);

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

  // Handle export (mémorisé)
  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    try {
      const headers = ['ID', 'Titre', 'Description', 'Date', 'Date de fin', 'Heure', 'Type', 'Lieu', 'Participants', 'Créé le'];
      const rows = sortedEvents.map(event => [
        event.id,
        event.title,
        event.description || '',
        event.date,
        event.end_date || '',
        event.time || '',
        eventTypeLabels[event.type] || event.type,
        event.location || '',
        event.attendees?.join(', ') || '',
        new Date(event.created_at).toLocaleDateString('fr-FR'),
      ]);

      let content = '';
      if (format === 'csv') {
        content = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      } else {
        // Excel format (TSV-like)
        content = [headers, ...rows].map(row => row.join('\t')).join('\n');
      }

      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evenements_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast({ message: `Export ${format.toUpperCase()} réussi`, type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de l\'export', type: 'error' });
    }
  }, [sortedEvents, showToast]);

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

  const toggleSelectAll = useCallback(() => {
    if (selectedEvents.size === sortedEvents.length && sortedEvents.length > 0) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(sortedEvents.map(e => e.id)));
    }
  }, [sortedEvents]);

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

  // Event type labels (mémorisé)
  const eventTypeLabels: Record<string, string> = useMemo(() => ({
    meeting: 'Réunion',
    appointment: 'Rendez-vous',
    reminder: 'Rappel',
    deadline: 'Deadline',
    vacation: 'Vacances',
    holiday: 'Jour férié',
    other: 'Autre',
  }), []);

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
          <Calendar className="w-4 h-4 text-muted-foreground" />
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

  return (
    <PageContainer maxWidth="full">
      <MotionDiv variant="slideUp" duration="normal" className="space-y-4">
        <PageHeader
          title="Événements"
          description={`Gérez vos événements${events.length > 0 ? ` - ${events.length} événement${events.length > 1 ? 's' : ''} au total` : ''}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Agenda', href: '/dashboard/agenda' },
            { label: 'Événements' },
          ]}
        />

        {/* Toolbar */}
        <div className="glass-card rounded-xl border border-border p-6">
          <div className="space-y-3">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Rechercher par titre, description, lieu..."
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les types</option>
                  <option value="meeting">Réunion</option>
                  <option value="appointment">Rendez-vous</option>
                  <option value="reminder">Rappel</option>
                  <option value="deadline">Deadline</option>
                  <option value="vacation">Vacances</option>
                  <option value="holiday">Jour férié</option>
                  <option value="other">Autre</option>
                </select>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value as 'all' | 'upcoming' | 'past')}
                  className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="upcoming">À venir</option>
                  <option value="past">Passés</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sortedEvents.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {selectedEvents.size === sortedEvents.length ? (
                      <CheckSquareIcon className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>Sélectionner tout</span>
                  </button>
                )}
                {selectedEvents.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">|</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer ({selectedEvents.size})
                    </Button>
                    <Dropdown
                      trigger={
                        <Button size="sm" variant="outline">
                          Changer type ({selectedEvents.size})
                        </Button>
                      }
                      items={[
                        { label: 'Réunion', onClick: () => handleBulkTypeChange('meeting') },
                        { label: 'Rendez-vous', onClick: () => handleBulkTypeChange('appointment') },
                        { label: 'Rappel', onClick: () => handleBulkTypeChange('reminder') },
                        { label: 'Deadline', onClick: () => handleBulkTypeChange('deadline') },
                        { label: 'Vacances', onClick: () => handleBulkTypeChange('vacation') },
                        { label: 'Jour férié', onClick: () => handleBulkTypeChange('holiday') },
                        { label: 'Autre', onClick: () => handleBulkTypeChange('other') },
                      ]}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Dropdown
                  trigger={
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  }
                  items={[
                    { label: 'Exporter CSV', onClick: () => handleExport('csv'), icon: <FileDown className="w-4 h-4" /> },
                    { label: 'Exporter Excel', onClick: () => handleExport('excel'), icon: <FileDown className="w-4 h-4" /> },
                  ]}
                />
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel événement
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="error">
            {error instanceof Error ? error.message : 'Erreur lors du chargement des événements'}
          </Alert>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="glass-card rounded-xl border border-border p-6">
            <div className="py-12 text-center">
              <Loading />
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl border border-border">
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
      </MotionDiv>
    </PageContainer>
  );
}

export default function EvenementsPage() {
  return <EvenementsContent />;
}
