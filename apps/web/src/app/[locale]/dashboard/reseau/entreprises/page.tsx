'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NukleoPageHeader } from '@/components/nukleo';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Users, 
  TrendingUp, 
  Eye, 
  Trash2,
  LayoutGrid,
  List as ListIcon,
  Globe,
  Search,
  Info,
  MessageSquare,
  Paperclip,
  Edit,
  ExternalLink,
  Star,
  X,
  Tag
} from 'lucide-react';
import { Badge, Button, Card, Loading, Input } from '@/components/ui';
import { useInfiniteCompanies, useDeleteCompany, useCreateCompany, useCompany, companiesAPI } from '@/lib/query/companies';
import { useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import CompanyForm from '@/components/commercial/CompanyForm';
import Drawer from '@/components/ui/Drawer';
import Tabs from '@/components/ui/Tabs';
import { handleApiError } from '@/lib/errors/api';
import { type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

type ViewMode = 'gallery' | 'list';
type FilterType = 'all' | 'client' | 'prospect';

export default function EntreprisesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'fr';
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  // Drawer state
  const [showCompanyDrawer, setShowCompanyDrawer] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'info' | 'comments' | 'attachments' | 'edit'>('info');
  
  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data with search filter
  const { data, isLoading } = useInfiniteCompanies(1000, {
    search: debouncedSearchQuery || undefined,
    is_client: filterType === 'all' ? undefined : filterType === 'client',
  });
  const deleteCompanyMutation = useDeleteCompany();
  const createCompanyMutation = useCreateCompany();
  
  // Fetch company details when drawer opens
  const { data: companyDetailData, isLoading: isLoadingCompanyDetail } = useCompany(
    selectedCompanyId || 0,
    !!selectedCompanyId && showCompanyDrawer
  );
  
  // Update companyDetails when data is loaded
  useEffect(() => {
    if (companyDetailData) {
      setCompanyDetails(companyDetailData);
    }
  }, [companyDetailData]);

  // Flatten data - API already filters by search and type
  const companies = useMemo(() => data?.pages.flat() || [], [data]);
  
  // Additional client-side filtering for type (in case API doesn't handle it properly)
  const filteredCompanies = useMemo(() => {
    if (filterType === 'all') {
      return companies;
    }
    return companies.filter((company) => {
      if (filterType === 'client') {
        return company.is_client;
      }
      if (filterType === 'prospect') {
        return !company.is_client;
      }
      return true;
    });
  }, [companies, filterType]);
  
  // Get parent companies for form
  const parentCompanies = useMemo(() => 
    companies.map(c => ({ id: c.id, name: c.name })),
    [companies]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = companies.length;
    const clients = companies.filter(c => c.is_client).length;
    const prospects = companies.filter(c => !c.is_client).length;
    
    return { total, clients, prospects };
  }, [companies]);

  // Toggle favorite
  const toggleFavorite = (companyId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(companyId)) {
        newFavorites.delete(companyId);
      } else {
        newFavorites.add(companyId);
      }
      return newFavorites;
    });
  };

  // Get tag colors (same as contacts)
  const getTagColors = (tag: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'VIP': { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
      'Client': { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
      'Prospect': { bg: 'bg-primary-500/10', text: 'text-primary-600 dark:text-primary-400', border: 'border-primary-500/30' },
      'Partenaire': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
      'Fournisseur': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
    };
    return colors[tag] || { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' };
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) return;
    
    try {
      await deleteCompanyMutation.mutateAsync(id);
      showToast({ message: 'Entreprise supprimée avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  // Handle view company in drawer
  const handleView = async (id: number) => {
    setSelectedCompanyId(id);
    setShowCompanyDrawer(true);
    setLoadingDetails(true);
    setCompanyDetails(null);
    
    try {
      const company = await companiesAPI.get(id);
      setCompanyDetails(company);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement de l\'entreprise',
        type: 'error',
      });
      setShowCompanyDrawer(false);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleCloseDrawer = () => {
    setShowCompanyDrawer(false);
    setSelectedCompanyId(null);
    setCompanyDetails(null);
    setDrawerTab('info');
  };
  
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Non renseigné';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const handleUpdate = async (data: CompanyCreate | CompanyUpdate) => {
    if (!companyDetails) return;
    
    try {
      await companiesAPI.update(companyDetails.id, data as CompanyUpdate);
      const updated = await companiesAPI.get(companyDetails.id);
      setCompanyDetails(updated);
      setDrawerTab('info');
      showToast({
        message: 'Entreprise modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification',
        type: 'error',
      });
    }
  };

  // Loading skeleton for gallery view
  const CompanyCardSkeleton = () => (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
      <Skeleton variant="rectangular" height={256} className="w-full" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="60%" height={16} />
        </div>
        <div className="flex gap-1">
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="circular" width={40} height={40} />
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-2">
                <Skeleton variant="text" width={200} height={36} />
                <Skeleton variant="text" width={300} height={20} />
              </div>
              <Skeleton variant="rectangular" width={160} height={44} />
            </div>
          </div>

          {/* Filters skeleton */}
          <div className="glass-card p-4 rounded-xl mb-6 space-y-4">
            <Skeleton variant="rectangular" width="100%" height={44} />
            <div className="flex gap-2">
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={100} height={36} />
            </div>
          </div>

          {/* Gallery skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            {[...Array(8)].map((_, i) => (
              <CompanyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header Nukleo */}
      <NukleoPageHeader
        title="Entreprises"
        description="Gérez votre réseau d'entreprises efficacement"
        compact
        actions={
          <div className="flex items-center gap-3">
            <span className="badge-nukleo px-3 py-1.5">
              {stats.total} total
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="glass-button px-6 py-3 rounded-xl flex items-center gap-2 text-white bg-primary-500 hover:bg-primary-600 transition-all hover-nukleo"
              aria-label="Créer une nouvelle entreprise"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Nouvelle entreprise
            </button>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-xl mb-6 mt-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville, pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-lg"
            aria-label="Rechercher des entreprises"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'gallery'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode galerie"
            aria-pressed={viewMode === 'gallery'}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Galerie
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'list'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode liste"
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon className="w-4 h-4" aria-hidden="true" />
            Liste
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'all'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Building2 className="w-4 h-4" aria-hidden="true" />
            Tous {stats.total}
          </button>
          <button
            onClick={() => setFilterType('client')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'client'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            Clients {stats.clients}
          </button>
          <button
            onClick={() => setFilterType('prospect')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'prospect'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            Prospects {stats.prospects}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-muted-accessible">
        {searchQuery || filterType !== 'all'
          ? `${filteredCompanies.length} entreprise${filteredCompanies.length > 1 ? 's' : ''} trouvée${filteredCompanies.length > 1 ? 's' : ''}`
          : `${stats.total} entreprise${stats.total > 1 ? 's' : ''} au total`
        }
      </div>

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {filteredCompanies.map((company) => {
            const tags: string[] = [];
            if (company.is_client) tags.push('Client');
            if (!company.is_client) tags.push('Prospect');
            
            return (
              <div
                key={company.id}
                onClick={() => handleView(company.id)}
                className="glass-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleView(company.id);
                  }
                }}
                aria-label={`Voir la fiche de ${company.name}`}
              >
                {/* Logo */}
                <div className="relative">
                  <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={`${company.name} logo`}
                        className="w-full h-full object-contain p-4"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="logo-fallback hidden w-full h-full flex items-center justify-center">
                      <div className="text-6xl font-bold text-gray-400">
                        {company.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(company.id);
                    }}
                    className="absolute top-3 right-3 glass-badge p-2 rounded-full hover:scale-110 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
                    aria-label={favorites.has(company.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    title={favorites.has(company.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        favorites.has(company.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {company.name}
                    </h3>
                    {company.description && (
                      <p className="text-sm text-muted-accessible line-clamp-2 mt-1">{company.description}</p>
                    )}
                    {(company.city || company.country) && (
                      <p className="text-sm text-muted-accessible flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        {[company.city, company.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag: string, idx: number) => {
                        const colors = getTagColors(tag);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Visiter le site web de ${company.name}`}
                        title="Site web"
                      >
                        <Globe className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      onClick={() => handleView(company.id)}
                      className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`Voir les détails de ${company.name}`}
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <div className="glass-badge p-2 rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px]">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    </div>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="glass-badge p-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`Supprimer ${company.name}`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredCompanies.map((company) => {
            const tags: string[] = [];
            if (company.is_client) tags.push('Client');
            if (!company.is_client) tags.push('Prospect');
            
            return (
              <div
                key={company.id}
                onClick={() => handleView(company.id)}
                className="glass-card p-4 rounded-xl hover:scale-[1.005] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleView(company.id);
                  }
                }}
                aria-label={`Voir la fiche de ${company.name}`}
              >
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={`${company.name} logo`}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="text-xl font-bold text-gray-400">
                        {company.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {company.name}
                      </h3>
                      {tags.map((tag: string, idx: number) => {
                        const colors = getTagColors(tag);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                    {company.description && (
                      <p className="text-sm text-muted-accessible line-clamp-1">
                        {company.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-accessible mt-1">
                      {company.city && `${company.city} • `}
                      {company.contacts_count || 0} contact{company.contacts_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(company.id)}
                      className="glass-badge p-2 rounded-lg hover:scale-110 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={favorites.has(company.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      title={favorites.has(company.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.has(company.id)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Visiter le site web de ${company.name}`}
                        title="Site web"
                      >
                        <Globe className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      onClick={() => handleView(company.id)}
                      className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Voir les détails de ${company.name}`}
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="glass-badge p-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Supprimer ${company.name}`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCompanies.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aucune entreprise trouvée"
          description="Essayez de modifier vos filtres ou créez une nouvelle entreprise"
          variant="default"
          action={{
            label: "Nouvelle entreprise",
            onClick: () => setShowCreateModal(true)
          }}
        />
      )}

      {/* Company Details Drawer */}
      <Drawer
        isOpen={showCompanyDrawer}
        onClose={handleCloseDrawer}
        title={companyDetails ? companyDetails.name : 'Détails de l\'entreprise'}
        position="right"
        size="xl"
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        {loadingDetails || isLoadingCompanyDetail ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : companyDetails ? (
          <div className="h-full flex flex-col">
            <Tabs
              tabs={[
                {
                  id: 'info',
                  label: 'Informations',
                  icon: <Info className="w-4 h-4" />,
                  content: (
                    <div className="space-y-6 py-4">
                      {/* Link to full page */}
                      {companyDetails && (
                        <div className="flex justify-end mb-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              router.push(`/${locale}/dashboard/reseau/entreprises/${companyDetails.id}`);
                              handleCloseDrawer();
                            }}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Voir la page complète
                          </Button>
                        </div>
                      )}
                      
                      {/* Logo and Basic Info */}
                      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {companyDetails.logo_url ? (
                            <img 
                              src={companyDetails.logo_url} 
                              alt={`${companyDetails.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {companyDetails.name}
                          </h3>
                          {companyDetails.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{companyDetails.description}</p>
                          )}
                          {companyDetails.is_client && (
                            <Badge className="bg-success-500/10 text-success-500 border border-success-500/30">
                              Client
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(companyDetails.city || companyDetails.country) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              Localisation
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {[companyDetails.city, companyDetails.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}
                        {companyDetails.website && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              Site web
                            </h4>
                            <a 
                              href={companyDetails.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-500 hover:underline"
                            >
                              {companyDetails.website}
                            </a>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            Nombre de contacts
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {companyDetails.contacts_count || 0}
                          </p>
                        </div>
                      </div>
                      
                      {/* Dates */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Créé le
                          </h4>
                          <p className="text-xs text-gray-900 dark:text-white">
                            {formatDate(companyDetails.created_at)}
                          </p>
                        </div>
                        {companyDetails.updated_at && companyDetails.updated_at !== companyDetails.created_at && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Modifié le
                            </h4>
                            <p className="text-xs text-gray-900 dark:text-white">
                              {formatDate(companyDetails.updated_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'comments',
                  label: 'Commentaires',
                  icon: <MessageSquare className="w-4 h-4" />,
                  content: (
                    <div className="py-4">
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Les commentaires seront disponibles prochainement</p>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'attachments',
                  label: 'Documents',
                  icon: <Paperclip className="w-4 h-4" />,
                  content: (
                    <div className="py-4">
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Les pièces jointes seront disponibles prochainement</p>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'edit',
                  label: 'Modifier',
                  icon: <Edit className="w-4 h-4" />,
                  content: (
                    <div className="py-4">
                      <CompanyForm
                        company={companyDetails}
                        onSubmit={handleUpdate}
                        onCancel={() => setDrawerTab('info')}
                        parentCompanies={parentCompanies}
                      />
                    </div>
                  ),
                },
              ]}
              value={drawerTab}
              onChange={(tabId: string) => setDrawerTab(tabId as typeof drawerTab)}
            />
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Entreprise non trouvée</p>
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouvelle entreprise"
        >
          <CompanyForm
            onSubmit={async (data) => {
              try {
                await createCompanyMutation.mutateAsync(data as CompanyCreate);
                setShowCreateModal(false);
                showToast({ message: 'Entreprise créée avec succès', type: 'success' });
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création';
                showToast({ message: errorMessage, type: 'error' });
                throw error; // Re-throw to let form handle it
              }
            }}
            onCancel={() => setShowCreateModal(false)}
            loading={createCompanyMutation.isPending}
            parentCompanies={parentCompanies}
          />
        </Modal>
      )}
    </div>
  );
}
