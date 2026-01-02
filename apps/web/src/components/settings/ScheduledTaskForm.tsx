/**
 * Scheduled Task Form Component
 * 
 * Form for creating and editing scheduled tasks.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Modal } from '@/components/ui';
import type { ScheduledTask, CreateScheduledTaskRequest } from '@/lib/api/automation';

export interface ScheduledTaskFormProps {
  task?: ScheduledTask | null;
  onSave: (task: CreateScheduledTaskRequest) => void;
  onCancel: () => void;
}

export function ScheduledTaskForm({ task, onSave, onCancel }: ScheduledTaskFormProps) {
  const [formData, setFormData] = useState<CreateScheduledTaskRequest>({
    name: '',
    description: '',
    task_type: 'email',
    scheduled_at: new Date().toISOString().slice(0, 16),
    recurrence: null,
    recurrence_config: null,
    task_data: null,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        task_type: task.task_type,
        scheduled_at: task.scheduled_at.slice(0, 16),
        recurrence: task.recurrence || null,
        recurrence_config: task.recurrence_config || null,
        task_data: task.task_data || null,
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onSave({
      ...formData,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={task ? 'Modifier la tâche planifiée' : 'Nouvelle tâche planifiée'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de la tâche"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ex: Rapport mensuel"
        />

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description optionnelle"
        />

        <Select
          label="Type de tâche"
          value={formData.task_type}
          onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
          options={[
            { value: 'email', label: 'Email' },
            { value: 'report', label: 'Rapport' },
            { value: 'sync', label: 'Synchronisation' },
            { value: 'custom', label: 'Personnalisé' },
          ]}
          required
        />

        <Input
          label="Date et heure d'exécution"
          type="datetime-local"
          value={formData.scheduled_at}
          onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
          required
        />

        <Select
          label="Récurrence"
          value={formData.recurrence || ''}
          onChange={(e) => setFormData({ ...formData, recurrence: e.target.value || null })}
          options={[
            { value: '', label: 'Une seule fois' },
            { value: 'daily', label: 'Quotidien' },
            { value: 'weekly', label: 'Hebdomadaire' },
            { value: 'monthly', label: 'Mensuel' },
          ]}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            {task ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
