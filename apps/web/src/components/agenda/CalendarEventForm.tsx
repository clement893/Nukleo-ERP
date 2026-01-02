'use client';

import { useState } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui';
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '@/lib/api/agenda';

interface CalendarEventFormProps {
  event?: CalendarEvent | null;
  defaultDate?: string; // ISO date string (YYYY-MM-DD)
  onSubmit: (data: CalendarEventCreate | CalendarEventUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EVENT_TYPES = [
  { value: 'meeting', label: 'Réunion' },
  { value: 'appointment', label: 'Rendez-vous' },
  { value: 'reminder', label: 'Rappel' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'vacation', label: 'Vacances' },
  { value: 'holiday', label: 'Jour férié' },
  { value: 'other', label: 'Autre' },
];

const COLORS = [
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#6B7280', label: 'Gris' },
];

export default function CalendarEventForm({
  event,
  defaultDate,
  onSubmit,
  onCancel,
  loading = false,
}: CalendarEventFormProps) {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<CalendarEventCreate>({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || defaultDate || new Date().toISOString().split('T')[0],
    end_date: event?.end_date || undefined,
    time: event?.time || undefined,
    type: event?.type || 'meeting',
    location: event?.location || undefined,
    attendees: event?.attendees || undefined,
    color: event?.color || '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast({
        message: 'Le titre est requis',
        type: 'error',
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Titre *"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Titre de l'événement"
        required
        disabled={loading}
      />

      <Select
        label="Type"
        options={EVENT_TYPES}
        value={formData.type || 'meeting'}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
        disabled={loading}
      />

      <Textarea
        label="Description"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
        placeholder="Description de l'événement"
        rows={3}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date de début *"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          disabled={loading}
        />

        <Input
          label="Date de fin (optionnel)"
          type="date"
          value={formData.end_date || ''}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value || undefined })}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Heure"
          type="time"
          value={formData.time || ''}
          onChange={(e) => setFormData({ ...formData, time: e.target.value || undefined })}
          disabled={loading}
        />

        <Select
          label="Couleur"
          options={COLORS}
          value={formData.color || '#3B82F6'}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          disabled={loading}
        />
      </div>

      <Input
        label="Lieu"
        value={formData.location || ''}
        onChange={(e) => setFormData({ ...formData, location: e.target.value || undefined })}
        placeholder="Lieu de l'événement"
        disabled={loading}
      />

      <Input
        label="Participants (séparés par des virgules)"
        value={formData.attendees?.join(', ') || ''}
        onChange={(e) => {
          const attendees = e.target.value
            ? e.target.value.split(',').map(a => a.trim()).filter(Boolean)
            : undefined;
          setFormData({ ...formData, attendees });
        }}
        placeholder="Jean Dupont, Marie Martin"
        disabled={loading}
      />

      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title.trim()}
        >
          {loading ? 'Enregistrement...' : event ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
