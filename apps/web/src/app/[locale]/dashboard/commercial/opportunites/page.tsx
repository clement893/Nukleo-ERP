'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Opportunity, type OpportunityCreate, type OpportunityUpdate } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import OpportunityForm from '@/components/commercial/OpportunityForm';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelect from '@/components/ui/MultiSelect';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical,
  Trash2
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteOpportunities, 
  useCreateOpportunity, 
  useUpdateOpportunity, 
  // useDeleteOpportunity, // Currently unused but kept for future use
  opportunitiesAPI 
} from '@/lib/query/opportunities';
import { pipelinesAPI, type Pipeline } from '@/lib/api/pipelines';
import { companiesAPI } from '@/lib/api/companies';
import ImportOpportunitiesInstructions from '@/components/commercial/ImportOpportunitiesInstructions';
import ImportLogsViewer from '@/components/commercial/ImportLogsViewer';
import { HelpCircle } from 'lucide-react';

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
  // const deleteOpportunityMutation = useDeleteOpportunity(); // Currently unused but kept for future use
  
  // Flatten pages into single array
  const opportunities = useMemo(() => {
    return opportunitiesData?.pages.flat() || [];
  }, [opportunitiesData]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPipeline, setFilterPipeline] = useState<string[]>([]);
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showImportLogs, setShowImportLogs] = useState(false);
  
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
  
  // Debounce search query to avoid excessive re-renders (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Extract unique stage names from opportunities for filter
  const stageOptions = useMemo(() => {
    const stages = new Set<string>();
    opportunities.forEach((opp) => {
      if (opp.stage_name) stages.add(opp.stage_name);
    });
    return Array.from(stages).sort();
  }, [opportunities]);

  // Load more opportunities for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Extract unique values for dropdowns (currently unused but kept for future use)
  // const uniqueValues = useMemo(() => {
  //   const pipelineNames = new Set<string>();
  //   const companyNames = new Set<string>();

  //   opportunities.forEach((opp) => {
  //     if (opp.pipeline_name) pipelineNames.add(opp.pipeline_name);
  //     if (opp.company_name) companyNames.add(opp.company_name);
  //   });

  //   return {
  //     pipelineNames: Array.from(pipelineNames).sort(),
  //     companyNames: Array.from(companyNames).sort(),
  //   };
  // }, [opportunities]);

  // Filtered opportunities with debounced search
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Stage filter (using stage_name instead of status)
      const matchesStatus = filterStatus.length === 0 || (opp.stage_name && filterStatus.includes(opp.stage_name));
      
      // Pipeline filter
      const matchesPipeline = filterPipeline.length === 0 || 
        (opp.pipeline_id && filterPipeline.includes(opp.pipeline_id));
      
      // Company filter
      const matchesCompany = filterCompany.length === 0 || 
        (opp.company_id && filterCompany.includes(opp.company_id.toString()));
      
      // Search filter: search in name, description, company (using debounced query)
      const matchesSearch = !debouncedSearchQuery || 
        opp.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        opp.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        opp.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesStatus && matchesPipeline && matchesCompany && matchesSearch;
    });
  }, [opportunities, filterStatus, filterPipeline, filterCompany, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!(filterStatus.length > 0 || filterPipeline.length > 0 || filterCompany.length > 0 || debouncedSearchQuery);
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterStatus([]);
    setFilterPipeline([]);
    setFilterCompany([]);
    setSearchQuery('');
  }, []);

  // Handle create with React Query mutation
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
        message: appError.message || 'Erreur lors de la création de l\'opportunité',
        type: 'error',
      });
    }
  };

  // Handle update with React Query mutation
  const handleUpdate = async (data: OpportunityCreate | OpportunityUpdate) => {
    if (!selectedOpportunity) return;

    try {
      await updateOpportunityMutation.mutateAsync({
        id: selectedOpportunity.id,
        data: data as OpportunityUpdate,
      });
      setShowEditModal(false);
      setSelectedOpportunity(null);
      showToast({
        message: 'Opportunité modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification de l\'opportunité',
        type: 'error',
      });
    }
  };

  // Handle delete with React Query mutation (currently unused but kept for future use)
  // const handleDelete = async (opportunityId: string) => {
  //   if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
  //     return;
  //   }

  //   try {
  //     await deleteOpportunityMutation.mutateAsync(opportunityId);
  //     if (selectedOpportunity?.id === opportunityId) {
  //       setSelectedOpportunity(null);
  //     }
  //     showToast({
  //       message: 'Opportunité supprimée avec succès',
  //       type: 'success',
  //     });
  //   } catch (err) {
  //     const appError = handleApiError(err);
  //     showToast({
  //       message: appError.message || 'Erreur lors de la suppression de l\'opportunité',
  //       type: 'error',
  //     });
  //   }
  // };

  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Handle delete all opportunities
  const handleDeleteAll = async () => {
    if (opportunities.length === 0) {
      showToast({
        message: 'Aucune opportunité à supprimer',
        type: 'info',
      });
      return;
    }
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer toutes les ${opportunities.length} opportunité${opportunities.length > 1 ? 's' : ''} ?\n\nCette action est irréversible.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      const result = await opportunitiesAPI.deleteAll();
      // Invalidate opportunities query to refetch after deletion
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      showToast({
        message: result.message || `Suppression réussie : ${result.deleted_count} opportunité${result.deleted_count > 1 ? 's' : ''} supprimée${result.deleted_count > 1 ? 's' : ''}`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des opportunités',
        type: 'error',
      });
    }
  };
  
  // Handle import
  const handleImport = async (file: File) => {
    try {
      // Generate import_id before starting import
      const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentImportId(importId);
      setShowImportLogs(true);
      
      const result = await opportunitiesAPI.import(file, importId);
      
      // Update import_id if backend returns a different one (should be the same)
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        // Invalidate opportunities query to refetch after import
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      }
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
      setShowImportLogs(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await opportunitiesAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opportunites-${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Navigate to detail page
  const openDetailPage = (opportunity: Opportunity) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/opportunites/${opportunity.id}`);
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Table columns
  const columns: Column<Opportunity>[] = [
    {
      key: 'name',
      label: 'Nom de l\'opportunité',
      sortable: true,
      render: (_value, opportunity) => (
        <div style={{ maxWidth: '300px' }} className="whitespace-normal">
          <div className="font-medium truncate block" title={opportunity.name}>{opportunity.name}</div>
          {opportunity.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">{opportunity.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Entreprise',
      sortable: true,
      render: (_value, opportunity) => {
        if (!opportunity.company_name) return <span className="text-muted-foreground">-</span>;
        
        // Find company logo if available
        const company = companies.find(c => c.id === opportunity.company_id);
        
        return (
          <div className="flex items-center gap-2 min-w-0">
            {company?.logo_url && (
              <img 
                src={company.logo_url} 
                alt={opportunity.company_name} 
                className="w-6 h-6 rounded object-cover flex-shrink-0"
              />
            )}
            <span className="font-medium truncate" title={opportunity.company_name}>{opportunity.company_name}</span>
          </div>
        );
      },
    },
    {
      key: 'stage_name',
      label: 'Statut',
      sortable: true,
      render: (value, opportunity) => {
        const stageName = opportunity.stage_name || value;
        if (!stageName) return <span className="text-muted-foreground">-</span>;
        
        return (
          <Badge 
            variant="default" 
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {String(stageName)}
          </Badge>
        );
      },
    },
    {
      key: 'pipeline_name',
      label: 'Pipeline',
      sortable: true,
      render: (_value, opportunity) => (
        <div className="font-medium">{opportunity.pipeline_name || '-'}</div>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (value) => {
        const amount = value as number | null | undefined;
        if (!amount) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="font-semibold text-foreground">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      key: 'region',
      label: 'Région',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Opportunités"
        description={`Gérez vos opportunités commerciales${opportunities.length > 0 ? ` - ${opportunities.length} opportunité${opportunities.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Opportunités' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Opportunity count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters ? (
                <span>
                  {filteredOpportunities.length} sur {opportunities.length} opportunité{opportunities.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {opportunities.length} opportunité{opportunities.length > 1 ? 's' : ''} au total
                </span>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par nom, description, entreprise..."
            className="w-full"
          />
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut (Stage) */}
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

            {/* Pipeline */}
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

            {/* Entreprise */}
            {companies.length > 0 && (
              <MultiSelect
                options={companies.map((company) => ({
                  label: company.name,
                  value: company.id.toString(),
                }))}
                value={filterCompany}
                onChange={setFilterCompany}
                placeholder="Filtrer par entreprise"
                className="min-w-[180px]"
              />
            )}

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Nouvelle opportunité
              </Button>

              {/* Actions menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {showActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowImportInstructions(true);
                            setShowActionsMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Instructions d'import
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await opportunitiesAPI.downloadTemplate();
                              setShowActionsMenu(false);
                            } catch (err) {
                              const appError = handleApiError(err);
                              showToast({
                                message: appError.message || 'Erreur lors du téléchargement du modèle',
                                type: 'error',
                              });
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Modèle Excel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await opportunitiesAPI.downloadZipTemplate();
                              setShowActionsMenu(false);
                              showToast({
                                message: 'Modèle ZIP téléchargé avec succès',
                                type: 'success',
                              });
                            } catch (err) {
                              const appError = handleApiError(err);
                              showToast({
                                message: appError.message || 'Erreur lors du téléchargement du modèle ZIP',
                                type: 'error',
                              });
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Modèle ZIP
                        </button>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImport(file);
                              setShowActionsMenu(false);
                            }
                          }}
                          className="hidden"
                          id="import-opportunities"
                        />
                        <label
                          htmlFor="import-opportunities"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Importer
                        </label>
                        <button
                          onClick={() => {
                            handleExport();
                            setShowActionsMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Exporter
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteAll();
                            setShowActionsMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border-t border-border"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer toutes les opportunités
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading && opportunities.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredOpportunities as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucune opportunité trouvée"
            loading={loading}
            infiniteScroll={!hasActiveFilters}
            hasMore={hasMore && !hasActiveFilters}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as Opportunity)}
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle opportunité"
        size="lg"
      >
        <OpportunityForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedOpportunity !== null}
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
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedOpportunity(null);
            }}
            loading={loading}
          />
        )}
      </Modal>

      {/* Import Instructions Modal */}
      <ImportOpportunitiesInstructions
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
        onDownloadTemplate={async () => {
          try {
            await opportunitiesAPI.downloadTemplate();
            showToast({
              message: 'Modèle Excel téléchargé avec succès',
              type: 'success',
            });
          } catch (err) {
            const appError = handleApiError(err);
            showToast({
              message: appError.message || 'Erreur lors du téléchargement du modèle',
              type: 'error',
            });
          }
        }}
        onDownloadZipTemplate={async () => {
          try {
            await opportunitiesAPI.downloadZipTemplate();
            showToast({
              message: 'Modèle ZIP téléchargé avec succès',
              type: 'success',
            });
          } catch (err) {
            const appError = handleApiError(err);
            showToast({
              message: appError.message || 'Erreur lors du téléchargement du modèle ZIP',
              type: 'error',
            });
          }
        }}
      />
      
      {/* Import Logs Modal */}
      {showImportLogs && (
        <Modal
          isOpen={showImportLogs}
          onClose={() => {
            setShowImportLogs(false);
            setCurrentImportId(null);
          }}
          title="Logs d'import en temps réel"
          size="xl"
        >
          {currentImportId ? (
            <ImportLogsViewer
              endpointUrl={`/v1/commercial/opportunities/import/${currentImportId}/logs`}
              importId={currentImportId}
              onComplete={() => {
                // Don't auto-close - let user close manually to review logs
              }}
            />
          ) : (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Initialisation de l'import...</p>
            </div>
          )}
        </Modal>
      )}
    </MotionDiv>
  );
}

export default function OpportunitiesPage() {
  return <OpportunitiesContent />;
}
