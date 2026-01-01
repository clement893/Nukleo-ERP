'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Search, Star, Building2, User, Calendar, Edit, Trash2, MessageSquare, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Badge, Button, Loading, Alert, Input, Heading, Text } from '@/components/ui';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors/api';
import { reseauTestimonialsAPI, type Testimonial } from '@/lib/api/reseau-testimonials';

type FilterStatus = 'all' | 'published' | 'pending' | 'draft';

function TemoignagesContent() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'fr' | 'en'>('all');

  useEffect(() => {
    loadTestimonials();
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

  const getStatus = (isPublished?: string): 'published' | 'pending' | 'draft' => {
    if (isPublished === 'yes' || isPublished === '1' || isPublished === 'true') return 'published';
    if (isPublished === 'pending') return 'pending';
    return 'draft';
  };

  const getContent = (testimonial: Testimonial): string => {
    if (testimonial.language === 'fr' && testimonial.testimonial_fr) {
      return testimonial.testimonial_fr;
    }
    if (testimonial.language === 'en' && testimonial.testimonial_en) {
      return testimonial.testimonial_en;
    }
    return testimonial.testimonial_fr || testimonial.testimonial_en || '';
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      const status = getStatus(t.is_published);
      
      if (filterStatus !== 'all' && status !== filterStatus) return false;
      if (filterLanguage !== 'all' && t.language !== filterLanguage) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const content = getContent(t);
        return (
          t.title?.toLowerCase().includes(query) ||
          content.toLowerCase().includes(query) ||
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

  const renderStars = (rating?: number | null) => {
    const ratingValue = rating || 0;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= ratingValue
                ? 'fill-[#F59E0B] text-[#F59E0B]'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
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
            <Button className="bg-white text-[#523DC9] hover:bg-white/90" aria-label="Créer un nouveau témoignage">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Nouveau témoignage
            </Button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <MessageSquare className="w-6 h-6 text-[#523DC9]" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <Text variant="small" className="text-muted-foreground">Total</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.published}
            </div>
            <Text variant="small" className="text-muted-foreground">Publiés</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Clock className="w-6 h-6 text-[#F59E0B]" aria-hidden="true" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pending}
            </div>
            <Text variant="small" className="text-muted-foreground">En attente</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" aria-hidden="true" />
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
            <Button aria-label="Créer un nouveau témoignage">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Créer un témoignage
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => {
              const status = getStatus(testimonial.is_published);
              const content = getContent(testimonial);
              
              return (
                <div
                  key={testimonial.id}
                  className="glass-card p-lg rounded-xl border border-border hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-2 group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {testimonial.title || 'Sans titre'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(status)}>
                        {getStatusLabel(status)}
                      </Badge>
                      {testimonial.language && (
                        <Badge variant="default">{testimonial.language.toUpperCase()}</Badge>
                      )}
                    </div>
                  </div>

                  <Text variant="small" className="text-muted-foreground mb-4 line-clamp-3">
                    {content}
                  </Text>

                  <div className="space-y-2 mb-4 pt-4 border-t border-border">
                    {testimonial.contact_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" aria-hidden="true" />
                        <span>{testimonial.contact_name}</span>
                      </div>
                    )}
                    {testimonial.company_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" aria-hidden="true" />
                        <span>{testimonial.company_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>{new Date(testimonial.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-white border-white hover:bg-white/10" 
                      aria-label={`Éditer le témoignage ${testimonial.title || 'sans titre'}`}
                    >
                      <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                      Éditer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-white border-white hover:bg-white/10" 
                      aria-label={`Supprimer le témoignage ${testimonial.title || 'sans titre'}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}

export default function TemoignagesPage() {
  return <TemoignagesContent />;
}
