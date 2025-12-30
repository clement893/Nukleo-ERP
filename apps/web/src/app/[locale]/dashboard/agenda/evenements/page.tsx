'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge, Modal } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SearchBar from '@/components/ui/SearchBar';
import MotionDiv from '@/components/motion/MotionDiv';
import { agendaAPI, type CalendarEvent, type CalendarEventCreate, type CalendarEventUpdate } from '@/lib/api/agenda';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import EventForm from '@/components/agenda/EventForm';
import { DayEvent } from '@/components/agenda/DayEventsModal';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { clsx } from 'clsx';

function EvenementsContent() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Load events
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      
      // Load all events, we'll filter them client-side
      const allEvents = await agendaAPI.list({
        limit: 1000,
      });
      
      setEvents(allEvents);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des événements');
      showToast({
        message: appError.message || 'Erreur lors du chargement des événements',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      // Date filter
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (filterDate === 'upcoming' && eventDate < today) {
        return false;
      }
      if (filterDate === 'past' && eventDate >= today) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && event.type !== filterType) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDescription = event.description?.toLowerCase().includes(query) || false;
        const matchesLocation = event.location?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDescription && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [events, filterType, filterDate, searchQuery]);

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

  // Handle create
  const handleCreate = async (eventData: Omit<DayEvent, 'id'>) => {
    try {
      const createData: CalendarEventCreate = {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date.toISOString().split('T')[0],
        end_date: eventData.endDate?.toISOString().split('T')[0],
        time: eventData.time,
        type: eventData.type || 'other',
        location: eventData.location,
        attendees: eventData.attendees,
        color: eventData.color,
      };

      await agendaAPI.create(createData);
      setShowCreateModal(false);
      await loadEvents();
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
  };

  // Handle update
  const handleUpdate = async (eventId: string, eventData: Partial<DayEvent>) => {
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

      await agendaAPI.update(selectedEvent.id, updateData);
      setShowEditModal(false);
      setSelectedEvent(null);
      await loadEvents();
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
  };

  // Handle delete
  const handleDelete = async (event: CalendarEvent) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`)) {
      return;
    }

    try {
      await agendaAPI.delete(event.id);
      await loadEvents();
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
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Event type labels
  const eventTypeLabels: Record<string, string> = {
    meeting: 'Réunion',
    appointment: 'Rendez-vous',
    reminder: 'Rappel',
    deadline: 'Deadline',
    vacation: 'Vacances',
    holiday: 'Jour férié',
    other: 'Autre',
  };

  // Table columns
  const columns: Column<CalendarEvent>[] = [
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (_value, event) => (
        <div>
          <div className="font-medium text-foreground">{event.title}</div>
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
      render: (value, event) => (
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedEvent(event);
              setShowEditModal(true);
            }}
            className="text-primary hover:text-primary-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(event)}
            className="text-destructive hover:text-destructive-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
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
        <Card>
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
              <div className="text-sm text-muted-foreground">
                {sortedEvents.length} événement{sortedEvents.length > 1 ? 's' : ''} 
                {filterDate !== 'all' || filterType !== 'all' || searchQuery ? ` (filtré${sortedEvents.length > 1 ? 's' : ''})` : ''}
              </div>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </Button>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Content */}
        {loading ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <Card>
            <DataTable
              data={sortedEvents as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              pagination={true}
              pageSize={20}
              searchable={false}
              filterable={false}
              emptyMessage="Aucun événement trouvé"
            />
          </Card>
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
            loading={loading}
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
              loading={loading}
            />
          )}
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}

export default function EvenementsPage() {
  return <EvenementsContent />;
}
