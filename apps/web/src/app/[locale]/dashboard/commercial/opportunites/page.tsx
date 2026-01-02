'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Button, Alert, Loading, Badge, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { type Opportunity, type OpportunityCreate, type OpportunityUpdate } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import OpportunityForm from '@/components/commercial/OpportunityForm';

import MultiSelect from '@/components/ui/MultiSelect';
import { 
  Plus, 
  MoreVertical,
  Search,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Building2,
  Calendar,
  Edit,
  Eye,
  Loader2
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteOpportunities, 
  useCreateOpportunity, 
  useUpdateOpportunity,
  useDeleteOpportunity
} from '@/lib/query/opportunities';
import { pipelinesAPI, type Pipeline } from '@/lib/api/pipelines';
import { companiesAPI } from '@/lib/api/companies';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import Dropdown from '@/components/ui/Dropdown';
import OpportunityImportModal from '@/components/commercial/OpportunityImportModal';
import { Trash2, Download, Upload, CheckSquare, Square } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';



function OpportunitiesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for opportunities
  const {
    data: opportunitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteOpportunities(20);
  
  // Mutations
  const createOpportunityMutation = useCreateOpportunity();
  const updateOpportunityMutation = useUpdateOpportunity();
  const deleteOpportunityMutation = useDeleteOpportunity();
  const queryClient = useQueryClient();
  
  // Flatten pages into single array
  const opportunities = useMemo(() => {
    return opportunitiesData?.pages.flat() || [];
  }, [opportunitiesData]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPipeline, setFilterPipeline] = useState<string[]>([]);
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [hideClosed, setHideClosed] = useState<boolean>(true); // Filtre par défaut pour cacher closed won/lost
  const [totalActiveOpportunities, setTotalActiveOpportunities] = useState<number>(0);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Load pipelines and companies for filters
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: number; name: string; logo_url?: string | null }>>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pipelinesData, companiesData] = await Promise.all([
          pipelinesAPI.list(0, 1000, true),
          companiesAPI.list(0, 1000)
        ]);
        setPipelines(pipelinesData);
        setCompanies(companiesData.map(c => ({ id: c.id, name: c.name, logo_url: c.logo_url || null })));
      } catch (err) {
        const appError = handleApiError(err);
        showToast({
          message: appError.message || 'Erreur lors du chargement des données',
          type: 'error',
        });
      }
    };
    loadData();
  }, [showToast]);

  // Charger le total exact des opportunités actives (une seule fois au début)
  useEffect(() => {
    let isMounted = true;
    
    const loadTotalActive = async () => {
      try {
        // Charger toutes les opportunités pour compter (avec une limite élevée)
        const allOpps = await opportunitiesAPI.list(0, 10000);
        // Compter celles qui ne sont pas closed won ou closed lost
        const activeCount = allOpps.filter(opp => {
          const isClosed = opp.status === 'closed won' || 
                          opp.status === 'closed lost' || 
                          opp.status === 'won' || 
                          opp.status === 'lost';
          return !isClosed;
        }).length;
        
        if (isMounted) {
          setTotalActiveOpportunities(activeCount);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du total:', err);
        // En cas d'erreur, utiliser le count des opportunités déjà chargées
        if (isMounted) {
          const activeCount = opportunities.filter(opp => {
            const isClosed = opp.status === 'closed won' || 
                            opp.status === 'closed lost' || 
                            opp.status === 'won' || 
                            opp.status === 'lost';
            return !isClosed;
          }).length;
          setTotalActiveOpportunities(activeCount);
        }
      }
    };
    
    loadTotalActive();
    
    return () => {
      isMounted = false;
    };
  }, []); // Charger une seule fois au montage
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Extract unique stage names
  const stageOptions = useMemo(() => {
    const stages = new Set<string>();
    opportunities.forEach((opp) => {
      if (opp.stage_name) stages.add(opp.stage_name);
    });
    return Array.from(stages).sort();
  }, [opportunities]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Hide closed won/lost filter (par défaut actif)
      if (hideClosed) {
        const isClosed = opp.status === 'closed won' || 
                        opp.status === 'closed lost' || 
                        opp.status === 'won' || 
                        opp.status === 'lost';
        if (isClosed) return false;
      }
      
      // Stage filter
      const matchesStatus = filterStatus.length === 0 || (opp.stage_name && filterStatus.includes(opp.stage_name));
      
      // Pipeline filter
      const matchesPipeline = filterPipeline.length === 0 || (opp.pipeline_id && filterPipeline.includes(opp.pipeline_id));
      
      // Company filter
      const matchesCompany = filterCompany.length === 0 || (opp.company_id && filterCompany.includes(String(opp.company_id)));
      
      // Search filter
      const matchesSearch = !debouncedSearchQuery || 
        opp.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        opp.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        opp.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      return matchesStatus && matchesPipeline && matchesCompany && matchesSearch;
    });
  }, [opportunities, filterStatus, filterPipeline, filterCompany, debouncedSearchQuery, hideClosed]);

  // Check if any filters are active
  const hasActiveFilters = filterStatus.length > 0 || filterPipeline.length > 0 || filterCompany.length > 0 || debouncedSearchQuery.trim() !== '';

  // Stats calculation
  const stats = useMemo(() => {
    const totalValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const weightedValue = filteredOpportunities.reduce((sum, opp) => {
      const probability = opp.probability || 50;
      return sum + ((opp.amount || 0) * probability / 100);
    }, 0);
    const avgProbability = filteredOpportunities.length > 0
      ? filteredOpportunities.reduce((sum, opp) => sum + (opp.probability || 50), 0) / filteredOpportunities.length
      : 0;
    
    return {
      total: hideClosed ? totalActiveOpportunities : opportunities.length, // Afficher le total actif (toutes les pages) si le filtre est actif, sinon le total chargé
      totalValue,
      weightedValue,
      avgProbability: avgProbability.toFixed(0),
    };
  }, [filteredOpportunities, hideClosed, totalActiveOpportunities, opportunities.length]);

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  }, []);

  // Get stage color
  const getStageColor = useCallback((stage: string) => {
    switch (stage) {
      case 'Découverte': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400';
      case 'Qualification': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Proposition': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Négociation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Closing': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  }, []);

  // Handle create
  const handleCreate = async (data: OpportunityCreate | OpportunityUpdate) => {
    try {
      await createOpportunityMutation.mutateAsync(data as OpportunityCreate);
      setShowCreateModal(false);
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
    }
  };

  // Handle update
  const handleUpdate = async (id: string, data: OpportunityUpdate) => {
    try {
      await updateOpportunityMutation.mutateAsync({ id, data });
      setShowEditModal(false);
      setSelectedOpportunity(null);
      showToast({
        message: 'Opportunité mise à jour avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour',
        type: 'error',
      });
    }
  };

  // Handle row click
  const handleRowClick = (opportunity: Opportunity) => {
    router.push(`/dashboard/commercial/opportunites/${opportunity.id}`);
  };

  // Handle delete
  const handleDelete = async (opportunityId: string, opportunityName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'opportunité "${opportunityName}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await deleteOpportunityMutation.mutateAsync(opportunityId);
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

  // Handle delete all selected
  const handleDeleteSelected = async () => {
    if (selectedOpportunities.size === 0) {
      showToast({
        message: 'Aucune opportunité sélectionnée',
        type: 'warning',
      });
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOpportunities.size} opportunité${selectedOpportunities.size > 1 ? 's' : ''} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedOpportunities).map(id =>
        deleteOpportunityMutation.mutateAsync(id)
      );
      await Promise.all(deletePromises);
      setSelectedOpportunities(new Set());
      showToast({
        message: `${selectedOpportunities.size} opportunité${selectedOpportunities.size > 1 ? 's' : ''} supprimée${selectedOpportunities.size > 1 ? 's' : ''} avec succès`,
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

  // Handle export
  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      if (format === 'excel') {
        const blob = await opportunitiesAPI.export();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `opportunites_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast({
          message: 'Export Excel réussi',
          type: 'success',
        });
      } else {
        // CSV export
        const csvData = filteredOpportunities.map(opp => ({
          Nom: opp.name,
          Description: opp.description || '',
          Montant: opp.amount || 0,
          Probabilité: opp.probability || 0,
          'Date de clôture': opp.expected_close_date || '',
          Statut: opp.status || '',
          Entreprise: opp.company_name || '',
          Pipeline: opp.pipeline_name || '',
          Stade: opp.stage_name || '',
        }));

        const headers = Object.keys(csvData[0] || {});
        const csvRows = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => {
            const value = row[header as keyof typeof row];
            if (value === null || value === undefined) return '';
            return String(value).replace(/"/g, '""');
          }).join(','))
        ];
        const csv = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `opportunites_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast({
          message: 'Export CSV réussi',
          type: 'success',
        });
      }
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'export',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle selection
  const toggleSelection = (opportunityId: string) => {
    setSelectedOpportunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(opportunityId)) {
        newSet.delete(opportunityId);
      } else {
        newSet.add(opportunityId);
      }
      return newSet;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedOpportunities.size === filteredOpportunities.length) {
      setSelectedOpportunities(new Set());
    } else {
      setSelectedOpportunities(new Set(filteredOpportunities.map(opp => opp.id)));
    }
  };

  // Handle import complete
  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  };



  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="full">
        <Alert variant="error">{error}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Opportunités
              </h1>
              <p className="text-white/80 text-lg">Gérez votre pipeline de ventes</p>
            </div>
            <div className="flex gap-2">
              <Dropdown
                trigger={
                  <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                }
                items={[
                  {
                    label: 'Exporter en Excel',
                    onClick: () => handleExport('excel'),
                    icon: <Download className="w-4 h-4" />,
                    disabled: isExporting || filteredOpportunities.length === 0,
                  },
                  {
                    label: 'Exporter en CSV',
                    onClick: () => handleExport('csv'),
                    icon: <Download className="w-4 h-4" />,
                    disabled: isExporting || filteredOpportunities.length === 0,
                  },
                ]}
                position="bottom"
              />
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button 
                className="bg-white text-primary-500 hover:bg-white/90"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle opportunité
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Target className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités actives</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.totalValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.weightedValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur pondérée</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgProbability}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Probabilité moyenne</div>
          </div>
        </div>

        {/* Filters */}
          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          <div className="space-y-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher une opportunité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Stage filter */}
              <MultiSelect
                options={stageOptions.map((stage) => ({
                  label: stage,
                  value: stage,
                }))}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Filtrer par stade"
                className="min-w-[180px]"
              />

              {/* Pipeline filter */}
              {pipelines.length > 0 && (
                <MultiSelect
                  options={pipelines.map((pipeline) => ({
                    label: pipeline.name,
                    value: pipeline.id,
                  }))}
                  value={filterPipeline}
                  onChange={setFilterPipeline}
                  placeholder="Filtrer par pipeline"
                  className="min-w-[180px]"
                />
              )}

              {/* Company filter */}
              {companies.length > 0 && (
                <MultiSelect
                  options={companies.map((company) => ({
                    label: company.name,
                    value: String(company.id),
                  }))}
                  value={filterCompany}
                  onChange={setFilterCompany}
                  placeholder="Filtrer par entreprise"
                  className="min-w-[180px]"
                />
              )}

              {/* Hide closed filter */}
              <Button
                variant={hideClosed ? undefined : 'outline'}
                size="sm"
                onClick={() => setHideClosed(!hideClosed)}
                className="min-w-[180px]"
              >
                {hideClosed ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Masquer les fermées
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Afficher les fermées
                  </>
                )}
              </Button>

              {/* Bulk actions */}
              {selectedOpportunities.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedOpportunities.size} sélectionnée{selectedOpportunities.size > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              )}

              {/* View mode toggle */}
              <div className={selectedOpportunities.size > 0 ? '' : 'ml-auto flex gap-2'}>
                <Button variant={viewMode === 'grid' ? undefined : 'outline'} onClick={() => setViewMode('grid')}>Grille</Button>
                <Button variant={viewMode === 'list' ? undefined : 'outline'} onClick={() => setViewMode('list')}>Liste</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities Grid/List */}
        {filteredOpportunities.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucune opportunité trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre première opportunité'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une opportunité
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-101 hover:border-primary-500/40 transition-all duration-200 cursor-pointer group relative"
                onClick={(e) => {
                  // Don't navigate if clicking on checkbox or dropdown
                  if ((e.target as HTMLElement).closest('.selection-checkbox') || 
                      (e.target as HTMLElement).closest('.dropdown-trigger')) {
                    return;
                  }
                  handleRowClick(opp);
                }}
              >
                {/* Selection checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <button
                    className="selection-checkbox p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(opp.id);
                    }}
                  >
                    {selectedOpportunities.has(opp.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 ml-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors font-nukleo">
                      {opp.name}
                    </h3>
                    {opp.stage_name && (
                      <Badge className={getStageColor(opp.stage_name)}>
                        {opp.stage_name}
                      </Badge>
                    )}
                  </div>
                  <Dropdown
                    trigger={
                      <button 
                        className="dropdown-trigger p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    }
                    items={[
                      {
                        label: 'Voir les détails',
                        onClick: () => handleRowClick(opp),
                        icon: <Eye className="w-4 h-4" />,
                      },
                      {
                        label: 'Modifier',
                        onClick: () => {
                          setSelectedOpportunity(opp);
                          setShowEditModal(true);
                        },
                        icon: <Edit className="w-4 h-4" />,
                      },
                      { divider: true },
                      {
                        label: 'Supprimer',
                        onClick: () => handleDelete(opp.id, opp.name),
                        icon: <Trash2 className="w-4 h-4" />,
                        variant: 'danger',
                      },
                    ]}
                    position="bottom"
                  />
                </div>

                {/* Value */}
                <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatCurrency(opp.amount || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Valeur</div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {opp.company_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span>{opp.company_name}</span>
                    </div>
                  )}
                  {opp.pipeline_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>{opp.pipeline_name}</span>
                    </div>
                  )}
                  {opp.expected_close_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Clôture: {new Date(opp.expected_close_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(opp);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpportunity(opp);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select all header */}
            {filteredOpportunities.length > 0 && (
              <div className="glass-card p-3 rounded-lg border border-nukleo-lavender/20 flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {selectedOpportunities.size === filteredOpportunities.length ? (
                    <CheckSquare className="w-5 h-5 text-primary-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOpportunities.size > 0 
                    ? `${selectedOpportunities.size} sélectionnée${selectedOpportunities.size > 1 ? 's' : ''}`
                    : 'Sélectionner tout'}
                </span>
              </div>
            )}
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="glass-card p-4 rounded-lg border border-nukleo-lavender/20 hover:border-primary-500/40 transition-all duration-200 cursor-pointer group relative"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.selection-checkbox') || 
                      (e.target as HTMLElement).closest('.dropdown-trigger')) {
                    return;
                  }
                  handleRowClick(opp);
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Selection checkbox */}
                  <button
                    className="selection-checkbox p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(opp.id);
                    }}
                  >
                    {selectedOpportunities.has(opp.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Title & Stage */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors truncate">
                      {opp.name}
                    </h3>
                    {opp.stage_name && (
                      <Badge className={getStageColor(opp.stage_name)}>
                        {opp.stage_name}
                      </Badge>
                    )}
                  </div>

                  {/* Company */}
                  {opp.company_name && (
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate">{opp.company_name}</span>
                    </div>
                  )}

                  {/* Value */}
                  <div className="text-right min-w-[120px]">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(opp.amount || 0)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dropdown
                      trigger={
                        <Button 
                          variant="outline"
                          size="sm"
                          className="dropdown-trigger"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                      items={[
                        {
                          label: 'Voir les détails',
                          onClick: () => handleRowClick(opp),
                          icon: <Eye className="w-4 h-4" />,
                        },
                        {
                          label: 'Modifier',
                          onClick: () => {
                            setSelectedOpportunity(opp);
                            setShowEditModal(true);
                          },
                          icon: <Edit className="w-4 h-4" />,
                        },
                        { divider: true },
                        {
                          label: 'Supprimer',
                          onClick: () => handleDelete(opp.id, opp.name),
                          icon: <Trash2 className="w-4 h-4" />,
                          variant: 'danger',
                        },
                      ]}
                      position="bottom"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center pt-4 pb-8 min-h-[100px]">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}
          </div>
        )}
      </MotionDiv>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle opportunité"
        size="lg"
      >
        <OpportunityForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createOpportunityMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOpportunity(null);
        }}
        title="Modifier l'opportunité"
        size="lg"
      >
        {selectedOpportunity && (
          <OpportunityForm
            opportunity={selectedOpportunity}
            onSubmit={(data) => handleUpdate(selectedOpportunity.id, data)}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedOpportunity(null);
            }}
            loading={updateOpportunityMutation.isPending}
          />
        )}
      </Modal>

      {/* Import Modal */}
      <OpportunityImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
    </PageContainer>
  );
}

export default function OpportunitiesPage() {
  return <OpportunitiesContent />;
}
