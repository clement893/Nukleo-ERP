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
import { Plus, Settings, ArrowLeft } from 'lucide-react';
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

function PipelineDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const pipelineId = params.id as string;
  
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  
  // Modals
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunite | null>(null);
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
        tags: opp.amount ? [`${opp.amount}€`] : [],
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

  const handleAddStage = () => {
    if (!pipeline) return;
    setStageForm({ name: '', description: '', color: '#3B82F6', order: pipeline.stages.length });
    setShowStageModal(true);
  };

  const handleSaveStage = async () => {
    if (!pipeline) return;
    
    // TODO: Appel API pour créer/modifier le stage
    const newStage: PipelineStage = {
      id: Date.now().toString(),
      name: stageForm.name,
      description: stageForm.description,
      color: stageForm.color,
      order: stageForm.order,
    };
    
    setPipeline(prev => prev ? { ...prev, stages: [...prev.stages, newStage] } : null);
    
    showToast({ message: 'Étape ajoutée avec succès', type: 'success' });
    setShowStageModal(false);
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
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title={pipeline.name}
        description={pipeline.description || 'Gérez vos opportunités dans ce pipeline'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Pipelines', href: '/dashboard/commercial/pipeline-client' },
          { label: pipeline.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddStage}>
              <Settings className="w-4 h-4 mr-2" />
              Gérer les étapes
            </Button>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Kanban Board - Full width */}
      <div className="w-full">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{pipeline.name}</h3>
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
        </Card>
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
          {pipeline && pipeline.stages.length > 0 && (
            <Select
              label="Étape"
              value={selectedStageStatus || editingOpportunity?.stage_id || ''}
              onChange={(e) => setSelectedStageStatus(e.target.value)}
              options={pipeline.stages.map(stage => ({ label: stage.name, value: stage.id }))}
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

export default function PipelineDetailPage() {
  return <PipelineDetailContent />;
}
