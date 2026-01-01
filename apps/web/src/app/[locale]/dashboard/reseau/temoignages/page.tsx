'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Search, Star, Building2, User, Calendar, Edit, Trash2, MessageSquare, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Badge, Button, Loading, Alert, Input } from '@/components/ui';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors/api';

interface Testimonial {
  id: number;
  title: string;
  content: string;
  rating: number;
  status: 'published' | 'pending' | 'draft';
  language: 'fr' | 'en';
  contact_name?: string;
  company_name?: string;
  created_at: string;
}

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
      
      const mockData: Testimonial[] = [
        {
          id: 1,
          title: 'Excellent service',
          content: 'Nukleo a transformé notre façon de travailler. L\'équipe est professionnelle et réactive.',
          rating: 5,
          status: 'published',
          language: 'fr',
          contact_name: 'Marie Dubois',
          company_name: 'Tech Solutions Inc.',
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: 2,
          title: 'Great experience',
          content: 'Working with Nukleo has been amazing. Their AI solutions are cutting-edge.',
          rating: 5,
          status: 'published',
          language: 'en',
          contact_name: 'John Smith',
          company_name: 'Innovation Labs',
          created_at: '2025-01-10T14:30:00Z'
        },
        {
          id: 3,
          title: 'Très satisfait',
          content: 'Une plateforme intuitive et puissante. Le ROI a été visible dès les premières semaines.',
          rating: 4,
          status: 'pending',
          language: 'fr',
          contact_name: 'Sophie Tremblay',
          company_name: 'Groupe Innovant',
          created_at: '2025-01-20T09:15:00Z'
        }
      ];
      
      setTestimonials(mockData);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur de chargement');
      showToast({ message: appError.message || 'Erreur', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterLanguage !== 'all' && t.language !== filterLanguage) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query) ||
          t.contact_name?.toLowerCase().includes(query) ||
          t.company_name?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [testimonials, filterStatus, filterLanguage, searchQuery]);

  const stats = useMemo(() => {
    const published = testimonials.filter(t => t.status === 'published').length;
    const pending = testimonials.filter(t => t.status === 'pending').length;
    const avgRating = testimonials.length > 0
      ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
      : 0;
    
    return {
      total: testimonials.length,
      published,
      pending,
      avgRating: avgRating.toFixed(1)
    };
  }, [testimonials]);

  const getStatusColor = (status: Testimonial['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Testimonial['status']) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'pending': return 'En attente';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
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
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Témoignages
              </h1>
              <p className="text-white/80 text-lg">Gérez les témoignages clients</p>
            </div>
            <Button className="bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau témoignage
            </Button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <MessageSquare className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.published}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Publiés</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgRating}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Note moyenne</div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')}>Tous</Button>
              <Button variant={filterStatus === 'published' ? 'default' : 'outline'} onClick={() => setFilterStatus('published')}>Publiés</Button>
              <Button variant={filterStatus === 'pending' ? 'default' : 'outline'} onClick={() => setFilterStatus('pending')}>En attente</Button>
              <Button variant={filterStatus === 'draft' ? 'default' : 'outline'} onClick={() => setFilterStatus('draft')}>Brouillons</Button>
            </div>

            <div className="flex gap-2">
              <Button variant={filterLanguage === 'all' ? 'default' : 'outline'} onClick={() => setFilterLanguage('all')}>Toutes</Button>
              <Button variant={filterLanguage === 'fr' ? 'default' : 'outline'} onClick={() => setFilterLanguage('fr')}>FR</Button>
              <Button variant={filterLanguage === 'en' ? 'default' : 'outline'} onClick={() => setFilterLanguage('en')}>EN</Button>
            </div>
          </div>
        </div>

        {filteredTestimonials.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucun témoignage trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterStatus !== 'all' || filterLanguage !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre premier témoignage'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un témoignage
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {testimonial.title}
                    </h3>
                    {renderStars(testimonial.rating)}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(testimonial.status)}>
                      {getStatusLabel(testimonial.status)}
                    </Badge>
                    <Badge variant="outline">{testimonial.language.toUpperCase()}</Badge>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {testimonial.content}
                </p>

                <div className="space-y-2 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {testimonial.contact_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{testimonial.contact_name}</span>
                    </div>
                  )}
                  {testimonial.company_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span>{testimonial.company_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(testimonial.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}

export default function TemoignagesPage() {
  return <TemoignagesContent />;
}
