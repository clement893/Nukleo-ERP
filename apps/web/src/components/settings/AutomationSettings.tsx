/**
 * Automation Settings Component
 * 
 * Main component for managing automation rules and scheduled tasks.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Tabs from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { ScheduledTasksList } from './ScheduledTasksList';
import { AutomationRulesList } from './AutomationRulesList';
import { AutomationTemplates } from './AutomationTemplates';
import { automationAPI, type ScheduledTask, type AutomationRule } from '@/lib/api/automation';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import { Zap, Clock, Sparkles } from 'lucide-react';

export default function AutomationSettings() {
  const [activeTab, setActiveTab] = useState<'rules' | 'tasks' | 'templates'>('tasks');
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduled tasks
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['automation', 'scheduled-tasks'],
    queryFn: () => automationAPI.getScheduledTasks(),
  });

  // Fetch automation rules
  const { data: rules = [], isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['automation', 'rules'],
    queryFn: () => automationAPI.getAutomationRules(),
    retry: false, // Don't retry if endpoint doesn't exist
  });

  // Mutations for scheduled tasks
  const createTaskMutation = useMutation({
    mutationFn: (task: Parameters<typeof automationAPI.createScheduledTask>[0]) =>
      automationAPI.createScheduledTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'scheduled-tasks'] });
      showToast({ message: 'Tâche planifiée créée avec succès', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to create scheduled task', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la création de la tâche',
        type: 'error',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof automationAPI.updateScheduledTask>[1] }) =>
      automationAPI.updateScheduledTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'scheduled-tasks'] });
      showToast({ message: 'Tâche planifiée mise à jour avec succès', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to update scheduled task', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la mise à jour de la tâche',
        type: 'error',
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => automationAPI.deleteScheduledTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'scheduled-tasks'] });
      showToast({ message: 'Tâche planifiée supprimée avec succès', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to delete scheduled task', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la suppression de la tâche',
        type: 'error',
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: number) => automationAPI.toggleScheduledTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'scheduled-tasks'] });
      showToast({ message: 'Statut de la tâche mis à jour', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to toggle scheduled task', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la modification du statut',
        type: 'error',
      });
    },
  });

  // Mutations for automation rules
  const createRuleMutation = useMutation({
    mutationFn: (rule: Parameters<typeof automationAPI.createAutomationRule>[0]) =>
      automationAPI.createAutomationRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
      showToast({ message: 'Règle d\'automatisation créée avec succès', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to create automation rule', error);
      const errorMessage = getErrorMessage(error);
      showToast({
        message: errorMessage || 'Erreur lors de la création de la règle',
        type: 'error',
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof automationAPI.updateAutomationRule>[1] }) =>
      automationAPI.updateAutomationRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
      showToast({ message: 'Règle d\'automatisation mise à jour avec succès', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to update automation rule', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la mise à jour de la règle',
        type: 'error',
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => automationAPI.deleteAutomationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
      showToast({ message: 'Règle d\'automatisation supprimée avec succès', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to delete automation rule', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la suppression de la règle',
        type: 'error',
      });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      automationAPI.toggleAutomationRule(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
      showToast({ message: 'Statut de la règle mis à jour', type: 'success' });
    },
    onError: (error: unknown) => {
      logger.error('Failed to toggle automation rule', error);
      showToast({
        message: getErrorMessage(error) || 'Erreur lors de la modification du statut',
        type: 'error',
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary-500/10">
            <Zap className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Automatisation</h2>
            <p className="text-sm text-muted-foreground">
              Créez et gérez des automatisations pour automatiser vos workflows
            </p>
          </div>
        </div>

        <Tabs
          tabs={[
            {
              id: 'tasks',
              label: 'Tâches planifiées',
              icon: <Clock className="w-4 h-4" />,
              content: (
                <ScheduledTasksList
                  tasks={tasks}
                  isLoading={tasksLoading}
                  error={tasksError}
                  onCreate={createTaskMutation.mutate}
                  onUpdate={updateTaskMutation.mutate}
                  onDelete={deleteTaskMutation.mutate}
                  onToggle={toggleTaskMutation.mutate}
                />
              ),
            },
            {
              id: 'rules',
              label: 'Règles d\'automatisation',
              icon: <Zap className="w-4 h-4" />,
              content: (
                <AutomationRulesList
                  rules={rules}
                  isLoading={rulesLoading}
                  error={rulesError}
                  onCreate={createRuleMutation.mutate}
                  onUpdate={updateRuleMutation.mutate}
                  onDelete={deleteRuleMutation.mutate}
                  onToggle={toggleRuleMutation.mutate}
                />
              ),
            },
            {
              id: 'templates',
              label: 'Templates',
              icon: <Sparkles className="w-4 h-4" />,
              content: (
                <AutomationTemplates
                  onApplyTemplate={(template) => {
                    // Apply template logic
                    if (template.type === 'task') {
                      createTaskMutation.mutate(template.data as any);
                    } else if (template.type === 'rule') {
                      createRuleMutation.mutate(template.data as any);
                    }
                  }}
                />
              ),
            },
          ]}
          defaultTab={activeTab}
          onValueChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
        />
      </Card>
    </div>
  );
}
