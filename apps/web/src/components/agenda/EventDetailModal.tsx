'use client';

import { useState } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { Clock, MapPin, User, Edit, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '@/lib/api/agenda';
import CalendarEventForm from './CalendarEventForm';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (id: number, data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  editing?: boolean;
  loading?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: 'Réunion',
  appointment: 'Rendez-vous',
  reminder: 'Rappel',
  deadline: 'Deadline',
  vacation: 'Vacances',
  holiday: 'Jour férié',
  other: 'Autre',
};

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  editing = false,
  loading = false,
}: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(editing);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const handleEdit = async (data: any) => {
    await onEdit(event.id, data);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isEditing) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsEditing(false);
          onClose();
        }}
        title="Modifier l'événement"
        size="lg"
      >
        <CalendarEventForm
          event={event}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
          loading={loading}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge
            style={{
              backgroundColor: `${event.color}20`,
              color: event.color,
              borderColor: event.color,
            }}
          >
            {EVENT_TYPE_LABELS[event.type] || event.type}
          </Badge>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={loading || isDeleting}
            >
              <Edit className="w-4 h-4 mr-2" />
              Éditer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={loading || isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {event.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de début
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(event.date)}
            </p>
          </div>

          {event.end_date && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(event.end_date)}
              </p>
            </div>
          )}

          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {event.time}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {event.location}
              </span>
            </div>
          )}
        </div>

        {event.attendees && event.attendees.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Participants
            </h4>
            <div className="flex flex-wrap gap-2">
              {event.attendees.map((attendee, index) => (
                <Badge key={index} variant="outline">
                  {attendee}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
