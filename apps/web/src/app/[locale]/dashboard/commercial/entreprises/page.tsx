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
import { companiesAPI, type Company, type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import CompaniesGallery from '@/components/commercial/CompaniesGallery';
import CompanyForm from '@/components/commercial/CompanyForm';
import { Plus, Edit, Trash2, Eye, List, Grid, Download, Upload, MoreVertical, Filter, X, Building2 } from 'lucide-react';
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
  const [filterIsClient, setFilterIsClient] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Load companies
  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const isClientFilter = filterIsClient === 'true' ? true : filterIsClient === 'false' ? false : undefined;
      const data = await companiesAPI.list(0, 1000, isClientFilter, filterCountry || undefined, searchTerm || undefined);
      setCompanies(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des entreprises');
      showToast({
        message: appError.message || 'Erreur lors du chargement des entreprises',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revalidate companies when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadCompanies();
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

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesIsClient = !filterIsClient || company.is_client.toString() === filterIsClient;
      const matchesCountry = !filterCountry || company.country === filterCountry;
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.website && company.website.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesIsClient && matchesCountry && matchesSearch;
    });
  }, [companies, filterIsClient, filterCountry, searchTerm]);

  // Active filters
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (filterIsClient) {
      filters.push({ key: 'is_client', label: 'Client', value: filterIsClient === 'true' ? 'Oui' : 'Non' });
    }
    if (filterCountry) {
      filters.push({ key: 'country', label: 'Pays', value: filterCountry });
    }
    if (searchTerm) {
      filters.push({ key: 'search', label: 'Recherche', value: searchTerm });
    }
    return filters;
  }, [filterIsClient, filterCountry, searchTerm]);

  // Handle create
  const handleCreate = async (data: CompanyCreate | CompanyUpdate) => {
    try {
      setLoading(true);
      setError(null);
      await companiesAPI.create(data as CompanyCreate);
      await loadCompanies();
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
      await loadCompanies();
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
  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await companiesAPI.delete(id);
      await loadCompanies();
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

  // Handle import
  const handleImport = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const result = await companiesAPI.import(file);
      
      if (result.valid_rows > 0) {
        await loadCompanies();
        showToast({
          message: `${result.valid_rows} entreprise(s) importée(s) avec succès`,
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
    router.push(`/${locale}/dashboard/commercial/entreprises/${company.id}`);
  };

  // Open edit modal
  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  // Get parent companies for dropdown (exclude self)
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
              className="w-10 h-10 rounded-lg object-contain border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (_value, company) => (
        <div>
          <div className="font-medium">{company.name}</div>
          {company.parent_company_name && (
            <div className="text-xs text-muted-foreground">Filiale de {company.parent_company_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'website',
      label: 'Site web',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      render: (_value, company) => (
        <span className="text-muted-foreground">
          {[company.city, company.country].filter(Boolean).join(', ') || '-'}
        </span>
      ),
    },
    {
      key: 'is_client',
      label: 'Client',
      sortable: true,
      render: (value) => (
        value ? (
          <Badge variant="success">Oui</Badge>
        ) : (
          <Badge variant="default">Non</Badge>
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
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Entreprises' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Top row: Search, Filters, View toggle, Actions */}
          <div className="flex flex-col gap-3">
            {/* Search and filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 min-w-[200px]"
              />

              {/* Filter toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs px-2 py-1.5 h-auto"
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Filtres
              </Button>

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
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs px-3 py-1.5 h-auto">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nouvelle entreprise
                </Button>

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
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter.key} variant="default" className="text-xs">
                    {filter.label}: {filter.value}
                    <button
                      onClick={() => {
                        if (filter.key === 'is_client') setFilterIsClient('');
                        else if (filter.key === 'country') setFilterCountry('');
                        else if (filter.key === 'search') setSearchTerm('');
                      }}
                      className="ml-1.5 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Filters section */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                {/* Client */}
                <select
                  value={filterIsClient}
                  onChange={(e) => setFilterIsClient(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[120px]"
                >
                  <option value="">Client</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>

                {/* Pays */}
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px]"
                >
                  <option value="">Pays</option>
                  {uniqueValues.countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            pageSize={10}
            searchable={false}
            filterable={false}
            emptyMessage="Aucune entreprise trouvée"
            loading={loading}
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
    </MotionDiv>
  );
}

export default function CompaniesPage() {
  return <CompaniesContent />;
}
