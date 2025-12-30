'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { companiesAPI, type Company, type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import CompaniesGallery from '@/components/commercial/CompaniesGallery';
import CompanyForm from '@/components/commercial/CompanyForm';
import ImportCompaniesInstructions from '@/components/commercial/ImportCompaniesInstructions';
import { Plus, Edit, Trash2, Eye, List, Grid, Download, Upload, MoreVertical, FileSpreadsheet, Search, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import MotionDiv from '@/components/motion/MotionDiv';

type ViewMode = 'list' | 'gallery';

function CompaniesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterIsClient, setFilterIsClient] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  
  // Pagination pour le scroll infini
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load companies avec pagination
  const loadCompanies = async (reset = false) => {
    if (reset) {
      setSkip(0);
      setCompanies([]);
      setHasMore(true);
    }
    
    setLoading(reset);
    setLoadingMore(!reset);
    setError(null);
    
    try {
      const currentSkip = reset ? 0 : skip;
      const filters: { is_client?: boolean; country?: string; search?: string } = {};
      if (filterIsClient) {
        filters.is_client = filterIsClient === 'yes';
      }
      if (filterCountry) {
        filters.country = filterCountry;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      const data = await companiesAPI.list(currentSkip, limit, filters);
      
      if (reset) {
        setCompanies(data);
        setSkip(data.length);
      } else {
        setCompanies((prev) => [...prev, ...data]);
        setSkip((prevSkip) => prevSkip + data.length);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des entreprises');
      showToast({
        message: appError.message || 'Erreur lors du chargement des entreprises',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Charger plus pour le scroll infini
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !searchQuery && !filterCountry && !filterIsClient) {
      loadCompanies(false);
    }
  }, [loadingMore, hasMore, searchQuery, filterCountry, filterIsClient]);

  useEffect(() => {
    loadCompanies(true);
  }, [filterCountry, filterIsClient, searchQuery]);

  // Revalidate companies when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadCompanies(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const countries = new Set<string>();

    companies.forEach((company) => {
      if (company.country) countries.add(company.country);
    });

    return {
      countries: Array.from(countries).sort(),
    };
  }, [companies]);

  // Filtered companies (client-side filtering only if no server-side filters)
  const filteredCompanies = useMemo(() => {
    if (searchQuery || filterCountry || filterIsClient) {
      return companies; // Already filtered server-side
    }
    return companies;
  }, [companies, searchQuery, filterCountry, filterIsClient]);

  // Handle create
  const handleCreate = async (data: CompanyCreate | CompanyUpdate) => {
    try {
      setLoading(true);
      setError(null);
      await companiesAPI.create(data as CompanyCreate);
      await loadCompanies(true);
      setShowCreateModal(false);
      showToast({
        message: 'Entreprise créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création de l\'entreprise');
      showToast({
        message: appError.message || 'Erreur lors de la création de l\'entreprise',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update
  const handleUpdate = async (data: CompanyCreate | CompanyUpdate) => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      setError(null);
      await companiesAPI.update(selectedCompany.id, data as CompanyUpdate);
      await loadCompanies(true);
      setShowEditModal(false);
      setSelectedCompany(null);
      showToast({
        message: 'Entreprise modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification de l\'entreprise');
      showToast({
        message: appError.message || 'Erreur lors de la modification de l\'entreprise',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (companyId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await companiesAPI.delete(companyId);
      await loadCompanies(true);
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
      }
      showToast({
        message: 'Entreprise supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression de l\'entreprise');
      showToast({
        message: appError.message || 'Erreur lors de la suppression de l\'entreprise',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete all companies
  const handleDeleteAll = async () => {
    const count = companies.length;
    if (count === 0) {
      showToast({
        message: 'Aucune entreprise à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUTES les ${count} entreprise(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Toutes les entreprises seront définitivement supprimées. Tapez OK pour confirmer.'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await companiesAPI.deleteAll();
      await loadCompanies(true);
      setSelectedCompany(null);
      showToast({
        message: result.message || `${result.deleted_count} entreprise(s) supprimée(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression des entreprises');
      showToast({
        message: appError.message || 'Erreur lors de la suppression des entreprises',
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
      const result = await companiesAPI.import(file);
      
      if (result.valid_rows > 0) {
        await loadCompanies(true);
        const logosMsg = result.logos_uploaded && result.logos_uploaded > 0 ? ` (${result.logos_uploaded} logo(s) uploadé(s))` : '';
        showToast({
          message: `${result.valid_rows} entreprise(s) importée(s) avec succès${logosMsg}`,
          type: 'success',
        });
      }
      
      if (result.warnings && result.warnings.length > 0) {
        const warningsText = result.warnings
          .map(w => `Ligne ${w.row}: ${w.message}`)
          .join('\n');
        setError(`Avertissements d'import:\n${warningsText}`);
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
      const blob = await companiesAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entreprises-${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const openDetailPage = (company: Company) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/reseau/entreprises/${company.id}`);
  };

  // Open edit modal
  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  // Get parent companies for form (exclude self)
  const parentCompanies = useMemo(() => {
    return companies
      .filter(c => !selectedCompany || c.id !== selectedCompany.id)
      .map(c => ({ id: c.id, name: c.name }));
  }, [companies, selectedCompany]);

  // Table columns
  const columns: Column<Company>[] = [
    {
      key: 'logo_url',
      label: '',
      sortable: false,
      render: (value, company) => (
        <div className="flex items-center">
          {value ? (
            <img
              src={String(value)}
              alt={company.name}
              className="w-10 h-10 rounded object-cover border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center border border-border">
              <span className="text-xs font-medium">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nom de l\'entreprise',
      sortable: true,
      render: (_value, company) => (
        <div>
          <div className="font-medium">{company.name}</div>
          {company.parent_company_name && (
            <div className="text-sm text-muted-foreground">
              Filiale de {company.parent_company_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'website',
      label: 'Site web',
      sortable: true,
      render: (value) => (
        value ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {String(value).replace(/^https?:\/\//, '').substring(0, 30)}...
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'is_client',
      label: 'Client',
      sortable: true,
      render: (value) => (
        value ? (
          <Badge variant="default" className="bg-green-500">Oui</Badge>
        ) : (
          <Badge variant="default" className="border border-border">Non</Badge>
        )
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Entreprises"
        description="Gérez vos entreprises et organisations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Entreprises' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Top row: Filters, View toggle, Actions */}
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Pays */}
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[120px]"
              >
                <option value="">Pays</option>
                {uniqueValues.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* Client */}
              <select
                value={filterIsClient}
                onChange={(e) => setFilterIsClient(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px]"
              >
                <option value="">Client</option>
                <option value="yes">Oui</option>
                <option value="no">Non</option>
              </select>
            </div>

            {/* Bottom row: View toggle, Actions */}
            <div className="flex items-center justify-between">
              {/* View mode toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'px-2 py-1.5 transition-colors text-xs',
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-background text-foreground hover:bg-muted'
                  )}
                  aria-label="Vue liste"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('gallery')}
                  className={clsx(
                    'px-2 py-1.5 transition-colors text-xs',
                    viewMode === 'gallery'
                      ? 'bg-primary text-white'
                      : 'bg-background text-foreground hover:bg-muted'
                  )}
                  aria-label="Vue galerie"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions menu */}
              <div className="relative ml-auto">
                <div className="flex items-center gap-2">
                  {/* Primary action */}
                  <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs px-3 py-1.5 h-auto">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Nouvelle entreprise
                  </Button>

                  {/* Secondary actions dropdown */}
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
                                  await companiesAPI.downloadTemplate();
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
                                  await companiesAPI.downloadZipTemplate();
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
                              Modèle ZIP (avec logos)
                            </button>
                            <input
                              type="file"
                              accept=".xlsx,.xls,.zip"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImport(file);
                                  setShowActionsMenu(false);
                                }
                              }}
                              className="hidden"
                              id="import-companies"
                            />
                            <label
                              htmlFor="import-companies"
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
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 border-t border-border"
                              disabled={loading || companies.length === 0}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer toutes les entreprises
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
      {loading && companies.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <DataTable
            data={filteredCompanies as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucune entreprise trouvée"
            loading={loading}
            infiniteScroll={!searchQuery && !filterCountry && !filterIsClient}
            hasMore={hasMore && !searchQuery && !filterCountry && !filterIsClient}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as Company)}
            actions={(row) => {
              const company = row as unknown as Company;
              return [
                {
                  label: 'Voir',
                  onClick: () => openDetailPage(company),
                  icon: <Eye className="w-4 h-4" />,
                },
                {
                  label: 'Modifier',
                  onClick: () => openEditModal(company),
                  icon: <Edit className="w-4 h-4" />,
                },
                {
                  label: 'Supprimer',
                  onClick: () => handleDelete(company.id),
                  icon: <Trash2 className="w-4 h-4" />,
                  variant: 'danger',
                },
              ];
            }}
          />
        </Card>
      ) : (
        <CompaniesGallery
          companies={filteredCompanies}
          onCompanyClick={openDetailPage}
          hasMore={hasMore && !searchQuery && !filterCountry && !filterIsClient}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle entreprise"
        size="lg"
      >
        <CompanyForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
          parentCompanies={parentCompanies}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedCompany !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCompany(null);
        }}
        title="Modifier l'entreprise"
        size="lg"
      >
        {selectedCompany && (
          <CompanyForm
            company={selectedCompany}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedCompany(null);
            }}
            loading={loading}
            parentCompanies={parentCompanies}
          />
        )}
      </Modal>

      {/* Import Instructions Modal */}
      <ImportCompaniesInstructions
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
        onDownloadTemplate={async () => {
          try {
            await companiesAPI.downloadZipTemplate();
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
    </MotionDiv>
  );
}

export default function CompaniesPage() {
  return <CompaniesContent />;
}
