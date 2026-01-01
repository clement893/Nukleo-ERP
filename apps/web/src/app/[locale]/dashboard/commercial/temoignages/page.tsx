'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Button, Alert, Loading, Badge, Input, Select, Textarea, Card } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Testimonial, type TestimonialCreate, testimonialsAPI } from '@/lib/api/testimonials';
import { contactsAPI } from '@/lib/api/contacts';
import { companiesAPI } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import SearchBar from '@/components/ui/SearchBar';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical, 
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';

function TemoignagesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [filterLanguage, setFilterLanguage] = useState<string[]>([]);
  const [filterPublished, setFilterPublished] = useState<string[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [allCompanies, setAllCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [allContacts, setAllContacts] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Form state
  const [testimonialForm, setTestimonialForm] = useState<TestimonialCreate>({
    contact_id: null,
    company_id: null,
    title: '',
    testimonial_fr: '',
    testimonial_en: '',
    language: 'fr',
    logo_url: null,
    logo_filename: null,
    is_published: 'false',
    rating: null,
  });

  // Load testimonials
  const loadTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await testimonialsAPI.list({
        skip: 0,
        limit: 1000,
        ...(filterCompany.length > 0 && { company_id: Number(filterCompany[0]) }),
        ...(filterLanguage.length > 0 && { language: filterLanguage[0] }),
        ...(filterPublished.length > 0 && { is_published: filterPublished[0] }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
      });
      setTestimonials(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des témoignages');
    } finally {
      setLoading(false);
    }
  }, [filterCompany, filterLanguage, filterPublished, debouncedSearchQuery]);

  // Load companies and contacts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, contactsData] = await Promise.all([
          companiesAPI.list(0, 1000),
          contactsAPI.list(0, 1000),
        ]);
        setAllCompanies(companiesData.map(c => ({ id: c.id, name: c.name || '' })));
        setAllContacts(contactsData.map(c => ({ id: c.id, first_name: c.first_name, last_name: c.last_name })));
      } catch (err) {
        console.error('Error loading companies/contacts:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  // Filtered testimonials
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((testimonial) => {
      const matchesCompany = filterCompany.length === 0 || 
        (testimonial.company_id && filterCompany.includes(testimonial.company_id.toString()));
      const matchesLanguage = filterLanguage.length === 0 || 
        (testimonial.language && filterLanguage.includes(testimonial.language));
      const matchesPublished = filterPublished.length === 0 || 
        (testimonial.is_published && filterPublished.includes(testimonial.is_published));
      const matchesSearch = !debouncedSearchQuery || 
        testimonial.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.testimonial_fr?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.testimonial_en?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        testimonial.contact_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesCompany && matchesLanguage && matchesPublished && matchesSearch;
    });
  }, [testimonials, filterCompany, filterLanguage, filterPublished, debouncedSearchQuery]);

  const hasActiveFilters = !!(filterCompany.length > 0 || filterLanguage.length > 0 || filterPublished.length > 0 || debouncedSearchQuery);

  const clearAllFilters = useCallback(() => {
    setFilterCompany([]);
    setFilterLanguage([]);
    setFilterPublished([]);
    setSearchQuery('');
  }, []);

  // Handle create
  const handleCreate = async () => {
    try {
      const created = await testimonialsAPI.create(testimonialForm);
      setTestimonials(prev => [created, ...prev]);
      setShowCreateModal(false);
      setTestimonialForm({
        contact_id: null,
        company_id: null,
        title: '',
        testimonial_fr: '',
        testimonial_en: '',
        language: 'fr',
        logo_url: null,
        logo_filename: null,
        is_published: 'false',
        rating: null,
      });
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
  const handleUpdate = async () => {
    if (!selectedTestimonial) return;
    try {
      const updated = await testimonialsAPI.update(selectedTestimonial.id, testimonialForm);
      setTestimonials(prev => prev.map(t => t.id === updated.id ? updated : t));
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
      await testimonialsAPI.delete(testimonialId);
      setTestimonials(prev => prev.filter(t => t.id !== testimonialId));
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

  // Handle import
  const handleImport = async (file: File) => {
    try {
      const result = await testimonialsAPI.import(file);
      await loadTestimonials();
      showToast({
        message: `${result.valid_rows} témoignage(s) importé(s) avec succès`,
        type: 'success',
      });
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
      const blob = await testimonialsAPI.export();
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

  // Open detail page
  const openDetailPage = (testimonial: Testimonial) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/temoignages/${testimonial.id}`);
  };

  // Open edit modal
  const openEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setTestimonialForm({
      contact_id: testimonial.contact_id,
      company_id: testimonial.company_id,
      title: testimonial.title || '',
      testimonial_fr: testimonial.testimonial_fr || '',
      testimonial_en: testimonial.testimonial_en || '',
      language: testimonial.language || 'fr',
      logo_url: testimonial.logo_url,
      logo_filename: testimonial.logo_filename,
      is_published: testimonial.is_published || 'false',
      rating: testimonial.rating,
    });
    setShowEditModal(true);
  };

  // Table columns
  const columns: Column<Testimonial>[] = [
    {
      key: 'company_name',
      label: 'Entreprise',
      sortable: true,
      render: (value) => (
        <span className="font-medium truncate block" title={value ? String(value) : undefined}>{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'contact_name',
      label: 'Contact',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (value, testimonial) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium">{value ? String(value) : '-'}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">
              {testimonial.testimonial_fr || testimonial.testimonial_en || '-'}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDetailPage(testimonial)}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(testimonial)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(testimonial.id)}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'language',
      label: 'Langue',
      sortable: true,
      render: (value) => (
        <Badge variant="info" className="uppercase">
          {value ? String(value) : 'fr'}
        </Badge>
      ),
    },
    {
      key: 'is_published',
      label: 'Publié',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'true' ? 'success' : 'default'}>
          {value === 'true' ? 'Oui' : 'Non'}
        </Badge>
      ),
    },
    {
      key: 'rating',
      label: 'Note',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {value ? `${value}/5` : '-'}
        </span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Témoignages"
        description={`Gérez les témoignages clients${testimonials.length > 0 ? ` - ${testimonials.length} témoignage${testimonials.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Témoignages' },
        ]}
      />

      {/* Toolbar */}
      <div className="glass-card rounded-xl border border-border p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters ? (
                <span>
                  {filteredTestimonials.length} témoignage{filteredTestimonials.length > 1 ? 's' : ''} sur {testimonials.length}
                </span>
              ) : (
                <span>{testimonials.length} témoignage{testimonials.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par titre, témoignage, entreprise, contact..."
            className="w-full"
          />
          
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filterCompany.length > 0 && (
                <Badge variant="default" className="cursor-pointer" onClick={() => setFilterCompany([])}>
                  Entreprise: {allCompanies.find(c => c.id.toString() === filterCompany[0])?.name || filterCompany[0]} ×
                </Badge>
              )}
              {filterLanguage.length > 0 && (
                <Badge variant="default" className="cursor-pointer" onClick={() => setFilterLanguage([])}>
                  Langue: {filterLanguage[0]} ×
                </Badge>
              )}
              {filterPublished.length > 0 && (
                <Badge variant="default" className="cursor-pointer" onClick={() => setFilterPublished([])}>
                  Publié: {filterPublished[0] === 'true' ? 'Oui' : 'Non'} ×
                </Badge>
              )}
              {debouncedSearchQuery && (
                <Badge variant="default" className="cursor-pointer" onClick={() => setSearchQuery('')}>
                  Recherche: {debouncedSearchQuery} ×
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Tout effacer
              </Button>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="Entreprise"
              value={filterCompany[0] || ''}
              onChange={(e) => setFilterCompany(e.target.value ? [e.target.value] : [])}
              options={allCompanies.map(c => ({ label: c.name, value: c.id.toString() }))}
              placeholder="Toutes les entreprises"
            />
            
            <Select
              label="Langue"
              value={filterLanguage[0] || ''}
              onChange={(e) => setFilterLanguage(e.target.value ? [e.target.value] : [])}
              options={[
                { label: 'Français', value: 'fr' },
                { label: 'Anglais', value: 'en' },
              ]}
              placeholder="Toutes les langues"
            />
            
            <Select
              label="Publié"
              value={filterPublished[0] || ''}
              onChange={(e) => setFilterPublished(e.target.value ? [e.target.value] : [])}
              options={[
                { label: 'Oui', value: 'true' },
                { label: 'Non', value: 'false' },
              ]}
              placeholder="Tous"
            />
            
            <div className="ml-auto flex items-center gap-2">
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
                          onClick={async () => {
                            try {
                              await testimonialsAPI.downloadTemplate();
                              setShowActionsMenu(false);
                            } catch (err) {
                              const appError = handleApiError(err);
                              showToast({
                                message: appError.message || 'Erreur lors du téléchargement du modèle',
                                type: 'error',
                              });
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Modèle Excel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await testimonialsAPI.downloadZipTemplate();
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
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && <Loading />}

      {/* Table */}
      {!loading && (
        <Card>
          <DataTable
            data={filteredTestimonials as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            emptyMessage="Aucun témoignage trouvé"
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setTestimonialForm({
            contact_id: null,
            company_id: null,
            title: '',
            testimonial_fr: '',
            testimonial_en: '',
            language: 'fr',
            logo_url: null,
            logo_filename: null,
            is_published: 'false',
            rating: null,
          });
        }}
        title="Créer un témoignage"
      >
        <div className="space-y-4">
          <Select
            label="Entreprise"
            value={testimonialForm.company_id?.toString() || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, company_id: e.target.value ? Number(e.target.value) : null })}
            options={allCompanies.map(c => ({ label: c.name, value: c.id.toString() }))}
            placeholder="Sélectionner une entreprise"
          />
          
          <Select
            label="Contact"
            value={testimonialForm.contact_id?.toString() || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, contact_id: e.target.value ? Number(e.target.value) : null })}
            options={allContacts.map(c => ({ label: `${c.first_name} ${c.last_name}`, value: c.id.toString() }))}
            placeholder="Sélectionner un contact"
          />
          
          <Input
            label="Titre"
            value={testimonialForm.title || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, title: e.target.value })}
            placeholder="Titre du témoignage"
          />
          
          <Textarea
            label="Témoignage (FR)"
            value={testimonialForm.testimonial_fr || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial_fr: e.target.value })}
            placeholder="Témoignage en français"
            rows={5}
          />
          
          <Textarea
            label="Témoignage (EN)"
            value={testimonialForm.testimonial_en || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial_en: e.target.value })}
            placeholder="Témoignage en anglais"
            rows={5}
          />
          
          <Select
            label="Langue"
            value={testimonialForm.language || 'fr'}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, language: e.target.value })}
            options={[
              { label: 'Français', value: 'fr' },
              { label: 'Anglais', value: 'en' },
            ]}
          />
          
          <Select
            label="Publié"
            value={testimonialForm.is_published || 'false'}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, is_published: e.target.value })}
            options={[
              { label: 'Oui', value: 'true' },
              { label: 'Non', value: 'false' },
            ]}
          />
          
          <Input
            label="Note (1-5)"
            type="number"
            min="1"
            max="5"
            value={testimonialForm.rating?.toString() || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value ? Number(e.target.value) : null })}
            placeholder="Note sur 5"
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTestimonial(null);
        }}
        title="Modifier le témoignage"
      >
        <div className="space-y-4">
          <Select
            label="Entreprise"
            value={testimonialForm.company_id?.toString() || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, company_id: e.target.value ? Number(e.target.value) : null })}
            options={allCompanies.map(c => ({ label: c.name, value: c.id.toString() }))}
            placeholder="Sélectionner une entreprise"
          />
          
          <Select
            label="Contact"
            value={testimonialForm.contact_id?.toString() || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, contact_id: e.target.value ? Number(e.target.value) : null })}
            options={allContacts.map(c => ({ label: `${c.first_name} ${c.last_name}`, value: c.id.toString() }))}
            placeholder="Sélectionner un contact"
          />
          
          <Input
            label="Titre"
            value={testimonialForm.title || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, title: e.target.value })}
            placeholder="Titre du témoignage"
          />
          
          <Textarea
            label="Témoignage (FR)"
            value={testimonialForm.testimonial_fr || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial_fr: e.target.value })}
            placeholder="Témoignage en français"
            rows={5}
          />
          
          <Textarea
            label="Témoignage (EN)"
            value={testimonialForm.testimonial_en || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial_en: e.target.value })}
            placeholder="Témoignage en anglais"
            rows={5}
          />
          
          <Select
            label="Langue"
            value={testimonialForm.language || 'fr'}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, language: e.target.value })}
            options={[
              { label: 'Français', value: 'fr' },
              { label: 'Anglais', value: 'en' },
            ]}
          />
          
          <Select
            label="Publié"
            value={testimonialForm.is_published || 'false'}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, is_published: e.target.value })}
            options={[
              { label: 'Oui', value: 'true' },
              { label: 'Non', value: 'false' },
            ]}
          />
          
          <Input
            label="Note (1-5)"
            type="number"
            min="1"
            max="5"
            value={testimonialForm.rating?.toString() || ''}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value ? Number(e.target.value) : null })}
            placeholder="Note sur 5"
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate}>
              Modifier
            </Button>
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}

export default function TemoignagesPage() {
  return <TemoignagesContent />;
}
