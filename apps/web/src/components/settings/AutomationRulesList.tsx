/**
 * Automation Rules List Component
 * 
 * Displays and manages automation rules.
 */

'use client';

import { useState } from 'react';
import { Button, Card, Badge, Input, Switch, useToast } from '@/components/ui';
import { Plus, Search, Zap, Trash2, Edit2, Loader2, Sparkles } from 'lucide-react';
import { AutomationRuleForm } from './AutomationRuleForm';
import { automationAPI, type AutomationRule, type CreateAutomationRuleRequest, type UpdateAutomationRuleRequest } from '@/lib/api/automation';

export interface AutomationRulesListProps {
  rules: AutomationRule[];
  isLoading: boolean;
  error: Error | null;
  onCreate: (rule: CreateAutomationRuleRequest) => void;
  onUpdate: (id: number, rule: UpdateAutomationRuleRequest) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}

export function AutomationRulesList({
  rules,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
}: AutomationRulesListProps) {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = rules.filter((rule) => {
    return rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.trigger_event.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle d\'automatisation ?')) {
      onDelete(id);
    }
  };

  const handleToggle = (id: number, enabled: boolean) => {
    onToggle(id, enabled);
  };

  const handleInitializeDefault = async () => {
    try {
      await automationAPI.initializeDefaultRule();
      showToast({ 
        message: 'Automatisation Pipeline → Tâche activée avec succès ! Une tâche sera créée automatiquement lorsqu\'une opportunité passe dans le stage "Proposition à faire".', 
        type: 'success' 
      });
      // Refresh the list
      window.location.reload();
    } catch (error) {
      showToast({ 
        message: 'Erreur lors de l\'activation de l\'automatisation', 
        type: 'error' 
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Erreur lors du chargement des règles</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une règle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>

        {/* Rules list */}
        {isLoading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          </Card>
        ) : filteredRules.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {rules.length === 0 ? 'Aucune règle d\'automatisation' : 'Aucune règle ne correspond à votre recherche'}
              </p>
              {rules.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Activez l'automatisation pour créer automatiquement une tâche lorsqu'une opportunité passe dans le stage "Proposition à faire" du pipeline MAIN.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleInitializeDefault}
                    className="mt-4"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Activer l'automatisation Pipeline → Tâche
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRules.map((rule) => (
              <Card key={rule.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{rule.name}</h3>
                      {rule.enabled ? (
                        <Badge variant="success">Activée</Badge>
                      ) : (
                        <Badge variant="default">Désactivée</Badge>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mb-4">{rule.description}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Déclencheur:</span>
                        <span className="ml-2 font-medium">
                          {rule.trigger_event === 'opportunity.stage_changed' 
                            ? 'Changement de stage d\'opportunité' 
                            : rule.trigger_event}
                        </span>
                      </div>
                      {rule.trigger_conditions && Object.keys(rule.trigger_conditions).length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Conditions:</span>
                          <span className="ml-2 font-medium">
                            {Object.entries(rule.trigger_conditions).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Actions:</span>
                        <span className="ml-2 font-medium">
                          {rule.actions.map((a) => {
                            if (a.type === 'task.create') {
                              return 'Créer une tâche';
                            }
                            return a.type;
                          }).join(', ')}
                        </span>
                      </div>
                      {rule.last_triggered_at && (
                        <div>
                          <span className="text-muted-foreground">Dernière exécution:</span>
                          <span className="ml-2 font-medium">{formatDate(rule.last_triggered_at)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Exécutions:</span>
                        <span className="ml-2 font-medium">{rule.trigger_count} fois</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Créée le:</span>
                        <span className="ml-2 font-medium">{formatDate(rule.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={rule.enabled}
                      onChange={(e) => handleToggle(rule.id, e.target.checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRule) && (
        <AutomationRuleForm
          rule={editingRule}
          onSave={(ruleData) => {
            if (editingRule) {
              onUpdate(editingRule.id, ruleData as UpdateAutomationRuleRequest);
            } else {
              onCreate(ruleData as CreateAutomationRuleRequest);
            }
            setShowCreateModal(false);
            setEditingRule(null);
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingRule(null);
          }}
        />
      )}
    </>
  );
}
