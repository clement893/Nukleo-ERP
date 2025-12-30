'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { DayEvent } from './DayEventsModal';
import { useToast } from '@/components/ui';

interface EventFormProps {
  date: Date;
  event?: DayEvent | null;
  onSubmit: (event: Omit<DayEvent, 'id'>) => Promise<void>;
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

export default function EventForm({
  date,
  event,
  onSubmit,
  onCancel,
  loading = false,
}: EventFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: DayEvent['type'];
    time: string;
    location: string;
    color: string;
    attendees: string;
    endDate: string;
  }>({
    title: event?.title || '',
    description: event?.description || '',
    type: (event?.type || 'meeting') as DayEvent['type'],
    time: event?.time || '',
    location: event?.location || '',
    color: event?.color || '#3B82F6',
    attendees: event?.attendees?.join(', ') || '',
    endDate: ((): string => {
      if (event?.endDate instanceof Date) {
        return event.endDate.toISOString().split('T')[0];
      }
      if (event?.endDate) {
        return String(event.endDate);
      }
      return '';
    })(),
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

    try {
      const eventData: Omit<DayEvent, 'id'> = {
        title: formData.title.trim(),
        date: date,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description.trim() || undefined,
        type: formData.type as DayEvent['type'],
        time: formData.time.trim() || undefined,
        location: formData.location.trim() || undefined,
        color: formData.color,
        attendees: formData.attendees
          ? formData.attendees.split(',').map(a => a.trim()).filter(Boolean)
          : undefined,
      };

      await onSubmit(eventData);
      showToast({
        message: event ? 'Événement modifié avec succès' : 'Événement ajouté avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: event ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout',
        type: 'error',
      });
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Titre <span className="text-danger">*</span>
        </label>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Titre de l'événement"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Select
          label="Type"
          options={EVENT_TYPES}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: (e.target.value || 'meeting') as DayEvent['type'] })}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de l'événement"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Date de fin (optionnel)
          </label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Heure
          </label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Select
          label="Couleur"
          options={COLORS}
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Lieu
        </label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Lieu de l'événement"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Participants (séparés par des virgules)
        </label>
        <Input
          type="text"
          value={formData.attendees}
          onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
          placeholder="Jean Dupont, Marie Martin"
          disabled={loading}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
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
          {loading ? 'Enregistrement...' : event ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
}
