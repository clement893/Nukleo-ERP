'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Testimonial, type TestimonialCreate, type TestimonialUpdate } from '@/lib/api/reseau-testimonials';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelectFilter from '@/components/reseau/MultiSelectFilter';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical, 
  Trash2,
  Edit,
  HelpCircle
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteReseauTestimonials, 
  useCreateReseauTestimonial, 
  useUpdateReseauTestimonial, 
  useDeleteReseauTestimonial, 
  useDeleteAllReseauTestimonials,
  reseauTestimonialsAPI 
} from '@/lib/query/reseau-testimonials';
import { companiesAPI } from '@/lib/api/companies';
import { reseauContactsAPI } from '@/lib/api/reseau-contacts';
import TestimonialForm from '@/components/reseau/TestimonialForm';
import ImportTestimonialsInstructions from '@/components/reseau/ImportTestimonialsInstructions';
import ImportLogsViewer from '@/components/commercial/ImportLogsViewer';
import TestimonialContact from '@/components/reseau/TestimonialContact';

function TemoignagesContent() {
  const { showToast } = useToast();
  
  // React Query hooks for testimonials
  const {
    data: testimonialsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteReseauTestimonials(20);
  
  // Mutations
  const createTestimonialMutation = useCreateReseauTestimonial();
  const updateTestimonialMutation = useUpdateReseauTestimonial();
  const deleteTestimonialMutation = useDeleteReseauTestimonial();
  const deleteAllTestimonialsMutation = useDeleteAllReseauTestimonials();
  
  // Flatten pages into single array
  const testimonials = useMemo(() => {
    return testimonialsData?.pages.flat() || [];
  }, [testimonialsData]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [filterContact, setFilterContact] = useState<string[]>([]);
  const [filterLanguage, setFilterLanguage] = useState<string[]>([]);
  const [filterPublished, setFilterPublished] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showImportLogs, setShowImportLogs] = useState(false);
  
  // Load companies and contacts for filters
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, contactsData] = await Promise.all([
          companiesAPI.list(0, 1000),
          reseauContactsAPI.list(0, 1000),
        ]);
        setCompanies(companiesData.map(c => ({ id: c.id, name: c.name })));
        setContacts(contactsData.map(c => ({ id: c.id, first_name: c.first_name, last_name: c.last_name })));
      } catch (err) {
        console.error('Error loading companies/contacts:', err);
      }
    };
    loadData();
  }, []);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Load more testimonials for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const languages = new Set<string>();
    const publishedStatuses = new Set<string>();

    testimonials.forEach((testimonial) => {
      if (testimonial.language) languages.add(testimonial.language);
      if (testimonial.is_published) publishedStatuses.add(testimonial.is_published);
    });

    return {
      languages: Array.from(languages).sort(),
      publishedStatuses: Array.from(publishedStatuses).sort(),
    };
  }, [testimonials]);

  // Filtered testimonials with debounced search
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((testimonial) => {
      // Company filter
      const matchesCompany = filterCompany.length === 0 || 
        (testimonial.company_id && filterCompany.includes(testimonial.company_id.toString()));
      
      // Contact filter
      const matchesContact = filterContact.length === 0 || 
        (testimonial.contact_id && filterContact.includes(testimonial.contact_id.toString()));
      
      // Language filter
      const matchesLanguage = filterLanguage.length === 0 || 
        (testimonial.language && filterLanguage.includes(testimonial.language));
      
      // Published filter
      const matchesPublished = filterPublished.length === 0 || 
        (testimonial.is_published && filterPublished.includes(testimonial.is_published));
      
      // Search filter
      const matchesSearch = !debouncedSearchQuery || 
        testimonial.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.testimonial_fr?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.testimonial_en?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.contact_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      return matchesCompany && matchesContact && matchesLanguage && matchesPublished && matchesSearch;
    });
  }, [testimonials, filterCompany, filterContact, filterLanguage, filterPublished, debouncedSearchQuery]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilterCompany([]);
    setFilterContact([]);
    setFilterLanguage([]);
    setFilterPublished([]);
    setSearchQuery('');
  }, []);

  const hasActiveFilters = filterCompany.length > 0 || filterContact.length > 0 || 
    filterLanguage.length > 0 || filterPublished.length > 0 || searchQuery.length > 0;

  // Handle create
  const handleCreate = async (testimonial: TestimonialCreate) => {
    try {
      await createTestimonialMutation.mutateAsync(testimonial);
      setShowCreateModal(false);
      showToast({
        message: 'Témoignage créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du témoignage',
        type: 'error',
      });
    }
  };

  // Handle update
  const handleUpdate = async (testimonial: TestimonialUpdate) => {
    if (!selectedTestimonial) return;
    
    try {
      await updateTestimonialMutation.mutateAsync({ id: selectedTestimonial.id, data: testimonial });
      setShowEditModal(false);
      setSelectedTestimonial(null);
      showToast({
        message: 'Témoignage modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du témoignage',
        type: 'error',
      });
    }
  };

  // Handle delete
  const handleDelete = async (testimonialId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      return;
    }

    try {
      await deleteTestimonialMutation.mutateAsync(testimonialId);
      if (selectedTestimonial?.id === testimonialId) {
        setSelectedTestimonial(null);
      }
      showToast({
        message: 'Témoignage supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du témoignage',
        type: 'error',
      });
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    const count = testimonials.length;
    if (count === 0) {
      showToast({
        message: 'Aucun témoignage à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les ${count} témoignage(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteAllTestimonialsMutation.mutateAsync();
      setSelectedTestimonial(null);
      showToast({
        message: result.message || `${result.deleted_count} témoignage(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des témoignages',
        type: 'error',
      });
    }
  };

  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Handle import
  const handleImport = async (file: File) => {
    try {
      // Generate import_id before starting import
      const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentImportId(importId);
      setShowImportLogs(true);
      
      const result = await reseauTestimonialsAPI.import(file, importId);
      
      // Update import_id if backend returns a different one (should be the same)
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        // Invalidate testimonials query to refetch after import
        queryClient.invalidateQueries({ queryKey: ['reseau-testimonials'] });
        
        showToast({
          message: `${result.valid_rows} témoignage(s) importé(s) avec succès`,
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
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await reseauTestimonialsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temoignages-${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Open edit modal
  const openEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowEditModal(true);
  };

  // Table columns
  const columns: Column<Testimonial>[] = [
    {
      key: 'company_name',
      label: 'Entreprise',
      sortable: true,
      render: (_value, testimonial) => (
        <div className="flex items-center gap-2 min-w-0">
          {testimonial.company_logo_url && (
            <img 
              src={testimonial.company_logo_url} 
              alt={testimonial.company_name || ''} 
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          )}
          <span className="truncate" title={testimonial.company_name || undefined}>{testimonial.company_name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'contact_name',
      label: 'Contact',
      sortable: true,
      render: (_value, testimonial) => (
        <TestimonialContact
          testimonial={testimonial}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['reseau-testimonials'] });
          }}
          compact={true}
        />
      ),
    },
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (_value, testimonial) => (
        <span className="font-medium truncate block" title={testimonial.title || undefined}>{testimonial.title || '-'}</span>
      ),
    },
    {
      key: 'testimonial_fr',
      label: 'Témoignage (FR)',
      sortable: false,
      render: (_value, testimonial) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {testimonial.testimonial_fr || '-'}
        </span>
      ),
    },
    {
      key: 'is_published',
      label: 'Statut',
      sortable: true,
      render: (_value, testimonial) => (
        <Badge variant={testimonial.is_published === 'published' ? 'success' : 'default'}>
          {testimonial.is_published === 'published' ? 'Publié' : 'Brouillon'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_value, testimonial) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(testimonial);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(testimonial.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Témoignages"
        description="Gérez les témoignages clients"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Témoignages' },
        ]}
      />

      {/* Header Card */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Témoignages
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredTestimonials.length} témoignage(s) {hasActiveFilters ? `(filtré sur ${testimonials.length} total)` : ''}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau témoignage
              </Button>
              
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
                          id="import-testimonials"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await reseauTestimonialsAPI.downloadTemplate();
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
                              await reseauTestimonialsAPI.downloadZipTemplate();
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
                          id="import-testimonials"
                        />
                        <label
                          htmlFor="import-testimonials"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted cursor-pointer border-t border-border"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Importer
                        </label>
                        <button
                          onClick={() => {
                            handleExport();
                            setShowActionsMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
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
                          disabled={loading || testimonials.length === 0}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer tous
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par titre, témoignage, contact, entreprise..."
            className="w-full"
          />
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {companies.length > 0 && (
              <MultiSelectFilter
                label="Entreprise"
                options={companies.map((company) => ({
                  value: company.id.toString(),
                  label: company.name,
                }))}
                selectedValues={filterCompany}
                onSelectionChange={setFilterCompany}
                className="min-w-[150px]"
              />
            )}
            
            {contacts.length > 0 && (
              <MultiSelectFilter
                label="Contact"
                options={contacts.map((contact) => ({
                  value: contact.id.toString(),
                  label: `${contact.first_name} ${contact.last_name}`,
                }))}
                selectedValues={filterContact}
                onSelectionChange={setFilterContact}
                className="min-w-[150px]"
              />
            )}
            
            <MultiSelectFilter
              label="Langue"
              options={uniqueValues.languages.map((lang) => ({
                value: lang,
                label: lang.toUpperCase(),
              }))}
              selectedValues={filterLanguage}
              onSelectionChange={setFilterLanguage}
              className="min-w-[100px]"
            />
            
            <MultiSelectFilter
              label="Statut"
              options={uniqueValues.publishedStatuses.map((status) => ({
                value: status,
                label: status === 'published' ? 'Publié' : 'Brouillon',
              }))}
              selectedValues={filterPublished}
              onSelectionChange={setFilterPublished}
              className="min-w-[120px]"
            />
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Effacer les filtres
              </Button>
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
      {loading && testimonials.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredTestimonials as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun témoignage trouvé"
            loading={loading}
            infiniteScroll={filterCompany.length === 0 && filterContact.length === 0 && filterLanguage.length === 0 && filterPublished.length === 0}
            hasMore={hasMore && filterCompany.length === 0 && filterContact.length === 0 && filterLanguage.length === 0 && filterPublished.length === 0}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau témoignage"
        size="lg"
      >
        <TestimonialForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
          companies={companies}
          contacts={contacts}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedTestimonial !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTestimonial(null);
        }}
        title="Modifier le témoignage"
        size="lg"
      >
        {selectedTestimonial && (
          <TestimonialForm
            testimonial={selectedTestimonial}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedTestimonial(null);
            }}
            loading={loading}
            companies={companies}
            contacts={contacts}
          />
        )}
      </Modal>

      {/* Import Instructions Modal */}
      <ImportTestimonialsInstructions
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
        onDownloadTemplate={async () => {
          try {
            await reseauTestimonialsAPI.downloadZipTemplate();
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
              endpointUrl={`/v1/reseau/testimonials/import/${currentImportId}/logs`}
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

export default function TemoignagesPage() {
  return <TemoignagesContent />;
}
