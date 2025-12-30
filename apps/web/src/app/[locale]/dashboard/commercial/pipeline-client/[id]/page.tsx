'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Modal, Input, Select, Alert, Loading } from '@/components/ui';
import KanbanBoard, { type KanbanCard, type KanbanColumn } from '@/components/ui/KanbanBoard';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Settings, ArrowLeft, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';

// Types temporaires - à remplacer par les types générés depuis l'API
interface Pipeline {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
}

interface Opportunite {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  probability?: number;
  expected_close_date?: string;
  pipeline_id: string;
  stage_id?: string;
  contact_id?: string;
  company_id?: string;
  assigned_to_id?: string;
}

function PipelineDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const pipelineId = params.id as string;
  
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null);
  
  // Modals
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showStagesManager, setShowStagesManager] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunite | null>(null);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [selectedStageStatus, setSelectedStageStatus] = useState<string | null>(null);

  // Form states
  const [opportunityForm, setOpportunityForm] = useState({
    name: '',
    description: '',
    amount: '',
    probability: '',
    expected_close_date: '',
    contact_id: '',
    company_id: '',
    assigned_to_id: '',
  });
  const [stageForm, setStageForm] = useState({ name: '', description: '', color: '#3B82F6', order: 0 });

  // Convert opportunities to Kanban cards
  const kanbanCards: KanbanCard[] = useMemo(() => {
    if (!pipeline) return [];
    
    return opportunities
      .filter(opp => opp.pipeline_id === pipelineId)
      .map(opp => ({
        id: opp.id,
        title: opp.name,
        description: opp.description,
        status: opp.stage_id || '',
        priority: opp.probability && opp.probability >= 70 ? 'high' : opp.probability && opp.probability >= 40 ? 'medium' : 'low',
        dueDate: opp.expected_close_date ? new Date(opp.expected_close_date) : undefined,
        tags: opp.amount ? [`$${opp.amount.toLocaleString('en-US')}`] : [],
        // Store amount in data for total calculation
        data: {
          amount: opp.amount || 0,
        },
      }));
  }, [opportunities, pipeline, pipelineId]);

  // Convert stages to Kanban columns
  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    if (!pipeline) return [];
    
    return pipeline.stages
      .sort((a, b) => a.order - b.order)
      .map(stage => ({
        id: stage.id,
        title: stage.name,
        status: stage.id,
        color: stage.color || '#3B82F6',
      }));
  }, [pipeline]);

  // Load pipeline (mock data pour l'instant)
  useEffect(() => {
    // TODO: Remplacer par un appel API réel
    setLoading(true);
    setTimeout(() => {
      const mockPipeline: Pipeline = {
        id: pipelineId,
        name: 'Pipeline Ventes',
        description: 'Pipeline principal pour les ventes',
        is_default: true,
        is_active: true,
        stages: [
          { id: 'stage-1', name: 'Prospection', description: '', color: '#EF4444', order: 0 },
          { id: 'stage-2', name: 'Qualification', description: '', color: '#F59E0B', order: 1 },
          { id: 'stage-3', name: 'Proposition', description: '', color: '#3B82F6', order: 2 },
          { id: 'stage-4', name: 'Négociation', description: '', color: '#8B5CF6', order: 3 },
          { id: 'stage-5', name: 'Fermeture', description: '', color: '#10B981', order: 4 },
        ],
      };
      setPipeline(mockPipeline);
      setLoading(false);
    }, 500);
  }, [pipelineId]);

  // Load opportunities (mock data pour l'instant)
  useEffect(() => {
    if (!pipelineId) return;
    
    // TODO: Remplacer par un appel API réel
    setTimeout(() => {
      const mockOpportunities: Opportunite[] = [
        {
          id: 'opp-1',
          name: 'Nouveau client potentiel',
          description: 'Client intéressé par nos services',
          amount: 50000,
          probability: 60,
          pipeline_id: pipelineId,
          stage_id: 'stage-2',
        },
        {
          id: 'opp-2',
          name: 'Renouvellement contrat',
          description: 'Renouvellement annuel',
          amount: 30000,
          probability: 80,
          pipeline_id: pipelineId,
          stage_id: 'stage-4',
        },
      ];
      setOpportunities(mockOpportunities);
    }, 300);
  }, [pipelineId]);

  const handleBack = () => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/pipeline-client`);
  };

  const handleCardMove = async (cardId: string, newStatus: string) => {
    // TODO: Appel API pour mettre à jour le stage_id de l'opportunité
    setOpportunities(prev => 
      prev.map(opp => 
        opp.id === cardId ? { ...opp, stage_id: newStatus } : opp
      )
    );
    showToast({
      message: 'Opportunité déplacée avec succès',
      type: 'success',
    });
  };

  const handleCardClick = (card: KanbanCard) => {
    const opportunity = opportunities.find(opp => opp.id === card.id);
    if (opportunity) {
      setEditingOpportunity(opportunity);
      setSelectedStageStatus(opportunity.stage_id || null);
      setOpportunityForm({
        name: opportunity.name,
        description: opportunity.description || '',
        amount: opportunity.amount?.toString() || '',
        probability: opportunity.probability?.toString() || '',
        expected_close_date: opportunity.expected_close_date || '',
        contact_id: opportunity.contact_id || '',
        company_id: opportunity.company_id || '',
        assigned_to_id: opportunity.assigned_to_id || '',
      });
      setShowOpportunityModal(true);
    }
  };

  const handleCardAdd = (status: string) => {
    setSelectedStageStatus(status);
    setOpportunityForm({
      name: '',
      description: '',
      amount: '',
      probability: '',
      expected_close_date: '',
      contact_id: '',
      company_id: '',
      assigned_to_id: '',
    });
    setEditingOpportunity(null);
    setShowOpportunityModal(true);
  };

  const handleSaveOpportunity = async () => {
    if (!pipelineId) return;
    
    // TODO: Appel API pour créer/modifier l'opportunité
    if (editingOpportunity) {
      // Update
      setOpportunities(prev => prev.map(opp => 
        opp.id === editingOpportunity.id 
          ? {
              ...opp,
              name: opportunityForm.name,
              description: opportunityForm.description,
              amount: opportunityForm.amount ? parseFloat(opportunityForm.amount) : undefined,
              probability: opportunityForm.probability ? parseInt(opportunityForm.probability) : undefined,
              expected_close_date: opportunityForm.expected_close_date || undefined,
              stage_id: selectedStageStatus || opp.stage_id,
            }
          : opp
      ));
      showToast({ message: 'Opportunité modifiée avec succès', type: 'success' });
    } else {
      // Create
      const newOpportunity: Opportunite = {
        id: Date.now().toString(),
        name: opportunityForm.name,
        description: opportunityForm.description,
        amount: opportunityForm.amount ? parseFloat(opportunityForm.amount) : undefined,
        probability: opportunityForm.probability ? parseInt(opportunityForm.probability) : undefined,
        expected_close_date: opportunityForm.expected_close_date || undefined,
        pipeline_id: pipelineId,
        stage_id: selectedStageStatus || undefined,
        contact_id: opportunityForm.contact_id || undefined,
        company_id: opportunityForm.company_id || undefined,
        assigned_to_id: opportunityForm.assigned_to_id || undefined,
      };
      setOpportunities(prev => [...prev, newOpportunity]);
      showToast({ message: 'Opportunité créée avec succès', type: 'success' });
    }
    setShowOpportunityModal(false);
    setSelectedStageStatus(null);
  };

  const handleDeleteOpportunity = async () => {
    if (!editingOpportunity) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      return;
    }

    try {
      setDeletingOpportunityId(editingOpportunity.id);
      await opportunitiesAPI.delete(editingOpportunity.id);
      setOpportunities(prev => prev.filter(opp => opp.id !== editingOpportunity.id));
      showToast({ 
        message: 'Opportunité supprimée avec succès', 
        type: 'success' 
      });
      setShowOpportunityModal(false);
      setEditingOpportunity(null);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setDeletingOpportunityId(null);
    }
  };

  const handleManageStages = () => {
    setShowStagesManager(true);
  };

  const handleAddStage = () => {
    if (!pipeline) return;
    setEditingStage(null);
    setStageForm({ name: '', description: '', color: '#3B82F6', order: pipeline.stages.length });
    setShowStageModal(true);
  };

  const handleEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      description: stage.description || '',
      color: stage.color || '#3B82F6',
      order: stage.order,
    });
    setShowStageModal(true);
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!pipeline) return;
    
    // Vérifier si des opportunités utilisent cette étape
    const hasOpportunities = opportunities.some(opp => opp.stage_id === stageId);
    if (hasOpportunities) {
      showToast({
        message: 'Impossible de supprimer cette étape car des opportunités l\'utilisent',
        type: 'error',
      });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
      return;
    }

    // TODO: Appel API pour supprimer le stage
    setPipeline(prev => prev ? {
      ...prev,
      stages: prev.stages.filter(s => s.id !== stageId).map((s, idx) => ({ ...s, order: idx }))
    } : null);
    
    showToast({ message: 'Étape supprimée avec succès', type: 'success' });
  };

  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    if (!pipeline) return;
    
    const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);
    const index = stages.findIndex(s => s.id === stageId);
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = stages[index];
    const swap = stages[newIndex];
    if (temp && swap) {
      stages[index] = swap;
      stages[newIndex] = temp;
    }
    
    // Réorganiser les ordres
    const reorderedStages = stages.map((s, idx) => ({ ...s, order: idx }));
    
    // TODO: Appel API pour mettre à jour l'ordre des stages
    setPipeline(prev => prev ? { ...prev, stages: reorderedStages } : null);
    
    showToast({ message: 'Ordre des étapes mis à jour', type: 'success' });
  };

  const handleSaveStage = async () => {
    if (!pipeline) return;
    
    // TODO: Appel API pour créer/modifier le stage
    if (editingStage) {
      // Update
      setPipeline(prev => prev ? {
        ...prev,
        stages: prev.stages.map(s => 
          s.id === editingStage.id 
            ? {
                ...s,
                name: stageForm.name,
                description: stageForm.description,
                color: stageForm.color,
                order: stageForm.order,
              }
            : s
        )
      } : null);
      showToast({ message: 'Étape modifiée avec succès', type: 'success' });
    } else {
      // Create
      const newStage: PipelineStage = {
        id: Date.now().toString(),
        name: stageForm.name,
        description: stageForm.description,
        color: stageForm.color,
        order: stageForm.order,
      };
      
      setPipeline(prev => prev ? { ...prev, stages: [...prev.stages, newStage] } : null);
      showToast({ message: 'Étape ajoutée avec succès', type: 'success' });
    }
    
    setShowStageModal(false);
    setEditingStage(null);
  };

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Pipeline"
          description="Chargement..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Commercial', href: '/dashboard/commercial' },
            { label: 'Pipelines', href: '/dashboard/commercial/pipeline-client' },
            { label: 'Pipeline' },
          ]}
        />
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      </MotionDiv>
    );
  }

  if (!pipeline) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Pipeline"
          description="Pipeline non trouvé"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Commercial', href: '/dashboard/commercial' },
            { label: 'Pipelines', href: '/dashboard/commercial/pipeline-client' },
            { label: 'Pipeline' },
          ]}
        />
        <Card>
          <div className="p-6 text-center text-muted-foreground">
            Pipeline non trouvé
          </div>
        </Card>
      </MotionDiv>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -my-6">
      {/* Header fixe en haut */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pipeline.name}</h1>
            {pipeline.description && (
              <p className="text-sm text-muted-foreground mt-1">{pipeline.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManageStages}>
              <Settings className="w-4 h-4 mr-2" />
              Gérer les étapes
            </Button>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
        {error && (
          <Alert variant="error" className="mt-2">{error}</Alert>
        )}
      </div>

      {/* Kanban Board - Prend tout l'espace restant */}
      <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col">
        <div className="flex-shrink-0 mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{pipeline.name}</h3>
          <Button size="sm" onClick={() => handleCardAdd('')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle opportunité
          </Button>
        </div>
        <div className="flex-1 min-h-0">
          <KanbanBoard
            columns={kanbanColumns}
            cards={kanbanCards}
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
            onCardAdd={handleCardAdd}
            className="h-full"
            showColumnTotals={true}
            getCardValue={(card) => {
              // Extract amount from card data
              return (card.data?.amount as number) || 0;
            }}
            formatValue={(value) => `$${value.toLocaleString('en-US')}`}
          />
        </div>
      </div>

      {/* Opportunity Modal */}
      <Modal
        isOpen={showOpportunityModal}
        onClose={() => {
          setShowOpportunityModal(false);
          setSelectedStageStatus(null);
        }}
        title={editingOpportunity ? 'Modifier l\'opportunité' : 'Créer une nouvelle opportunité'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom de l'opportunité"
            value={opportunityForm.name}
            onChange={(e) => setOpportunityForm({ ...opportunityForm, name: e.target.value })}
            placeholder="Ex: Nouveau client potentiel"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              value={opportunityForm.description}
              onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
              rows={3}
              placeholder="Description de l'opportunité"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montant ($)"
              type="number"
              value={opportunityForm.amount}
              onChange={(e) => setOpportunityForm({ ...opportunityForm, amount: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Probabilité (%)"
              type="number"
              min="0"
              max="100"
              value={opportunityForm.probability}
              onChange={(e) => setOpportunityForm({ ...opportunityForm, probability: e.target.value })}
              placeholder="0-100"
            />
          </div>
          <Input
            label="Date de clôture prévue"
            type="date"
            value={opportunityForm.expected_close_date}
            onChange={(e) => setOpportunityForm({ ...opportunityForm, expected_close_date: e.target.value })}
          />
          {pipeline && pipeline.stages.length > 0 && (
            <Select
              label="Étape"
              value={selectedStageStatus || editingOpportunity?.stage_id || ''}
              onChange={(e) => setSelectedStageStatus(e.target.value)}
              options={pipeline.stages.map(stage => ({ label: stage.name, value: stage.id }))}
              placeholder="Sélectionner une étape"
            />
          )}
          <div className="flex justify-between items-center">
            {editingOpportunity && (
              <Button 
                variant="outline" 
                onClick={handleDeleteOpportunity}
                disabled={deletingOpportunityId === editingOpportunity.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingOpportunityId === editingOpportunity.id ? 'Suppression...' : 'Supprimer'}
              </Button>
            )}
            <div className="flex justify-end gap-2 ml-auto">
              <Button variant="outline" onClick={() => {
                setShowOpportunityModal(false);
                setSelectedStageStatus(null);
              }}>
                Annuler
              </Button>
              <Button onClick={handleSaveOpportunity} disabled={!opportunityForm.name}>
                {editingOpportunity ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Stages Manager Modal */}
      <Modal
        isOpen={showStagesManager}
        onClose={() => setShowStagesManager(false)}
        title="Gérer les étapes"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={handleAddStage}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une étape
            </Button>
          </div>
          
          {pipeline && pipeline.stages.length > 0 ? (
            <div className="space-y-2">
              {pipeline.stages
                .sort((a, b) => a.order - b.order)
                .map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{stage.name}</div>
                      {stage.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {stage.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveStage(stage.id, 'up')}
                        disabled={index === 0}
                        className="p-1"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveStage(stage.id, 'down')}
                        disabled={index === pipeline.stages.length - 1}
                        className="p-1"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStage(stage)}
                        className="p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStage(stage.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune étape définie. Cliquez sur "Ajouter une étape" pour commencer.
            </div>
          )}
        </div>
      </Modal>

      {/* Stage Modal */}
      <Modal
        isOpen={showStageModal}
        onClose={() => {
          setShowStageModal(false);
          setEditingStage(null);
        }}
        title={editingStage ? 'Modifier l\'étape' : 'Ajouter une étape'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nom de l'étape"
            value={stageForm.name}
            onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
            placeholder="Ex: Qualification"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              value={stageForm.description}
              onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
              rows={2}
              placeholder="Description de l'étape"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Couleur</label>
              <input
                type="color"
                value={stageForm.color}
                onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-border"
              />
            </div>
            <Input
              label="Ordre"
              type="number"
              min="0"
              value={stageForm.order.toString()}
              onChange={(e) => setStageForm({ ...stageForm, order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStageModal(false);
                setEditingStage(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveStage} disabled={!stageForm.name}>
              {editingStage ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PipelineDetailPage() {
  return <PipelineDetailContent />;
}
