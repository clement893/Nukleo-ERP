'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Button, Alert, Loading, Badge, Card, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { type Client, type ClientCreate, type ClientUpdate } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ClientForm from '@/components/projects/ClientForm';
import ClientAvatar from '@/components/projects/ClientAvatar';
import { 
  Plus, 
  Search,
  Building2,
  Users,
  TrendingUp,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteClients, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient
} from '@/lib/query/clients';

function ClientsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for clients
  const {
    data: clientsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteClients(100);
  
  // Mutations
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  
  // Flatten pages into single array
  const clients = useMemo(() => {
    return clientsData?.pages.flat() || [];
  }, [clientsData]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Load more clients for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered clients with debounced search
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = !debouncedSearchQuery || 
        client.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        client.type?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      if (selectedType === 'all') return matchesSearch;
      if (selectedType === 'active') return matchesSearch && client.status === 'ACTIVE';
      if (selectedType === 'inactive') return matchesSearch && client.status === 'INACTIVE';
      if (selectedType === 'maintenance') return matchesSearch && client.status === 'MAINTENANCE';
      
      return matchesSearch;
    });
  }, [clients, debouncedSearchQuery, selectedType]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'ACTIVE').length;
    const totalProjects = clients.reduce((sum, c) => sum + (c.project_count || 0), 0);
    
    return {
      totalClients: clients.length,
      activeClients,
      totalProjects,
      totalContacts: 0, // Contact count not available in Client type
    };
  }, [clients]);

  // Quick filters
  const quickFilters = useMemo(() => {
    const activeCount = clients.filter(c => c.status === 'ACTIVE').length;
    const inactiveCount = clients.filter(c => c.status === 'INACTIVE').length;
    const maintenanceCount = clients.filter(c => c.status === 'MAINTENANCE').length;
    
    return [
      { id: 'all', label: 'Tous', count: clients.length },
      { id: 'active', label: 'Actifs', count: activeCount },
      { id: 'inactive', label: 'Inactifs', count: inactiveCount },
      { id: 'maintenance', label: 'Maintenance', count: maintenanceCount },
    ];
  }, [clients]);

  // Handle create
  const handleCreate = async (data: ClientCreate | ClientUpdate) => {
    try {
      await createClientMutation.mutateAsync(data as ClientCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Client créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du client',
        type: 'error',
      });
    }
  };

  // Handle update
  const handleUpdate = async (data: ClientCreate | ClientUpdate) => {
    if (!selectedClient) return;

    try {
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data: data as ClientUpdate,
      });
      setShowEditModal(false);
      setSelectedClient(null);
      showToast({
        message: 'Client modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du client',
        type: 'error',
      });
    }
  };


  // Navigate to detail page
  const openDetailPage = (client: Client) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/projets/clients/${client.id}`);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Clients
              </h1>
              <p className="text-white/80 text-lg">Gérez vos clients et suivez vos relations d'affaires</p>
            </div>
            <Button 
              className="bg-white text-[#523DC9] hover:bg-white/90"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Building2 className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.activeClients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Briefcase className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalProjects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projets totaux</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Users className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalContacts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts totaux</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalClients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients totaux</div>
          </Card>
        </div>

        {/* Filtres et Recherche */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, type ou ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedType(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedType === filter.id
                      ? 'bg-[#523DC9] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'grid'
                      ? 'bg-[#523DC9] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'list'
                      ? 'bg-[#523DC9] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Liste
                </button>
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

        {/* Clients Grid/List */}
        {filteredClients.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucun client trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || selectedType !== 'all' ? 'Aucun client ne correspond à vos critères' : 'Créez votre premier client pour commencer'}
            </p>
            {!searchQuery && selectedType === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un client
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => openDetailPage(client)}
                className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer"
              >
                {/* Logo + Status */}
                <div className="flex items-start justify-between mb-4">
                  <ClientAvatar client={client} size="lg" />
                  <Badge className={getStatusColor(client.status || 'active')}>
                    {getStatusLabel(client.status || 'active')}
                  </Badge>
                </div>

                {/* Nom + Type */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {client.company_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {client.type || 'Client'}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Projets</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {client.project_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contacts</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      0
                    </p>
                  </div>
                </div>

                {/* Contact Info - Not available in Client type */}
                <div className="space-y-2">
                  {/* Contact information would need to be fetched separately */}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="glass-card rounded-xl border border-[#A7A2CF]/20">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => openDetailPage(client)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <ClientAvatar client={client} size="md" />

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {client.company_name}
                        </h3>
                        <Badge className={getStatusColor(client.status || 'active')}>
                          {getStatusLabel(client.status || 'active')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {client.type || 'Client'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 dark:text-white">{client.project_count || 0}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Projets</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 dark:text-white">0</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Contacts</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outline"
            >
              {loadingMore ? 'Chargement...' : 'Charger plus'}
            </Button>
          </div>
        )}
      </MotionDiv>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau client"
        size="lg"
      >
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createClientMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
        }}
        title="Modifier le client"
        size="lg"
      >
        {selectedClient && (
          <ClientForm
            client={selectedClient}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedClient(null);
            }}
            loading={updateClientMutation.isPending}
          />
        )}
      </Modal>
    </PageContainer>
  );
}

export default function ClientsPage() {
  return <ClientsContent />;
}
