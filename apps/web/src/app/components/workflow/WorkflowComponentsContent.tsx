/**
 * Workflow Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import {
  WorkflowBuilder,
  AutomationRules,
  TriggerManager,
  type AutomationRule,
  type Trigger,
} from '@/components/workflow';
import { logger } from '@/lib/logger';
import { useState } from 'react';

export default function WorkflowComponentsContent() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Welcome Email',
      description: 'Send welcome email when user signs up',
      enabled: true,
      trigger: {
        event: 'user.created',
      },
      actions: [
        { type: 'email.send', config: { template: 'welcome' } },
      ],
      createdAt: '2024-01-15T10:00:00Z',
      lastTriggered: '2024-03-20T14:30:00Z',
      triggerCount: 45,
    },
    {
      id: '2',
      name: 'Payment Notification',
      description: 'Notify team when payment is received',
      enabled: true,
      trigger: {
        event: 'payment.received',
      },
      actions: [
        { type: 'notification.send', config: { channel: 'slack' } },
      ],
      createdAt: '2024-02-01T10:00:00Z',
      triggerCount: 12,
    },
  ]);

  const [triggers, setTriggers] = useState<Trigger[]>([
    {
      id: '1',
      name: 'User Created Event',
      type: 'event' as const,
      event: 'user.created',
      enabled: true,
      workflows: ['workflow-1', 'workflow-2'],
      lastTriggered: '2024-03-20T14:30:00Z',
      triggerCount: 45,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Daily Report',
      type: 'schedule' as const,
      schedule: '0 9 * * *',
      enabled: true,
      workflows: ['workflow-3'],
      triggerCount: 30,
      createdAt: '2024-02-01T10:00:00Z',
    },
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Workflow"
        description="Composants pour la création de workflows, règles d'automatisation et gestion des déclencheurs"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Workflow' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Workflow Builder">
          <div className="max-w-6xl">
            <WorkflowBuilder
              workflow={{
                name: 'User Onboarding',
                description: 'Automated user onboarding workflow',
                enabled: true,
                nodes: [
                  {
                    id: 'trigger-1',
                    type: 'trigger',
                    label: 'User Created',
                    config: { event: 'user.created' },
                  },
                  {
                    id: 'action-1',
                    type: 'action',
                    label: 'Send Welcome Email',
                    config: { action: 'email.send' },
                  },
                ],
                connections: [{ from: 'trigger-1', to: 'action-1' }],
              }}
              onSave={async (workflow) => {
                logger.info('Workflow saved:', { workflow });
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
              onTest={async (workflow) => {
                logger.info('Testing workflow:', { workflow });
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }}
            />
          </div>
        </Section>

        <Section title="Automation Rules">
          <div className="max-w-4xl">
            <AutomationRules
              rules={automationRules}
              onCreate={async (rule) => {
                logger.info('Rule created:', { rule });
                const newRule = {
                  ...rule,
                  description: rule.description || '',
                  id: String(Date.now()),
                  createdAt: new Date().toISOString(),
                  triggerCount: 0,
                };
                setAutomationRules([...automationRules, newRule]);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return newRule;
              }}
              onUpdate={async (id, rule) => {
                logger.info('Rule updated:', { id, rule });
                setAutomationRules(
                  automationRules.map((r) => (r.id === id ? { ...r, ...rule } : r))
                );
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
              onDelete={async (id) => {
                logger.info('Rule deleted:', { id });
                setAutomationRules(automationRules.filter((r) => r.id !== id));
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
              onToggle={async (id, enabled) => {
                logger.info('Rule toggled:', { id, enabled });
                setAutomationRules(
                  automationRules.map((r) => (r.id === id ? { ...r, enabled } : r))
                );
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
            />
          </div>
        </Section>

        <Section title="Trigger Manager">
          <div className="max-w-4xl">
            <TriggerManager
              triggers={triggers}
              onCreate={async (trigger) => {
                logger.info('Trigger created:', { trigger });
                const newTrigger = {
                  ...trigger,
                  id: String(Date.now()),
                  createdAt: new Date().toISOString(),
                  triggerCount: 0,
                };
                setTriggers([...triggers, newTrigger]);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return newTrigger;
              }}
              onUpdate={async (id, trigger) => {
                logger.info('Trigger updated:', { id, trigger });
                setTriggers(triggers.map((t) => (t.id === id ? { ...t, ...trigger } : t)));
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
              onDelete={async (id) => {
                logger.info('Trigger deleted:', { id });
                setTriggers(triggers.filter((t) => t.id !== id));
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
              onToggle={async (id, enabled) => {
                logger.info('Trigger toggled:', { id, enabled });
                setTriggers(triggers.map((t) => (t.id === id ? { ...t, enabled } : t)));
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
            />
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

