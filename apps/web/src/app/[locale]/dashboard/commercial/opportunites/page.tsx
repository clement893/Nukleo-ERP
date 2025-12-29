'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { opportunitiesAPI, type Opportunity, type OpportunityCreate, type OpportunityUpdate } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Plus, Edit, Trash2, Eye, Download, Upload, MoreVertical, FileSpreadsheet, Search } from 'lucide-react';
import { clsx } from 'clsx';
import MotionDiv from '@/components/motion/MotionDiv';
import OpportunityForm from '@/components/commercial/OpportunityForm';

function OpportunitesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPipeline, setFilterPipeline] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const statusOptions = ['open', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'cancelled'];

  // Load opportunities
  const loadOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await opportunitiesAPI.list(0, 1000, {
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        pipeline_id: filterPipeline || undefined,
        company_id: filterCompany ? parseInt(filterCompany) : undefined,
      });
      setOpportunities(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des opportunités');
      showToast({
        message: appError.message || 'Erreur lors du chargement des opportunités',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterPipeline, filterCompany]);

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const pipelines = new Set<string>();
    const companies = new Set<{ id: number; name: string }>();

    opportunities.forEach((opp) => {
      if (opp.pipeline_id) pipelines.add(opp.pipeline_id);
      if (opp.company_id && opp.company_name) {
        companies.add({ id: opp.company_id, name: opp.company_name });
      }
    });

    return {
      pipelines: Array.from(pipelines),
      companies: Array.from(companies),
    };
  }, [opportunities]);

  // Handle create
  const handleCreate = async (data: OpportunityCreate | OpportunityUpdate) => {
    try {
      setLoading(true);
      setError(null);
      await opportunitiesAPI.create(data as OpportunityCreate);
      await loadOpportunities();
      setShowCreateModal(false);
      showToast({
        message: 'Opportunité créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création de l\'opportunité');
      showToast({
        message: appError.message || 'Erreur lors de la création de l\'opportunité',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update
  const handleUpdate = async (data: OpportunityCreate | OpportunityUpdate) => {
    if (!selectedOpportunity) return;

    try {
      setLoading(true);
      setError(null);
      await opportunitiesAPI.update(selectedOpportunity.id, data as OpportunityUpdate);
      await loadOpportunities();
      setShowEditModal(false);
      setSelectedOpportunity(null);
      showToast({
        message: 'Opportunité modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification de l\'opportunité');
      showToast({
        message: appError.message || 'Erreur lors de la modification de l\'opportunité',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (opportunityId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await opportunitiesAPI.delete(opportunityId);
      await loadOpportunities();
      if (selectedOpportunity?.id === opportunityId) {
        setSelectedOpportunity(null);
      }
      showToast({
        message: 'Opportunité supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression de l\'opportunité');
      showToast({
        message: appError.message || 'Erreur lors de la suppression de l\'opportunité',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle import
  const handleImport = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const result = await opportunitiesAPI.import(file);
      
      if (result.valid_rows > 0) {
        await loadOpportunities();
        showToast({
          message: `${result.valid_rows} opportunité(s) importée(s) avec succès`,
          type: 'success',
        });
      }
      
      if (result.invalid_rows > 0) {
        showToast({
          message: `${result.invalid_rows} ligne(s) avec erreur(s)`,
          type: 'warning',
        });
      }
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de l\'import');
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
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
      setError(appError.message || 'Erreur lors de l\'export');
      showToast({
        message: appError.message || 'Erreur lors de l\'export',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigate to detail page
  const openDetailPage = (opportunity: Opportunity) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/opportunites/${opportunity.id}`);
  };

  // Open edit modal
  const openEditModal = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowEditModal(true);
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Table columns
  const columns: Column<Opportunity>[] = [
    {
      key: 'name',
      label: 'Nom de l\'opportunité',
      sortable: true,
      render: (value) => (
        <div className="font-medium">{String(value)}</div>
      ),
    },
    {
      key: 'company_name',
      label: 'Client ou entreprise lié',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        value ? (
          <Badge variant="default" className="capitalize">{String(value)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'pipeline_name',
      label: 'Pipeline',
      sortable: true,
      render: (_value, opportunity) => (
        <div>
          <div className="font-medium">{opportunity.pipeline_name || '-'}</div>
          {opportunity.stage_name && (
            <div className="text-sm text-muted-foreground">{opportunity.stage_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{formatCurrency(value as number | null)}</span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Opportunités"
        description="Gérez vos opportunités commerciales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Opportunités' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[120px]"
            >
              <option value="">Statut</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            {/* Company filter */}
            {uniqueValues.companies.length > 0 && (
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px]"
              >
                <option value="">Entreprise</option>
                {uniqueValues.companies.map((company) => (
                  <option key={company.id} value={company.id.toString()}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs px-3 py-1.5 h-auto">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nouvelle opportunité
            </Button>

            {/* Actions menu */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="text-xs px-2 py-1.5 h-auto"
                aria-label="Actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
              {showActionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
                    <div className="py-1">
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
                    </div>
                  </div>
                </>
              )}
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
            data={opportunities as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pageSize={10}
            searchable={false}
            filterable={false}
            emptyMessage="Aucune opportunité trouvée"
            loading={loading}
            onRowClick={(row) => openDetailPage(row as unknown as Opportunity)}
            actions={(row) => {
              const opportunity = row as unknown as Opportunity;
              return [
                {
                  label: 'Voir',
                  onClick: () => openDetailPage(opportunity),
                  icon: <Eye className="w-4 h-4" />,
                },
                {
                  label: 'Modifier',
                  onClick: () => openEditModal(opportunity),
                  icon: <Edit className="w-4 h-4" />,
                },
                {
                  label: 'Supprimer',
                  onClick: () => handleDelete(opportunity.id),
                  icon: <Trash2 className="w-4 h-4" />,
                  variant: 'danger',
                },
              ];
            }}
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
    </MotionDiv>
  );
}

export default function OpportunitesPage() {
  return <OpportunitesContent />;
}
