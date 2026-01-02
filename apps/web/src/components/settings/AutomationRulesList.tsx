/**
 * Automation Rules List Component
 * 
 * Displays and manages automation rules.
 */

'use client';

import { useState } from 'react';
import { Button, Card, Badge, Input, Switch, useToast } from '@/components/ui';
import { Plus, Search, Zap, Trash2, Edit2, Loader2 } from 'lucide-react';
import { AutomationRuleForm } from './AutomationRuleForm';
import type { AutomationRule, CreateAutomationRuleRequest, UpdateAutomationRuleRequest } from '@/lib/api/automation';

export interface AutomationRulesListProps {
  rules: AutomationRule[];
  isLoading: boolean;
  error: Error | null;
  onCreate: (rule: CreateAutomationRuleRequest) => void;
  onUpdate: (id: string, rule: UpdateAutomationRuleRequest) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const filteredRules = rules.filter((rule) => {
    return rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.trigger.event.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle d\'automatisation ?')) {
      onDelete(id);
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    onToggle(id, enabled);
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

  // Check if automation rules endpoint is available
  const endpointAvailable = !error || !error.message.includes('not available');

  if (!endpointAvailable) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Règles d'automatisation</h3>
          <p className="text-muted-foreground mb-4">
            Les règles d'automatisation seront bientôt disponibles.
          </p>
          <p className="text-sm text-muted-foreground">
            En attendant, vous pouvez utiliser les tâches planifiées pour automatiser vos workflows.
          </p>
        </div>
      </Card>
    );
  }

  if (error && endpointAvailable) {
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
              <p className="text-muted-foreground">
                {rules.length === 0 ? 'Aucune règle d\'automatisation' : 'Aucune règle ne correspond à votre recherche'}
              </p>
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
                        <span className="ml-2 font-medium">{rule.trigger.event}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actions:</span>
                        <span className="ml-2 font-medium">
                          {rule.actions.map((a) => a.type).join(', ')}
                        </span>
                      </div>
                      {rule.lastTriggered && (
                        <div>
                          <span className="text-muted-foreground">Dernière exécution:</span>
                          <span className="ml-2 font-medium">{formatDate(rule.lastTriggered)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Exécutions:</span>
                        <span className="ml-2 font-medium">{rule.triggerCount} fois</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Créée le:</span>
                        <span className="ml-2 font-medium">{formatDate(rule.createdAt)}</span>
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
              onUpdate(editingRule.id, ruleData);
            } else {
              onCreate(ruleData);
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
