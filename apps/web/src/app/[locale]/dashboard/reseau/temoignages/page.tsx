'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Search, Building2, User, Calendar, Edit, Trash2, MessageSquare, TrendingUp, CheckCircle2, Clock, Languages } from 'lucide-react';
import { Badge, Button, Loading, Alert, Input, Text, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { handleApiError } from '@/lib/errors/api';
import { logger } from '@/lib/logger';
import { reseauTestimonialsAPI, type Testimonial, type TestimonialCreate } from '@/lib/api/reseau-testimonials';
import { contactsAPI } from '@/lib/api/contacts';
import { companiesAPI } from '@/lib/api/companies';

type FilterStatus = 'all' | 'published' | 'pending' | 'draft';

function TemoignagesContent() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'fr' | 'en'>('all');
  // État pour la langue affichée par témoignage (id -> langue)
  const [displayLanguages, setDisplayLanguages] = useState<Record<number, 'fr' | 'en'>>({});
  
  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour les formulaires
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
  
  // États pour les listes de contacts et entreprises
  const [allCompanies, setAllCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [allContacts, setAllContacts] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);

  useEffect(() => {
    loadTestimonials();
    loadCompaniesAndContacts();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reseauTestimonialsAPI.list(0, 1000);
      setTestimonials(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur de chargement');
      showToast({ message: appError.message || 'Erreur', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadCompaniesAndContacts = async () => {
    try {
      const [companiesData, contactsData] = await Promise.all([
        companiesAPI.list(0, 1000),
        contactsAPI.list(0, 1000, true), // skipPhotoUrls pour éviter les timeouts
      ]);
      setAllCompanies(companiesData.map(c => ({ id: c.id, name: c.name || '' })));
      setAllContacts(contactsData.map(c => ({ id: c.id, first_name: c.first_name, last_name: c.last_name })));
    } catch (err) {
      logger.error('Error loading companies/contacts', err);
      // Ne pas bloquer l'affichage si ça échoue
    }
  };

  // Handler pour créer un témoignage
  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      const created = await reseauTestimonialsAPI.create(testimonialForm);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler pour ouvrir la modal d'édition
  const handleOpenEdit = (testimonial: Testimonial) => {
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

  // Handler pour mettre à jour un témoignage
  const handleUpdate = async () => {
    if (!selectedTestimonial) return;
    try {
      setIsSubmitting(true);
      const updated = await reseauTestimonialsAPI.update(selectedTestimonial.id, testimonialForm);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler pour ouvrir la modal de suppression
  const handleOpenDelete = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial);
    setShowDeleteModal(true);
  };

  // Handler pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!testimonialToDelete) return;
    try {
      setIsSubmitting(true);
      await reseauTestimonialsAPI.delete(testimonialToDelete.id);
      setTestimonials(prev => prev.filter(t => t.id !== testimonialToDelete.id));
      setShowDeleteModal(false);
      setTestimonialToDelete(null);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatus = (isPublished?: string): 'published' | 'pending' | 'draft' => {
    if (isPublished === 'yes' || isPublished === '1' || isPublished === 'true') return 'published';
    if (isPublished === 'pending') return 'pending';
    return 'draft';
  };

  const getContent = (testimonial: Testimonial, displayLang?: 'fr' | 'en'): string => {
    // Utiliser la langue d'affichage si fournie, sinon utiliser la langue du témoignage
    const lang = displayLang || displayLanguages[testimonial.id] || testimonial.language || 'fr';
    
    if (lang === 'fr' && testimonial.testimonial_fr) {
      return testimonial.testimonial_fr;
    }
    if (lang === 'en' && testimonial.testimonial_en) {
      return testimonial.testimonial_en;
    }
    // Fallback: utiliser l'autre langue si disponible
    return testimonial.testimonial_fr || testimonial.testimonial_en || '';
  };

  const toggleLanguage = (testimonialId: number) => {
    const currentLang = displayLanguages[testimonialId] || 'fr';
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    setDisplayLanguages(prev => ({
      ...prev,
      [testimonialId]: newLang
    }));
  };

  const hasBothLanguages = (testimonial: Testimonial): boolean => {
    return !!(testimonial.testimonial_fr && testimonial.testimonial_en);
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      const status = getStatus(t.is_published);
      
      if (filterStatus !== 'all' && status !== filterStatus) return false;
      if (filterLanguage !== 'all' && t.language !== filterLanguage) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contentFr = t.testimonial_fr || '';
        const contentEn = t.testimonial_en || '';
        return (
          t.title?.toLowerCase().includes(query) ||
          contentFr.toLowerCase().includes(query) ||
          contentEn.toLowerCase().includes(query) ||
          t.contact_name?.toLowerCase().includes(query) ||
          t.company_name?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [testimonials, filterStatus, filterLanguage, searchQuery]);

  const stats = useMemo(() => {
    const published = testimonials.filter(t => getStatus(t.is_published) === 'published').length;
    const pending = testimonials.filter(t => getStatus(t.is_published) === 'pending').length;
    const validRatings = testimonials.filter(t => t.rating && t.rating > 0);
    const avgRating = validRatings.length > 0
      ? validRatings.reduce((sum, t) => sum + (t.rating || 0), 0) / validRatings.length
      : 0;
    
    return {
      total: testimonials.length,
      published,
      pending,
      avgRating: avgRating.toFixed(1)
    };
  }, [testimonials]);

  const getStatusColor = (status: 'published' | 'pending' | 'draft') => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: 'published' | 'pending' | 'draft') => {
    switch (status) {
      case 'published': return 'Publié';
      case 'pending': return 'En attente';
      case 'draft': return 'Brouillon';
    }
  };


  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Témoignages
              </h1>
              <Text variant="body" className="text-white/80 text-lg">Gérez les témoignages clients</Text>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90" 
              aria-label="Créer un nouveau témoignage"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Nouveau témoignage
            </Button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <MessageSquare className="w-6 h-6 text-primary-500" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <Text variant="small" className="text-muted-foreground">Total</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/30">
                <CheckCircle2 className="w-6 h-6 text-secondary-500" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.published}
            </div>
            <Text variant="small" className="text-muted-foreground">Publiés</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <Clock className="w-6 h-6 text-warning-500" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pending}
            </div>
            <Text variant="small" className="text-muted-foreground">En attente</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <TrendingUp className="w-6 h-6 text-warning-500" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgRating}
            </div>
            <Text variant="small" className="text-muted-foreground">Note moyenne</Text>
          </div>
        </div>

        <div className="glass-card p-lg rounded-xl border border-border">
          <div className="flex flex-col md:flex-row gap-md">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Rechercher un témoignage"
              />
            </div>

            <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtres par statut">
              <Button variant={filterStatus === 'all' ? 'primary' : 'outline'} onClick={() => setFilterStatus('all')} aria-pressed={filterStatus === 'all'}>Tous</Button>
              <Button variant={filterStatus === 'published' ? 'primary' : 'outline'} onClick={() => setFilterStatus('published')} aria-pressed={filterStatus === 'published'}>Publiés</Button>
              <Button variant={filterStatus === 'pending' ? 'primary' : 'outline'} onClick={() => setFilterStatus('pending')} aria-pressed={filterStatus === 'pending'}>En attente</Button>
              <Button variant={filterStatus === 'draft' ? 'primary' : 'outline'} onClick={() => setFilterStatus('draft')} aria-pressed={filterStatus === 'draft'}>Brouillons</Button>
            </div>

            <div className="flex gap-2" role="group" aria-label="Filtres par langue">
              <Button variant={filterLanguage === 'all' ? 'primary' : 'outline'} onClick={() => setFilterLanguage('all')} aria-pressed={filterLanguage === 'all'}>Toutes</Button>
              <Button variant={filterLanguage === 'fr' ? 'primary' : 'outline'} onClick={() => setFilterLanguage('fr')} aria-pressed={filterLanguage === 'fr'}>FR</Button>
              <Button variant={filterLanguage === 'en' ? 'primary' : 'outline'} onClick={() => setFilterLanguage('en')} aria-pressed={filterLanguage === 'en'}>EN</Button>
            </div>
          </div>
        </div>

        {filteredTestimonials.length === 0 ? (
          <div className="glass-card p-3xl rounded-xl border border-border text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucun témoignage trouvé
            </h3>
            <Text variant="body" className="text-muted-foreground mb-6">
              {searchQuery || filterStatus !== 'all' || filterLanguage !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre premier témoignage'}
            </Text>
            <Button 
              aria-label="Créer un nouveau témoignage"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Créer un témoignage
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => {
              const status = getStatus(testimonial.is_published);
              const displayLang = displayLanguages[testimonial.id] || testimonial.language || 'fr';
              const content = getContent(testimonial, displayLang as 'fr' | 'en');
              const hasBoth = hasBothLanguages(testimonial);
              
              return (
                <div
                  key={testimonial.id}
                  className="glass-card p-lg rounded-xl border border-border hover:scale-105 hover:border-primary-500/40 transition-all duration-200 group relative flex flex-col"
                >
                  {/* En-tête compact avec titre, statut et actions */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold mb-1 group-hover:text-primary-500 transition-colors truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {testimonial.title || 'Sans titre'}
                      </h3>
                      {/* Informations compactes en une ligne */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {testimonial.contact_name && (
                          <span className="truncate flex items-center gap-1">
                            <User className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            {testimonial.contact_name}
                          </span>
                        )}
                        {testimonial.company_name && (
                          <span className="truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            {testimonial.company_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          {new Date(testimonial.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-start flex-shrink-0 ml-2">
                      <Badge className={`${getStatusColor(status)} text-xs px-1.5 py-0.5`}>
                        {getStatusLabel(status)}
                      </Badge>
                      {hasBoth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLanguage(testimonial.id);
                          }}
                          className="p-1 rounded hover:bg-primary-500/10 hover:border-primary-500/30 border border-transparent transition-all flex items-center gap-0.5"
                          aria-label={`Changer la langue (actuellement ${displayLang.toUpperCase()})`}
                          title={`Basculer entre FR et EN`}
                        >
                          <Languages className="w-3 h-3 text-primary-500" />
                          <span className="text-[10px] font-medium text-primary-500">
                            {displayLang === 'fr' ? 'EN' : 'FR'}
                          </span>
                        </button>
                      )}
                      {!hasBoth && displayLang && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                          {displayLang.toUpperCase()}
                        </Badge>
                      )}
                      <div className="flex gap-0.5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800" 
                          aria-label={`Éditer le témoignage ${testimonial.title || 'sans titre'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(testimonial);
                          }}
                          title="Éditer"
                        >
                          <Edit className="w-3 h-3" aria-hidden="true" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400" 
                          aria-label={`Supprimer le témoignage ${testimonial.title || 'sans titre'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(testimonial);
                          }}
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Témoignage complet visible */}
                  <div className="flex-1 mt-2 mb-2">
                    <Text variant="small" className="text-muted-foreground leading-relaxed">
                      {content}
                    </Text>
                  </div>

                  {/* Footer optionnel pour indicateur bilingue */}
                  {hasBoth && (
                    <div className="flex items-center justify-end pt-2 border-t border-border mt-auto">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                        <Languages className="w-2.5 h-2.5" />
                        <span>FR/EN</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création */}
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
          size="lg"
        >
          <div className="space-y-4">
            <Select
              label="Entreprise"
              value={testimonialForm.company_id?.toString() || ''}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, company_id: e.target.value ? Number(e.target.value) : null })}
              options={allCompanies.map(c => ({ label: c.name, value: c.id.toString() }))}
              placeholder="Sélectionner une entreprise (optionnel)"
            />
            
            <Select
              label="Contact"
              value={testimonialForm.contact_id?.toString() || ''}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, contact_id: e.target.value ? Number(e.target.value) : null })}
              options={allContacts.map(c => ({ label: `${c.first_name} ${c.last_name}`, value: c.id.toString() }))}
              placeholder="Sélectionner un contact (optionnel)"
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
              placeholder="Témoignage en anglais (optionnel)"
              rows={5}
            />
            
            <Select
              label="Langue principale"
              value={testimonialForm.language || 'fr'}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, language: e.target.value })}
              options={[
                { label: 'Français', value: 'fr' },
                { label: 'Anglais', value: 'en' },
              ]}
            />
            
            <Select
              label="Statut de publication"
              value={testimonialForm.is_published || 'false'}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, is_published: e.target.value })}
              options={[
                { label: 'Publié', value: 'true' },
                { label: 'En attente', value: 'pending' },
                { label: 'Brouillon', value: 'false' },
              ]}
            />
            
            <Input
              label="Note (1-5)"
              type="number"
              min="1"
              max="5"
              value={testimonialForm.rating?.toString() || ''}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value ? Number(e.target.value) : null })}
              placeholder="Note sur 5 (optionnel)"
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
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
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal d'édition */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTestimonial(null);
          }}
          title="Modifier le témoignage"
          size="lg"
        >
          <div className="space-y-4">
            <Select
              label="Entreprise"
              value={testimonialForm.company_id?.toString() || ''}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, company_id: e.target.value ? Number(e.target.value) : null })}
              options={allCompanies.map(c => ({ label: c.name, value: c.id.toString() }))}
              placeholder="Sélectionner une entreprise (optionnel)"
            />
            
            <Select
              label="Contact"
              value={testimonialForm.contact_id?.toString() || ''}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, contact_id: e.target.value ? Number(e.target.value) : null })}
              options={allContacts.map(c => ({ label: `${c.first_name} ${c.last_name}`, value: c.id.toString() }))}
              placeholder="Sélectionner un contact (optionnel)"
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
              placeholder="Témoignage en anglais (optionnel)"
              rows={5}
            />
            
            <Select
              label="Langue principale"
              value={testimonialForm.language || 'fr'}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, language: e.target.value })}
              options={[
                { label: 'Français', value: 'fr' },
                { label: 'Anglais', value: 'en' },
              ]}
            />
            
            <Select
              label="Statut de publication"
              value={testimonialForm.is_published || 'false'}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, is_published: e.target.value })}
              options={[
                { label: 'Publié', value: 'true' },
                { label: 'En attente', value: 'pending' },
                { label: 'Brouillon', value: 'false' },
              ]}
            />
            
            <Input
              label="Note (1-5)"
              type="number"
              min="1"
              max="5"
              value={testimonialForm.rating?.toString() || ''}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value ? Number(e.target.value) : null })}
              placeholder="Note sur 5 (optionnel)"
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTestimonial(null);
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setTestimonialToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Supprimer le témoignage"
          message={testimonialToDelete 
            ? `Êtes-vous sûr de vouloir supprimer le témoignage "${testimonialToDelete.title || 'Sans titre'}" ? Cette action est irréversible.`
            : 'Êtes-vous sûr de vouloir supprimer ce témoignage ? Cette action est irréversible.'}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          loading={isSubmitting}
        />
      </MotionDiv>
    </PageContainer>
  );
}

export default function TemoignagesPage() {
  return <TemoignagesContent />;
}
