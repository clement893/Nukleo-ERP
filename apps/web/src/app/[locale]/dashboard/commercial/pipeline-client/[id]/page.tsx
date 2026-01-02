'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  ArrowLeft, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Trash2, 
  Plus,
  Settings,
  Calendar,
  Building2,
  User,
  Edit,
  Eye,
  Search,
  X,
  Download,
  Table,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Upload
} from 'lucide-react';
import { Badge, Button, Loading, Alert, Card, Input, Select, Modal, Drawer, useToast, Chart } from '@/components/ui';
import { pipelinesAPI, type Pipeline, type PipelineUpdate, type PipelineStageCreate } from '@/lib/api/pipelines';
import { opportunitiesAPI, type Opportunity, type OpportunityCreate, type OpportunityUpdate } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import Link from 'next/link';
import PipelineForm from '@/components/commercial/PipelineForm';
import OpportunityForm from '@/components/commercial/OpportunityForm';
import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Opportunity Card Component for Kanban
function OpportunityKanbanCard({ 
  opportunity, 
  isDragging,
  onView,
  onEdit,
  onDelete,
}: { 
  opportunity: Opportunity; 
  isDragging?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', { 
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <Card className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 hover:shadow-md transition-all duration-200 group mb-2 relative">
        {/* Actions on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
          {onView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="h-6 w-6 p-0"
            >
              <Eye className="w-3 h-3" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Header */}
        <div className="mb-2 pr-8">
          <h4 
            className="font-semibold text-sm mb-0.5 group-hover:text-[#523DC9] transition-colors line-clamp-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
          >
            {opportunity.name}
          </h4>
          {opportunity.company_name && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{opportunity.company_name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {opportunity.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
            {opportunity.description}
          </p>
        )}

        {/* Value & Probability */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-green-600" />
            <span className="text-sm font-bold text-green-600">
              {formatCurrency(opportunity.amount || 0)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">
              {opportunity.probability || 0}%
            </span>
          </div>
        </div>

        {/* Close Date */}
        {opportunity.expected_close_date && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{formatDate(opportunity.expected_close_date)}</span>
          </div>
        )}

        {/* Contact */}
        {opportunity.contact_names && opportunity.contact_names.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.contact_names.join(', ')}</span>
          </div>
        )}

        {/* Assigned to */}
        {opportunity.assigned_to_name && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.assigned_to_name}</span>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'opportunities' | 'stages'>('kanban');
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  
  // Modals and Drawers
  const [showEditPipelineModal, setShowEditPipelineModal] = useState(false);
  const [showCreateOpportunityModal, setShowCreateOpportunityModal] = useState(false);
  const [showEditOpportunityModal, setShowEditOpportunityModal] = useState(false);
  const [showOpportunityDetailDrawer, setShowOpportunityDetailDrawer] = useState(false);
  const [showEditStagesModal, setShowEditStagesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  
  // View and sorting
  const [opportunityView, setOpportunityView] = useState<'list' | 'table'>('list');
  const [sortField, setSortField] = useState<'name' | 'amount' | 'probability' | 'expected_close_date' | 'stage_name'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<string>>(new Set());

  const pipelineId = params?.id ? String(params.id) : null;
  const locale = params?.locale as string || 'fr';

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  useEffect(() => {
    if (!pipelineId) {
      setError('ID de pipeline invalide');
      setLoading(false);
      return;
    }

    loadData();
  }, [pipelineId]);

  const loadData = async () => {
    if (!pipelineId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load pipeline
      const pipelineData = await pipelinesAPI.get(pipelineId);
      setPipeline(pipelineData);

      // Load opportunities for this pipeline
      await loadOpportunities();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement du pipeline');
      showToast({
        message: appError.message || 'Erreur lors du chargement du pipeline',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async () => {
    if (!pipelineId) return;
    
    try {
      const filters: any = { pipeline_id: pipelineId };
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (stageFilter !== 'all') filters.stage_id = stageFilter;
      if (companyFilter !== 'all') filters.company_id = parseInt(companyFilter);
      if (searchQuery) filters.search = searchQuery;
      
      const oppsData = await opportunitiesAPI.list(0, 1000, filters);
      let filteredOpps = Array.isArray(oppsData) ? oppsData : [];
      
      // Filter by amount range
      if (minAmount || maxAmount) {
        filteredOpps = filteredOpps.filter(opp => {
          const amount = opp.amount || 0;
          if (minAmount && amount < parseFloat(minAmount)) return false;
          if (maxAmount && amount > parseFloat(maxAmount)) return false;
          return true;
        });
      }
      
      setOpportunities(filteredOpps);
    } catch (err) {
      console.error('Error loading opportunities:', err);
      setOpportunities([]);
    }
  };

  useEffect(() => {
    if (pipelineId && !loading) {
      loadOpportunities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId, searchQuery, statusFilter, stageFilter, companyFilter, minAmount, maxAmount]);

  const handleDelete = async () => {
    if (!pipeline || !confirm('Êtes-vous sûr de vouloir supprimer ce pipeline ?')) return;

    try {
      await pipelinesAPI.delete(pipeline.id);
      showToast({
        message: 'Pipeline supprimé avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/commercial/pipeline-client`);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const handleUpdatePipeline = async (data: PipelineUpdate) => {
    if (!pipeline) return;
    
    try {
      await pipelinesAPI.update(pipeline.id, data);
      await loadData();
      setShowEditPipelineModal(false);
      showToast({
        message: 'Pipeline modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification',
        type: 'error',
      });
      throw err;
    }
  };

  const handleCreateOpportunity = async (data: OpportunityCreate) => {
    if (!pipelineId) return;
    
    try {
      await opportunitiesAPI.create({
        ...data,
        pipeline_id: pipelineId,
        stage_id: data.stage_id || pipeline?.stages?.[0]?.id || null,
      });
      await loadOpportunities();
      setShowCreateOpportunityModal(false);
      showToast({
        message: 'Opportunité créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création',
        type: 'error',
      });
      throw err;
    }
  };

  const handleUpdateOpportunity = async (data: OpportunityCreate | OpportunityUpdate) => {
    if (!selectedOpportunity) return;
    
    try {
      await opportunitiesAPI.update(selectedOpportunity.id, data);
      await loadOpportunities();
      setShowEditOpportunityModal(false);
      setSelectedOpportunity(null);
      showToast({
        message: 'Opportunité modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification',
        type: 'error',
      });
      throw err;
    }
  };

  const handleDeleteOpportunity = async (opportunity: Opportunity) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'opportunité "${opportunity.name}" ?`)) return;
    
    try {
      await opportunitiesAPI.delete(opportunity.id);
      await loadOpportunities();
      showToast({
        message: 'Opportunité supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const handleViewOpportunity = async (opportunity: Opportunity) => {
    try {
      const fullOpp = await opportunitiesAPI.get(opportunity.id);
      setSelectedOpportunity(fullOpp);
      setShowOpportunityDetailDrawer(true);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement',
        type: 'error',
      });
    }
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowEditOpportunityModal(true);
  };

  const handleExportOpportunities = async () => {
    try {
      const blob = await opportunitiesAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opportunities-${pipelineId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({
        message: 'Export réussi',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'export',
        type: 'error',
      });
    }
  };

  const handleImportOpportunities = async (file: File) => {
    try {
      const result = await opportunitiesAPI.import(file);
      showToast({
        message: `Import réussi: ${result.valid_rows} opportunité(s) importée(s)`,
        type: 'success',
      });
      await loadOpportunities();
      setShowImportModal(false);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOpportunities.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOpportunities.size} opportunité(s) ?`)) return;
    
    try {
      // Delete opportunities one by one (bulk delete endpoint might not support specific IDs)
      const deletePromises = Array.from(selectedOpportunities).map(id => 
        opportunitiesAPI.delete(id)
      );
      await Promise.all(deletePromises);
      
      setSelectedOpportunities(new Set());
      await loadOpportunities();
      showToast({
        message: `${selectedOpportunities.size} opportunité(s) supprimée(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleOpportunitySelection = (id: string) => {
    const newSelection = new Set(selectedOpportunities);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedOpportunities(newSelection);
  };

  const toggleAllOpportunitiesSelection = () => {
    if (selectedOpportunities.size === filteredAndSortedOpportunities.length) {
      setSelectedOpportunities(new Set());
    } else {
      setSelectedOpportunities(new Set(filteredAndSortedOpportunities.map(o => o.id)));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunity = opportunities.find(o => o.id === active.id);
    setActiveOpportunity(opportunity || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);

    if (!over || active.id === over.id) return;

    const opportunityId = active.id as string;
    const newStageId = over.id as string;

    // Find the opportunity and new stage
    const opportunity = opportunities.find(o => o.id === opportunityId);
    const newStage = pipeline?.stages?.find(s => s.id === newStageId);

    if (!opportunity || !newStage) return;

    // Optimistic update
    setOpportunities(prev =>
      prev.map(o =>
        o.id === opportunityId
          ? { ...o, stage_id: newStageId, stage_name: newStage.name }
          : o
      )
    );

    // Update on server
    try {
      await opportunitiesAPI.update(opportunityId, {
        stage_id: newStageId,
      });
      showToast({
        message: `Opportunité déplacée vers "${newStage.name}"`,
        type: 'success',
      });
    } catch (err) {
      // Revert on error
      setOpportunities(prev =>
        prev.map(o =>
          o.id === opportunityId
            ? opportunity
            : o
        )
      );
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du déplacement',
        type: 'error',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getOpportunityStageColor = (stage: string | null | undefined) => {
    if (!stage) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('découverte')) return 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400';
    if (lowerStage.includes('qualif')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    if (lowerStage.includes('propos')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (lowerStage.includes('négoc')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    if (lowerStage.includes('clos') || lowerStage.includes('gagn')) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  // Calculate stats
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const weightedValue = opportunities.reduce((sum, opp) => sum + ((opp.amount || 0) * (opp.probability || 0) / 100), 0);

  // Group opportunities by stage for kanban
  const opportunitiesByStage = useMemo(() => {
    return (pipeline?.stages || []).reduce((acc, stage) => {
      acc[stage.id] = opportunities.filter(opp => opp.stage_id === stage.id);
      return acc;
    }, {} as Record<string, Opportunity[]>);
  }, [pipeline?.stages, opportunities]);

  // Get unique companies for filter
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    opportunities.forEach(opp => {
      if (opp.company_id && opp.company_name) {
        companies.add(`${opp.company_id}:${opp.company_name}`);
      }
    });
    return Array.from(companies).map(c => {
      const [id, name] = c.split(':');
      return { id, name };
    });
  }, [opportunities]);

  // Filtered and sorted opportunities
  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(opp => opp.status === statusFilter);
    }
    if (stageFilter !== 'all') {
      filtered = filtered.filter(opp => opp.stage_id === stageFilter);
    }
    if (companyFilter !== 'all') {
      filtered = filtered.filter(opp => opp.company_id === parseInt(companyFilter));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.name.toLowerCase().includes(query) ||
        opp.description?.toLowerCase().includes(query) ||
        opp.company_name?.toLowerCase().includes(query)
      );
    }
    if (minAmount || maxAmount) {
      filtered = filtered.filter(opp => {
        const amount = opp.amount || 0;
        if (minAmount && amount < parseFloat(minAmount)) return false;
        if (maxAmount && amount > parseFloat(maxAmount)) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'probability':
          aValue = a.probability || 0;
          bValue = b.probability || 0;
          break;
        case 'expected_close_date':
          aValue = a.expected_close_date ? new Date(a.expected_close_date).getTime() : 0;
          bValue = b.expected_close_date ? new Date(b.expected_close_date).getTime() : 0;
          break;
        case 'stage_name':
          aValue = a.stage_name || '';
          bValue = b.stage_name || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [opportunities, statusFilter, stageFilter, companyFilter, searchQuery, minAmount, maxAmount, sortField, sortDirection]);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !pipeline) {
    return (
      <PageContainer>
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Link href={`/${locale}/dashboard/commercial/pipeline-client`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux pipelines
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!pipeline) {
    return (
      <PageContainer>
        <Alert variant="error">Pipeline non trouvé</Alert>
        <div className="mt-4">
          <Link href={`/${locale}/dashboard/commercial/pipeline-client`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux pipelines
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <Link href={`/${locale}/dashboard/commercial/pipeline-client`}>
              <button className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Retour aux pipelines</span>
              </button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {pipeline.name}
                  </h1>
                </div>
                {pipeline.description && (
                  <p className="text-white/80 text-lg">{pipeline.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {pipeline.is_default && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      Par défaut
                    </Badge>
                  )}
                  <span className="text-sm text-white/70">
                    {pipeline.stages?.length || 0} étapes
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-white text-[#523DC9] hover:bg-white/90"
                  onClick={() => setShowCreateOpportunityModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle opportunité
                </Button>
                <Button 
                  variant="outline" 
                  className="text-white border-white/30 hover:bg-white/10" 
                  onClick={() => setShowEditPipelineModal(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Target className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {opportunities.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(weightedValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur pondérée</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Settings className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {pipeline.stages?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Étapes</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'kanban'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'opportunities'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Opportunités ({opportunities.length})
              </button>
              <button
                onClick={() => setActiveTab('stages')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'stages'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Étapes ({pipeline.stages?.length || 0})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'kanban' && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {(pipeline.stages || [])
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((stage) => {
                      const stageOpps = opportunitiesByStage[stage.id] || [];
                      const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);

                      return (
                        <div key={stage.id} className="flex-shrink-0 w-[260px]">
                          <div 
                            className="glass-card rounded-lg border p-3 h-full flex flex-col"
                            style={{ 
                              borderColor: stage.color ? `${stage.color}40` : '#A7A2CF20',
                              backgroundColor: stage.color ? `${stage.color}05` : undefined
                            }}
                          >
                            {/* Stage Header */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <h3 
                                  className="font-bold text-sm" 
                                  style={{ 
                                    fontFamily: 'Space Grotesk, sans-serif',
                                    color: stage.color || undefined
                                  }}
                                >
                                  {stage.name}
                                </h3>
                                <Badge 
                                  className="text-xs"
                                  style={{
                                    backgroundColor: stage.color ? `${stage.color}20` : undefined,
                                    borderColor: stage.color ? `${stage.color}40` : undefined,
                                    color: stage.color || undefined
                                  }}
                                >
                                  {stageOpps.length}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {formatCurrency(stageValue)}
                              </p>
                            </div>

                            {/* Droppable Area */}
                            <SortableContext
                              items={stageOpps.map(o => o.id)}
                              strategy={verticalListSortingStrategy}
                              id={stage.id}
                            >
                              <div className="flex-1 space-y-2 min-h-[200px]">
                                {stageOpps.map((opp) => (
                                  <OpportunityKanbanCard 
                                    key={opp.id} 
                                    opportunity={opp}
                                    onView={() => handleViewOpportunity(opp)}
                                    onEdit={() => handleEditOpportunity(opp)}
                                    onDelete={() => handleDeleteOpportunity(opp)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <DragOverlay>
                  {activeOpportunity ? (
                    <OpportunityKanbanCard opportunity={activeOpportunity} isDragging />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Informations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nom</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.name}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.description || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre d'étapes</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.stages?.length || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pipeline par défaut</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.is_default ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                </div>

                {/* Statistics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Funnel Chart - Opportunities by Stage */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Distribution par étape
                    </h3>
                    {pipeline.stages && pipeline.stages.length > 0 ? (
                      <Chart
                        type="bar"
                        data={(pipeline.stages || [])
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map(stage => ({
                            label: stage.name || '',
                            value: opportunitiesByStage[stage.id]?.length || 0,
                            color: stage.color || '#523DC9',
                          }))}
                        height={250}
                      />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune étape définie</p>
                    )}
                  </Card>

                  {/* Value by Stage Chart */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Valeur par étape
                    </h3>
                    {pipeline.stages && pipeline.stages.length > 0 ? (
                      <Chart
                        type="bar"
                        data={(pipeline.stages || [])
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map(stage => {
                            const stageOpps = opportunitiesByStage[stage.id] || [];
                            const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
                            return {
                              label: stage.name || '',
                              value: stageValue,
                              color: stage.color || '#523DC9',
                            };
                          })}
                        height={250}
                      />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune étape définie</p>
                    )}
                  </Card>
                </div>

                {/* Conversion Rates */}
                {pipeline.stages && pipeline.stages.length > 1 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Taux de conversion entre étapes
                    </h3>
                    <div className="space-y-3">
                      {(pipeline.stages || [])
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .slice(0, -1)
                        .map((stage, index) => {
                          const currentStageOpps = opportunitiesByStage[stage.id] || [];
                          const nextStage = pipeline.stages?.find(s => s.order === (stage.order || 0) + 1);
                          const nextStageOpps = nextStage ? (opportunitiesByStage[nextStage.id] || []) : [];
                          
                          const currentCount = currentStageOpps.length;
                          const nextCount = nextStageOpps.length;
                          const conversionRate = currentCount > 0 ? ((nextCount / currentCount) * 100).toFixed(1) : '0';
                          
                          return (
                            <div key={stage.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: stage.color || '#523DC9' }}
                                />
                                <span className="font-medium">{stage.name}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {nextStage?.name || 'Fin'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {currentCount} → {nextCount}
                                </span>
                                <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30">
                                  {conversionRate}%
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                )}

                {/* Stage Statistics */}
                {pipeline.stages && pipeline.stages.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Statistiques détaillées par étape
                    </h3>
                    <div className="space-y-4">
                      {(pipeline.stages || [])
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(stage => {
                          const stageOpps = opportunitiesByStage[stage.id] || [];
                          const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
                          const avgValue = stageOpps.length > 0 ? stageValue / stageOpps.length : 0;
                          const avgProbability = stageOpps.length > 0 
                            ? stageOpps.reduce((sum, opp) => sum + (opp.probability || 0), 0) / stageOpps.length 
                            : 0;
                          
                          return (
                            <div 
                              key={stage.id}
                              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                              style={{
                                borderLeftColor: stage.color || undefined,
                                borderLeftWidth: stage.color ? '4px' : undefined
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h4>
                                <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30">
                                  {stageOpps.length} opportunité{stageOpps.length > 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valeur totale</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(stageValue)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valeur moyenne</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(avgValue)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Probabilité moyenne</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {avgProbability.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                )}

                {pipeline.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{pipeline.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Opportunités ({filteredAndSortedOpportunities.length})
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-md">
                      <Button
                        size="sm"
                        variant={opportunityView === 'list' ? 'default' : 'ghost'}
                        onClick={() => setOpportunityView('list')}
                        className="rounded-r-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={opportunityView === 'table' ? 'default' : 'ghost'}
                        onClick={() => setOpportunityView('table')}
                        className="rounded-l-none"
                      >
                        <Table className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedOpportunities.size > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleBulkDelete}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer ({selectedOpportunities.size})
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowImportModal(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleExportOpportunities}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setShowCreateOpportunityModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle opportunité
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Status Filter */}
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Tous les statuts' },
                        { value: 'open', label: 'Ouverte' },
                        { value: 'qualified', label: 'Qualifiée' },
                        { value: 'proposal', label: 'Proposition' },
                        { value: 'negotiation', label: 'Négociation' },
                        { value: 'won', label: 'Gagnée' },
                        { value: 'lost', label: 'Perdue' },
                        { value: 'cancelled', label: 'Annulée' },
                      ]}
                    />

                    {/* Stage Filter */}
                    <Select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Toutes les étapes' },
                        ...(pipeline?.stages || []).map(s => ({ value: s.id, label: s.name }))
                      ]}
                    />

                    {/* Company Filter */}
                    <Select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Toutes les entreprises' },
                        ...uniqueCompanies.map(c => ({ value: c.id, label: c.name }))
                      ]}
                    />
                  </div>

                  {/* Amount Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Montant minimum"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Montant maximum"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>

                  {/* Clear Filters */}
                  {(searchQuery || statusFilter !== 'all' || stageFilter !== 'all' || companyFilter !== 'all' || minAmount || maxAmount) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setStageFilter('all');
                        setCompanyFilter('all');
                        setMinAmount('');
                        setMaxAmount('');
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
                
                {filteredAndSortedOpportunities.length > 0 ? (
                  opportunityView === 'list' ? (
                    <div className="space-y-3">
                      {filteredAndSortedOpportunities.map((opp) => (
                        <div 
                          key={opp.id} 
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer group"
                          onClick={() => handleViewOpportunity(opp)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{opp.name}</h4>
                              {opp.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                                  {opp.description}
                                </p>
                              )}
                              {opp.company_name && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Building2 className="w-4 h-4" />
                                  <span>{opp.company_name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getOpportunityStageColor(opp.stage_name)}>
                                {opp.stage_name || 'Non défini'}
                              </Badge>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditOpportunity(opp)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteOpportunity(opp)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(opp.amount || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {opp.probability || 0}%
                              </span>
                            </div>
                            {opp.expected_close_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {formatDate(opp.expected_close_date)}
                                </span>
                              </div>
                            )}
                            {opp.assigned_to_name && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {opp.assigned_to_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="p-3 text-left">
                              <button
                                onClick={toggleAllOpportunitiesSelection}
                                className="flex items-center"
                              >
                                {selectedOpportunities.size === filteredAndSortedOpportunities.length ? (
                                  <CheckSquare className="w-4 h-4" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </th>
                            <th className="p-3 text-left">
                              <button
                                onClick={() => handleSort('name')}
                                className="flex items-center gap-1 hover:text-[#523DC9]"
                              >
                                Nom
                                {sortField === 'name' ? (
                                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                                )}
                              </button>
                            </th>
                            <th className="p-3 text-left">
                              <span className="flex items-center gap-1">Entreprise</span>
                            </th>
                            <th className="p-3 text-left">
                              <button
                                onClick={() => handleSort('amount')}
                                className="flex items-center gap-1 hover:text-[#523DC9]"
                              >
                                Montant
                                {sortField === 'amount' ? (
                                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                                )}
                              </button>
                            </th>
                            <th className="p-3 text-left">
                              <button
                                onClick={() => handleSort('probability')}
                                className="flex items-center gap-1 hover:text-[#523DC9]"
                              >
                                Probabilité
                                {sortField === 'probability' ? (
                                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                                )}
                              </button>
                            </th>
                            <th className="p-3 text-left">
                              <button
                                onClick={() => handleSort('expected_close_date')}
                                className="flex items-center gap-1 hover:text-[#523DC9]"
                              >
                                Date de fermeture
                                {sortField === 'expected_close_date' ? (
                                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                                )}
                              </button>
                            </th>
                            <th className="p-3 text-left">
                              <button
                                onClick={() => handleSort('stage_name')}
                                className="flex items-center gap-1 hover:text-[#523DC9]"
                              >
                                Étape
                                {sortField === 'stage_name' ? (
                                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                                )}
                              </button>
                            </th>
                            <th className="p-3 text-left">Assigné à</th>
                            <th className="p-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedOpportunities.map((opp) => (
                            <tr
                              key={opp.id}
                              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="p-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOpportunitySelection(opp.id);
                                  }}
                                >
                                  {selectedOpportunities.has(opp.id) ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleViewOpportunity(opp)}
                                  className="text-left font-medium text-[#523DC9] hover:underline"
                                >
                                  {opp.name}
                                </button>
                              </td>
                              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                {opp.company_name || '-'}
                              </td>
                              <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(opp.amount || 0)}
                              </td>
                              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                {opp.probability || 0}%
                              </td>
                              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                {opp.expected_close_date ? formatDate(opp.expected_close_date) : '-'}
                              </td>
                              <td className="p-3">
                                <Badge className={getOpportunityStageColor(opp.stage_name)}>
                                  {opp.stage_name || 'Non défini'}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                {opp.assigned_to_name || '-'}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditOpportunity(opp)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteOpportunity(opp)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery || statusFilter !== 'all' || stageFilter !== 'all' || companyFilter !== 'all' || minAmount || maxAmount
                        ? 'Aucune opportunité ne correspond aux filtres'
                        : 'Aucune opportunité dans ce pipeline'}
                    </p>
                    {!(searchQuery || statusFilter !== 'all' || stageFilter !== 'all' || companyFilter !== 'all' || minAmount || maxAmount) && (
                      <Button 
                        size="sm" 
                        onClick={() => setShowCreateOpportunityModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer une opportunité
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stages' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Étapes du pipeline ({pipeline.stages?.length || 0})
                  </h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowEditStagesModal(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gérer les étapes
                  </Button>
                </div>
                
                {pipeline.stages && pipeline.stages.length > 0 ? (
                  <div className="space-y-3">
                    {pipeline.stages
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((stage, index) => {
                        const stageOpps = opportunitiesByStage[stage.id] || [];
                        const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
                        
                        return (
                          <div 
                            key={stage.id} 
                            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                            style={{
                              borderLeftColor: stage.color || undefined,
                              borderLeftWidth: stage.color ? '4px' : undefined
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                                style={{ backgroundColor: stage.color || '#523DC9' }}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h4>
                                  <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30 text-xs">
                                    {stageOpps.length} opportunité{stageOpps.length > 1 ? 's' : ''}
                                  </Badge>
                                  {stageValue > 0 && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {formatCurrency(stageValue)}
                                    </span>
                                  )}
                                </div>
                                {stage.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {stage.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Aucune étape définie</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {(pipeline.created_at || pipeline.updated_at) && (
          <div className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
              {pipeline.created_at && (
                <span>Créé le: {formatDate(pipeline.created_at)}</span>
              )}
              {pipeline.updated_at && (
                <span>Dernière modification: {formatDate(pipeline.updated_at)}</span>
              )}
            </div>
          </div>
        )}
      </MotionDiv>

      {/* Edit Pipeline Modal */}
      <Modal
        isOpen={showEditPipelineModal}
        onClose={() => setShowEditPipelineModal(false)}
        title="Modifier le pipeline"
        size="lg"
      >
        <PipelineForm
          pipeline={pipeline}
          onSubmit={handleUpdatePipeline}
          onCancel={() => setShowEditPipelineModal(false)}
          loading={false}
        />
      </Modal>

      {/* Create Opportunity Modal */}
      <Modal
        isOpen={showCreateOpportunityModal}
        onClose={() => setShowCreateOpportunityModal(false)}
        title="Nouvelle opportunité"
        size="lg"
      >
        <OpportunityForm
          opportunity={null}
          onSubmit={handleCreateOpportunity}
          onCancel={() => setShowCreateOpportunityModal(false)}
          loading={false}
        />
      </Modal>

      {/* Edit Opportunity Modal */}
      <Modal
        isOpen={showEditOpportunityModal}
        onClose={() => {
          setShowEditOpportunityModal(false);
          setSelectedOpportunity(null);
        }}
        title="Modifier l'opportunité"
        size="lg"
      >
        {selectedOpportunity && (
          <OpportunityForm
            opportunity={selectedOpportunity}
            onSubmit={handleUpdateOpportunity}
            onCancel={() => {
              setShowEditOpportunityModal(false);
              setSelectedOpportunity(null);
            }}
            loading={false}
          />
        )}
      </Modal>

      {/* Opportunity Detail Drawer */}
      <Drawer
        isOpen={showOpportunityDetailDrawer}
        onClose={() => {
          setShowOpportunityDetailDrawer(false);
          setSelectedOpportunity(null);
        }}
        title={selectedOpportunity?.name || 'Détails de l\'opportunité'}
        position="right"
        size="lg"
      >
        {selectedOpportunity ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Montant
              </h4>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(selectedOpportunity.amount || 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Probabilité
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedOpportunity.probability || 0}%
                </p>
              </div>

              {selectedOpportunity.status && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Statut
                  </h4>
                  <Badge className={getOpportunityStageColor(selectedOpportunity.status)}>
                    {selectedOpportunity.status}
                  </Badge>
                </div>
              )}

              {selectedOpportunity.expected_close_date && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Date de fermeture prévue
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(selectedOpportunity.expected_close_date)}
                  </p>
                </div>
              )}

              {selectedOpportunity.stage_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Étape
                  </h4>
                  <Badge className={getOpportunityStageColor(selectedOpportunity.stage_name)}>
                    {selectedOpportunity.stage_name}
                  </Badge>
                </div>
              )}

              {selectedOpportunity.company_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Entreprise
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedOpportunity.company_name}
                  </p>
                </div>
              )}

              {selectedOpportunity.assigned_to_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Assigné à
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedOpportunity.assigned_to_name}
                  </p>
                </div>
              )}
            </div>

            {selectedOpportunity.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Description
                </h4>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedOpportunity.description}
                </p>
              </div>
            )}

            {selectedOpportunity.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Notes
                </h4>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedOpportunity.notes}
                </p>
              </div>
            )}

            {selectedOpportunity.contact_names && selectedOpportunity.contact_names.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Contacts
                </h4>
                <div className="space-y-1">
                  {selectedOpportunity.contact_names.map((name, idx) => (
                    <p key={idx} className="text-gray-900 dark:text-white">
                      {name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {selectedOpportunity.segment && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Segment
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedOpportunity.segment}
                </p>
              </div>
            )}

            {selectedOpportunity.region && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Région
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedOpportunity.region}
                </p>
              </div>
            )}

            {selectedOpportunity.service_offer_link && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Lien offre de service
                </h4>
                <a 
                  href={selectedOpportunity.service_offer_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#523DC9] hover:underline"
                >
                  {selectedOpportunity.service_offer_link}
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                {selectedOpportunity.opened_at && (
                  <p>
                    Ouverte le {formatDate(selectedOpportunity.opened_at)}
                  </p>
                )}
                {selectedOpportunity.closed_at && (
                  <p>
                    Fermée le {formatDate(selectedOpportunity.closed_at)}
                  </p>
                )}
                <p>
                  Créée le {formatDate(selectedOpportunity.created_at)}
                </p>
                {selectedOpportunity.updated_at !== selectedOpportunity.created_at && (
                  <p>
                    Modifiée le {formatDate(selectedOpportunity.updated_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOpportunityDetailDrawer(false);
                  handleEditOpportunity(selectedOpportunity);
                }}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOpportunityDetailDrawer(false);
                  handleDeleteOpportunity(selectedOpportunity);
                }}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </Drawer>

      {/* Edit Stages Modal */}
      <Modal
        isOpen={showEditStagesModal}
        onClose={() => setShowEditStagesModal(false)}
        title="Gérer les étapes"
        size="lg"
      >
        <div className="space-y-4">
          <Alert variant="info">
            La modification des étapes nécessite une mise à jour complète du pipeline. 
            Pour modifier les étapes, veuillez utiliser le formulaire de modification du pipeline.
          </Alert>
          <div className="space-y-3">
            {pipeline?.stages?.sort((a, b) => (a.order || 0) - (b.order || 0)).map((stage, index) => (
              <div 
                key={stage.id} 
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{
                  borderLeftColor: stage.color || undefined,
                  borderLeftWidth: stage.color ? '4px' : undefined
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: stage.color || '#523DC9' }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h4>
                    {stage.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stage.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditStagesModal(false);
                setShowEditPipelineModal(true);
              }}
            >
              Modifier via le pipeline
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditStagesModal(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Opportunities Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des opportunités"
        size="lg"
      >
        <div className="space-y-4">
          <Alert variant="info">
            Téléchargez d'abord le modèle Excel, remplissez-le avec vos données, puis importez-le ici.
          </Alert>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await opportunitiesAPI.downloadTemplate();
                  showToast({
                    message: 'Modèle téléchargé',
                    type: 'success',
                  });
                } catch (err) {
                  const appError = handleApiError(err);
                  showToast({
                    message: appError.message || 'Erreur lors du téléchargement',
                    type: 'error',
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le modèle
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Fichier Excel à importer
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await handleImportOpportunities(file);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formats acceptés: .xlsx, .xls
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
