/**
 * Automation Rules List Component
 * 
 * Displays and manages automation rules.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Badge, Input, Switch, useToast, Modal } from '@/components/ui';
import { Plus, Search, Zap, Trash2, Edit2, Loader2, Sparkles, FileText, CheckCircle, XCircle } from 'lucide-react';
import { AutomationRuleForm } from './AutomationRuleForm';
import { automationAPI, type AutomationRule, type CreateAutomationRuleRequest, type UpdateAutomationRuleRequest, type AutomationRuleExecutionLog } from '@/lib/api/automation';

export interface AutomationRulesListProps {
  rules: AutomationRule[];
  isLoading: boolean;
  error: Error | null;
  onCreate: (rule: CreateAutomationRuleRequest) => void;
  onUpdate: (id: number, rule: UpdateAutomationRuleRequest) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
  onRefresh?: () => void;
}

export function AutomationRulesList({
  rules,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
  onRefresh,
}: AutomationRulesListProps) {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleForLogs, setSelectedRuleForLogs] = useState<AutomationRule | null>(null);

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
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
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
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-muted-foreground">Exécutions:</span>
                          <span className="ml-2 font-medium">{rule.trigger_count} fois</span>
                        </div>
                        {rule.trigger_count > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRuleForLogs(rule)}
                            className="h-7 text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Voir les logs
                          </Button>
                        )}
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
                      aria-label="Modifier la règle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      aria-label="Supprimer la règle"
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

      {/* Logs Modal */}
      {selectedRuleForLogs && (
        <AutomationRuleLogsModal
          rule={selectedRuleForLogs}
          onClose={() => setSelectedRuleForLogs(null)}
        />
      )}
    </>
  );
}

/**
 * Modal component for displaying automation rule execution logs
 */
function AutomationRuleLogsModal({
  rule,
  onClose,
}: {
  rule: AutomationRule;
  onClose: () => void;
}) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['automation-rules', rule.id, 'logs'],
    queryFn: () => automationAPI.getAutomationRuleLogs(String(rule.id), 100),
    enabled: !!rule,
  });

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const successCount = logs.filter(log => log.success).length;
  const failureCount = logs.filter(log => !log.success).length;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Logs d'exécution - ${rule.name}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{logs.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-muted-foreground">Réussies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failureCount}</div>
            <div className="text-xs text-muted-foreground">Échouées</div>
          </div>
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun log d'exécution disponible</p>
            <p className="text-sm mt-2">Les logs apparaîtront ici après la première exécution</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <Card
                key={log.id}
                className={`p-4 border-l-4 ${
                  log.success ? 'border-l-green-500' : 'border-l-red-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {log.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${
                          log.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.success ? 'Exécution réussie' : 'Exécution échouée'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.executed_at)}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                      )}
                      {log.execution_data && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Détails d'exécution
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.execution_data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
