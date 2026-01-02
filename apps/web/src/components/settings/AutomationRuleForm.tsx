/**
 * Automation Rule Form Component
 * 
 * Form for creating and editing automation rules.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select, Modal } from '@/components/ui';
import type { AutomationRule, CreateAutomationRuleRequest } from '@/lib/api/automation';

export interface AutomationRuleFormProps {
  rule?: AutomationRule | null;
  onSave: (rule: CreateAutomationRuleRequest | UpdateAutomationRuleRequest) => void;
  onCancel: () => void;
}

const triggerEventOptions = [
  { value: 'opportunity.stage_changed', label: 'Opportunité change de stage' },
  { value: 'user.created', label: 'Utilisateur créé' },
  { value: 'user.updated', label: 'Utilisateur modifié' },
  { value: 'project.created', label: 'Projet créé' },
  { value: 'project.updated', label: 'Projet modifié' },
  { value: 'client.created', label: 'Client créé' },
  { value: 'client.updated', label: 'Client modifié' },
  { value: 'invoice.created', label: 'Facture créée' },
  { value: 'invoice.paid', label: 'Facture payée' },
  { value: 'task.created', label: 'Tâche créée' },
  { value: 'task.completed', label: 'Tâche complétée' },
  { value: 'task.assigned', label: 'Tâche assignée' },
];

const actionTypeOptions = [
  { value: 'email.send', label: 'Envoyer un email' },
  { value: 'notification.send', label: 'Envoyer une notification' },
  { value: 'task.create', label: 'Créer une tâche' },
  { value: 'project.create', label: 'Créer un projet' },
  { value: 'webhook.call', label: 'Appeler un webhook' },
];

export function AutomationRuleForm({ rule, onSave, onCancel }: AutomationRuleFormProps) {
  const [formData, setFormData] = useState<CreateAutomationRuleRequest>({
    name: '',
    description: '',
    enabled: true,
    trigger_event: '',
    trigger_conditions: {},
    actions: [
      {
        type: '',
        config: {},
      },
    ],
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        enabled: rule.enabled,
        trigger_event: rule.trigger_event,
        trigger_conditions: rule.trigger_conditions || {},
        actions: rule.actions,
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.trigger_event || formData.actions.length === 0) {
      return;
    }
    onSave(formData);
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: '', config: {} }],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, type: string) => {
    const newActions = [...formData.actions];
    const existingAction = newActions[index];
    if (existingAction) {
      newActions[index] = { ...existingAction, type, config: existingAction.config || {} };
      setFormData({ ...formData, actions: newActions });
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={rule ? 'Modifier la règle d\'automatisation' : 'Nouvelle règle d\'automatisation'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de la règle"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ex: Notifier nouveau client"
        />

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description optionnelle"
        />

        <Select
          label="Événement déclencheur"
          value={formData.trigger_event}
          onChange={(e) =>
            setFormData({
              ...formData,
              trigger_event: e.target.value,
            })
          }
          options={triggerEventOptions}
          required
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Actions
          </label>
          <div className="space-y-2">
            {formData.actions.map((action, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={action.type}
                  onChange={(e) => updateAction(index, e.target.value)}
                  options={actionTypeOptions}
                  className="flex-1"
                  required
                />
                {formData.actions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAction}
            >
              + Ajouter une action
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            {rule ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
