'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Users, 
  TrendingUp, 
  Eye, 
  Trash2,
  Grid,
  List,
  Globe,
  Search,
  Info,
  MessageSquare,
  Paperclip,
  Edit,
  ExternalLink
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

export default function EntreprisesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'fr';
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'prospect'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Drawer state
  const [showCompanyDrawer, setShowCompanyDrawer] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'info' | 'comments' | 'attachments' | 'edit'>('info');

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

  if (isLoading) {
  return (
    <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Entreprises
              </h1>
              <p className="text-white/80 text-lg">Gérez votre réseau d'entreprises</p>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entreprise
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Building2 className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <TrendingUp className="w-6 h-6 text-success-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.clients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <Users className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.prospects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Prospects</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher une entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filterType === 'all' ? 'primary' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                Tous
              </Button>
              <Button 
                variant={filterType === 'client' ? 'primary' : 'outline'}
                onClick={() => setFilterType('client')}
              >
                Clients
              </Button>
              <Button 
                variant={filterType === 'prospect' ? 'primary' : 'outline'}
                onClick={() => setFilterType('prospect')}
              >
                Prospects
              </Button>
            </div>

            <div className="flex gap-2 border-l pl-4">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Companies Grid/List */}
        {filteredCompanies.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune entreprise trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre première entreprise'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entreprise
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            {filteredCompanies.map((company) => (
              <Card 
                key={company.id}
                className="glass-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer group"
                onClick={() => handleView(company.id)}
              >
                <div className="flex flex-col">
                  {/* Logo Section - Format horizontal pour les logos */}
                  <div className="relative">
                    <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={`${company.name} logo`}
                          className="w-full h-full object-contain"
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
                        <div className="text-4xl font-bold text-gray-400">
                          {company.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </div>
                    </div>
                    {/* Badge en overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${company.is_client ? 'bg-success-500/10 text-success-500 border border-success-500/30' : 'bg-warning-500/10 text-warning-500 border border-warning-500/30'}`}>
                        {company.is_client ? 'Client' : 'Prospect'}
                      </Badge>
                    </div>
                  </div>

                  {/* Contenu de la carte */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {company.name}
                      </h3>
                      {company.description && (
                        <p className="text-sm text-muted-accessible line-clamp-2 mt-1">{company.description}</p>
                      )}
                    </div>

                    {/* Informations clés */}
                    <div className="space-y-2.5">
                      {(company.city || company.country) && (
                        <div className="flex items-center gap-2 text-sm text-muted-accessible">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{[company.city, company.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2 text-sm text-muted-accessible group/website">
                          <Globe className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate flex-1">{company.website}</span>
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover/website:opacity-100 text-primary hover:text-primary-600 transition-all"
                            title="Visiter le site web"
                            aria-label={`Visiter le site web de ${company.name}`}
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-accessible">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{company.contacts_count || 0} contact{company.contacts_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(company.id)}
                        className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Voir les détails de ${company.name}`}
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                          aria-label={`Visiter le site web de ${company.name}`}
                          title="Site web"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(company.id)}
                        className="glass-badge p-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Supprimer ${company.name}`}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card rounded-xl border border-nukleo-lavender/20 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCompanies.map((company) => (
                <div 
                  key={company.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => handleView(company.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={`${company.name} logo`}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center justify-center ${company.logo_url ? 'hidden' : ''}`}>
                        <Building2 className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {[company.description, company.city, company.country].filter(Boolean).map(s => String(s).substring(0, 30)).join(' • ')}
                        </p>
                      </div>
                      <Badge className={company.is_client ? 'bg-success-500/10 text-success-500' : 'bg-warning-500/10 text-warning-500'}>
                        {company.is_client ? 'Client' : 'Prospect'}
                      </Badge>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{company.contacts_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => handleView(company.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(company.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </MotionDiv>

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
                          <Badge className={companyDetails.is_client ? 'bg-success-500/10 text-success-500 border border-success-500/30' : 'bg-warning-500/10 text-warning-500 border border-warning-500/30'}>
                            {companyDetails.is_client ? 'Client' : 'Prospect'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(companyDetails.city || companyDetails.country) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
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
                              <Globe className="w-4 h-4" />
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
                            <Users className="w-4 h-4" />
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
    </PageContainer>
  );
}
