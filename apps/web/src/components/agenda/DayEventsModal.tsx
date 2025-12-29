'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button, Card, Badge } from '@/components/ui';
import { CalendarEvent } from '@/components/ui/Calendar';
import { Plus, Edit, Trash2, X, Clock, MapPin, User } from 'lucide-react';
import EventForm from './EventForm';

export interface DayEvent extends CalendarEvent {
  type?: 'vacation' | 'deadline' | 'meeting' | 'appointment' | 'reminder' | 'holiday' | 'other';
  time?: string;
  location?: string;
  attendees?: string[];
}

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: DayEvent[];
  onAddEvent: (event: Omit<DayEvent, 'id'>) => Promise<void>;
  onUpdateEvent: (eventId: string, event: Partial<DayEvent>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export default function DayEventsModal({
  isOpen,
  onClose,
  date,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: DayEventsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DayEvent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setEditingEvent(null);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddEvent = async (eventData: Omit<DayEvent, 'id'>) => {
    setLoading(true);
    try {
      await onAddEvent(eventData);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<DayEvent>) => {
    setLoading(true);
    try {
      await onUpdateEvent(eventId, eventData);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }
    setLoading(true);
    try {
      await onDeleteEvent(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      vacation: 'Vacances',
      deadline: 'Deadline',
      meeting: 'Réunion',
      appointment: 'Rendez-vous',
      reminder: 'Rappel',
      holiday: 'Jour férié',
      other: 'Autre',
    };
    return labels[type || 'other'] || 'Autre';
  };

  if (!date) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Événements du ${formatDate(date)}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Liste des événements */}
        {!showAddForm && !editingEvent && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {events.length} événement{events.length > 1 ? 's' : ''}
              </h3>
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter un événement
              </Button>
            </div>

            {events.length === 0 ? (
              <Card>
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Aucun événement pour cette journée</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter le premier événement
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color || '#3B82F6' }}
                          />
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          {event.type && (
                            <Badge variant="default" className="text-xs">
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {event.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{event.attendees.length} participant(s)</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEvent(event)}
                          className="p-1"
                          aria-label="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1 text-danger hover:text-danger"
                          aria-label="Supprimer"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Nouvel événement</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <EventForm
              date={date}
              onSubmit={handleAddEvent}
              onCancel={() => setShowAddForm(false)}
              loading={loading}
            />
          </div>
        )}

        {/* Formulaire d'édition */}
        {editingEvent && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Modifier l'événement</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEvent(null)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <EventForm
              date={date}
              event={editingEvent}
              onSubmit={(data) => handleUpdateEvent(editingEvent.id, data)}
              onCancel={() => setEditingEvent(null)}
              loading={loading}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
