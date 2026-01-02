/**
 * Automation Templates Component
 * 
 * Displays and applies automation templates.
 */

'use client';

import { Button, Card } from '@/components/ui';
import { Sparkles, Mail, FileText, Users, Calendar } from 'lucide-react';
import type { CreateScheduledTaskRequest, CreateAutomationRuleRequest } from '@/lib/api/automation';

export interface AutomationTemplatesProps {
  onApplyTemplate: (template: {
    type: 'task' | 'rule';
    data: CreateScheduledTaskRequest | CreateAutomationRuleRequest;
  }) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'task' | 'rule';
  data: CreateScheduledTaskRequest | CreateAutomationRuleRequest;
}

const templates: Template[] = [
  {
    id: 'monthly-report',
    name: 'Rapport mensuel automatique',
    description: 'Génère et envoie un rapport mensuel le premier jour de chaque mois',
    icon: <FileText className="w-6 h-6" />,
    type: 'task',
    data: {
      name: 'Rapport mensuel automatique',
      description: 'Génère et envoie un rapport mensuel',
      task_type: 'report',
      scheduled_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      recurrence: 'monthly',
      task_data: {
        report_type: 'monthly',
        recipients: [],
      },
    } as CreateScheduledTaskRequest,
  },
  {
    id: 'invoice-reminder',
    name: 'Rappel d\'échéance de facture',
    description: 'Envoie un email de rappel 7 jours avant l\'échéance d\'une facture',
    icon: <Mail className="w-6 h-6" />,
    type: 'rule',
    data: {
      name: 'Rappel d\'échéance de facture',
      description: 'Envoie un email de rappel 7 jours avant l\'échéance',
      enabled: true,
      trigger_event: 'invoice.created',
      trigger_conditions: {},
      actions: [
        {
          type: 'email.send',
          config: {
            template: 'invoice_reminder',
            days_before: 7,
          },
        },
      ],
    } as CreateAutomationRuleRequest,
  },
  {
    id: 'welcome-client',
    name: 'Bienvenue nouveau client',
    description: 'Envoie un email de bienvenue lorsqu\'un nouveau client est créé',
    icon: <Users className="w-6 h-6" />,
    type: 'rule',
    data: {
      name: 'Bienvenue nouveau client',
      description: 'Email de bienvenue pour les nouveaux clients',
      enabled: true,
      trigger_event: 'client.created',
      trigger_conditions: {},
      actions: [
        {
          type: 'email.send',
          config: {
            template: 'welcome_client',
          },
        },
      ],
    } as CreateAutomationRuleRequest,
  },
  {
    id: 'task-assigned-notification',
    name: 'Notification de tâche assignée',
    description: 'Notifie l\'utilisateur lorsqu\'une tâche lui est assignée',
    icon: <Calendar className="w-6 h-6" />,
    type: 'rule',
    data: {
      name: 'Notification de tâche assignée',
      description: 'Notifie l\'utilisateur lorsqu\'une tâche lui est assignée',
      enabled: true,
      trigger_event: 'task.assigned',
      trigger_conditions: {},
      actions: [
        {
          type: 'notification.send',
          config: {
            type: 'task_assigned',
          },
        },
      ],
    } as CreateAutomationRuleRequest,
  },
  {
    id: 'weekly-team-report',
    name: 'Rapport hebdomadaire d\'équipe',
    description: 'Génère un rapport d\'activité hebdomadaire chaque lundi',
    icon: <FileText className="w-6 h-6" />,
    type: 'task',
    data: {
      name: 'Rapport hebdomadaire d\'équipe',
      description: 'Rapport d\'activité hebdomadaire',
      task_type: 'report',
      scheduled_at: new Date().toISOString(),
      recurrence: 'weekly',
      recurrence_config: {
        day_of_week: 1, // Monday
      },
      task_data: {
        report_type: 'weekly',
        recipients: [],
      },
    } as CreateScheduledTaskRequest,
  },
];

export function AutomationTemplates({ onApplyTemplate }: AutomationTemplatesProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Templates d'automatisation</h3>
        <p className="text-muted-foreground">
          Utilisez ces templates pour démarrer rapidement avec vos automatisations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500">
                {template.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">{template.name}</h4>
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyTemplate({ type: template.type, data: template.data })}
                >
                  Appliquer ce template
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
