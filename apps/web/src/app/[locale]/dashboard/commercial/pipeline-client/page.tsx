'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Button, Modal, Input, Select, Alert, Loading } from '@/components/ui';
import KanbanBoard, { type KanbanCard, type KanbanColumn } from '@/components/ui/KanbanBoard';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Settings } from 'lucide-react';
import { useToast } from '@/components/ui';

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

function PipelineClientContent() {
  const { showToast } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunite[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunite | null>(null);
  const [selectedStageStatus, setSelectedStageStatus] = useState<string | null>(null);

  // Form states
  const [pipelineForm, setPipelineForm] = useState({ name: '', description: '' });
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

  const selectedPipeline = useMemo(() => {
    return pipelines.find(p => p.id === selectedPipelineId) || null;
  }, [pipelines, selectedPipelineId]);

  // Convert opportunities to Kanban cards
  const kanbanCards: KanbanCard[] = useMemo(() => {
    if (!selectedPipeline) return [];
    
    return opportunities
      .filter(opp => opp.pipeline_id === selectedPipelineId)
      .map(opp => ({
        id: opp.id,
        title: opp.name,
        description: opp.description,
        status: opp.stage_id || '',
        priority: opp.probability && opp.probability >= 70 ? 'high' : opp.probability && opp.probability >= 40 ? 'medium' : 'low',
        dueDate: opp.expected_close_date ? new Date(opp.expected_close_date) : undefined,
        tags: opp.amount ? [`${opp.amount}€`] : [],
      }));
  }, [opportunities, selectedPipeline, selectedPipelineId]);

  // Convert stages to Kanban columns
  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    if (!selectedPipeline) return [];
    
    return selectedPipeline.stages
      .sort((a, b) => a.order - b.order)
      .map(stage => ({
        id: stage.id,
        title: stage.name,
        status: stage.id,
        color: stage.color || '#3B82F6',
      }));
  }, [selectedPipeline]);

  // Load pipelines (mock data pour l'instant)
  useEffect(() => {
    // TODO: Remplacer par un appel API réel
    setLoading(true);
    setTimeout(() => {
      const mockPipelines: Pipeline[] = [
        {
          id: '1',
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
        },
      ];
      setPipelines(mockPipelines);
      const firstPipeline = mockPipelines[0];
      if (firstPipeline) {
        setSelectedPipelineId(firstPipeline.id);
      }
      setLoading(false);
    }, 500);
  }, []);

  // Load opportunities (mock data pour l'instant)
  useEffect(() => {
    if (!selectedPipelineId) return;
    
    // TODO: Remplacer par un appel API réel
    setTimeout(() => {
      const mockOpportunities: Opportunite[] = [
        {
          id: 'opp-1',
          name: 'Nouveau client potentiel',
          description: 'Client intéressé par nos services',
          amount: 50000,
          probability: 60,
          pipeline_id: selectedPipelineId,
          stage_id: 'stage-2',
        },
        {
          id: 'opp-2',
          name: 'Renouvellement contrat',
          description: 'Renouvellement annuel',
          amount: 30000,
          probability: 80,
          pipeline_id: selectedPipelineId,
          stage_id: 'stage-4',
        },
      ];
      setOpportunities(mockOpportunities);
    }, 300);
  }, [selectedPipelineId]);

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

  const handleCreatePipeline = () => {
    setEditingPipeline(null);
    setPipelineForm({ name: '', description: '' });
    setShowPipelineModal(true);
  };

  const handleSavePipeline = async () => {
    // TODO: Appel API pour créer/modifier le pipeline
    if (editingPipeline) {
      // Update
      setPipelines(prev => prev.map(p => 
        p.id === editingPipeline.id 
          ? { ...p, name: pipelineForm.name, description: pipelineForm.description }
          : p
      ));
      showToast({ message: 'Pipeline modifié avec succès', type: 'success' });
    } else {
      // Create
      const newPipeline: Pipeline = {
        id: Date.now().toString(),
        name: pipelineForm.name,
        description: pipelineForm.description,
        is_default: false,
        is_active: true,
        stages: [],
      };
      setPipelines(prev => [...prev, newPipeline]);
      showToast({ message: 'Pipeline créé avec succès', type: 'success' });
    }
    setShowPipelineModal(false);
  };

  const handleSaveOpportunity = async () => {
    if (!selectedPipelineId) return;
    
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
        pipeline_id: selectedPipelineId,
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

  const handleAddStage = () => {
    if (!selectedPipeline) return;
    setStageForm({ name: '', description: '', color: '#3B82F6', order: selectedPipeline.stages.length });
    setShowStageModal(true);
  };

  const handleSaveStage = async () => {
    if (!selectedPipeline) return;
    
    // TODO: Appel API pour créer/modifier le stage
    const newStage: PipelineStage = {
      id: Date.now().toString(),
      name: stageForm.name,
      description: stageForm.description,
      color: stageForm.color,
      order: stageForm.order,
    };
    
    setPipelines(prev => prev.map(p => 
      p.id === selectedPipeline.id 
        ? { ...p, stages: [...p.stages, newStage] }
        : p
    ));
    
    showToast({ message: 'Étape ajoutée avec succès', type: 'success' });
    setShowStageModal(false);
  };

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Pipeline & client"
        description="Visualisez votre pipeline commercial et gérez vos opportunités"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Pipeline & client' },
        ]}
      />

      {/* Pipeline Selector */}
      <Card>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Pipeline:</label>
            <Select
              value={selectedPipelineId || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              options={pipelines.map(pipeline => ({ label: pipeline.name, value: pipeline.id }))}
              placeholder="Sélectionner un pipeline"
              className="min-w-[200px]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddStage} disabled={!selectedPipeline}>
              <Settings className="w-4 h-4 mr-2" />
              Gérer les étapes
            </Button>
            <Button variant="outline" size="sm" onClick={handleCreatePipeline}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau pipeline
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Kanban Board */}
      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : selectedPipeline ? (
        <Card>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedPipeline.name}</h3>
              <Button size="sm" onClick={() => handleCardAdd('')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle opportunité
              </Button>
            </div>
            <KanbanBoard
              columns={kanbanColumns}
              cards={kanbanCards}
              onCardMove={handleCardMove}
              onCardClick={handleCardClick}
              onCardAdd={handleCardAdd}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6 text-center text-muted-foreground">
            Sélectionnez ou créez un pipeline pour commencer
          </div>
        </Card>
      )}

      {/* Pipeline Modal */}
      <Modal
        isOpen={showPipelineModal}
        onClose={() => setShowPipelineModal(false)}
        title={editingPipeline ? 'Modifier le pipeline' : 'Créer un nouveau pipeline'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nom du pipeline"
            value={pipelineForm.name}
            onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
            placeholder="Ex: Pipeline Ventes"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              value={pipelineForm.description}
              onChange={(e) => setPipelineForm({ ...pipelineForm, description: e.target.value })}
              rows={3}
              placeholder="Description du pipeline"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPipelineModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePipeline} disabled={!pipelineForm.name}>
              {editingPipeline ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

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
              label="Montant (€)"
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
          {selectedPipeline && selectedPipeline.stages.length > 0 && (
            <Select
              label="Étape"
              value={selectedStageStatus || editingOpportunity?.stage_id || ''}
              onChange={(e) => setSelectedStageStatus(e.target.value)}
              options={selectedPipeline.stages.map(stage => ({ label: stage.name, value: stage.id }))}
              placeholder="Sélectionner une étape"
            />
          )}
          <div className="flex justify-end gap-2">
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
      </Modal>

      {/* Stage Modal */}
      <Modal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        title="Ajouter une étape"
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
            <Button variant="outline" onClick={() => setShowStageModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveStage} disabled={!stageForm.name}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}

export default function PipelineClientPage() {
  return <PipelineClientContent />;
}
