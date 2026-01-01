'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NukleoPageHeader } from '@/components/nukleo';
import { Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Client, type ClientCreate, type ClientUpdate } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ClientGallery from '@/components/projects/ClientGallery';
import ClientForm from '@/components/projects/ClientForm';
import ClientAvatar from '@/components/projects/ClientAvatar';
import ClientCounter from '@/components/projects/ClientCounter';
import ViewModeToggle, { type ViewMode } from '@/components/employes/ViewModeToggle';
import ClientRowActions from '@/components/projects/ClientRowActions';
import SearchBar from '@/components/ui/SearchBar';
import { 
  Plus, 
  MoreVertical
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
  } = useInfiniteClients(20);
  
  // Mutations
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();
  
  // Flatten pages into single array
  const clients = useMemo(() => {
    return clientsData?.pages.flat() || [];
  }, [clientsData]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
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

      return matchesSearch;
    });
  }, [clients, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!debouncedSearchQuery;
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
  }, []);

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

  // Handle delete
  const handleDelete = async (clientId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      await deleteClientMutation.mutateAsync(clientId);
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      showToast({
        message: 'Client supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du client',
        type: 'error',
      });
    }
  };

  // Navigate to detail page
  const openDetailPage = (client: Client) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/projets/clients/${client.id}`);
  };

  // Open edit modal
  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  // Table columns - Only Nom, Statut
  const columns: Column<Client>[] = [
    {
      key: 'company_name',
      label: 'Nom',
      sortable: true,
      render: (_value, client) => (
        <div className="flex items-center justify-between group">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <ClientAvatar client={client} size="sm" />
            <div className="font-medium truncate" title={client.company_name}>
              {client.company_name}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
            <ClientRowActions
              client={client}
              onView={() => openDetailPage(client)}
              onEdit={() => openEditModal(client)}
              onDelete={() => handleDelete(client.id)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (_value, client) => {
        const status = client.status || 'active';
        const statusColors: Record<string, string> = {
          'active': 'bg-green-500 hover:bg-green-600',
          'inactive': 'bg-gray-500 hover:bg-gray-600',
          'maintenance': 'bg-yellow-500 hover:bg-yellow-600',
        };
        const statusLabels: Record<string, string> = {
          'active': 'Actif',
          'inactive': 'Inactif',
          'maintenance': 'Maintenance',
        };
        return (
          <Badge
            variant="default"
            className={`capitalize text-white ${statusColors[status] || 'bg-gray-500'}`}
          >
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <NukleoPageHeader
        title="Clients"
        description="Gérez vos clients"
        compact
      />

      {/* Toolbar */}
      <div className="glass-card rounded-xl border border-border p-6">
        <div className="space-y-3">
          {/* Clients count */}
          <div className="flex items-center justify-between">
            <ClientCounter
              filtered={filteredClients.length}
              total={clients.length}
              showFilteredBadge={hasActiveFilters}
            />
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par nom, email, téléphone, LinkedIn..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          {/* Active filters badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {debouncedSearchQuery && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Recherche: {debouncedSearchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-primary-700"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Effacer tous les filtres
              </button>
            </div>
          )}
          
          {/* Bottom row: View toggle, Actions */}
          <div className="flex items-center justify-between">
            {/* View mode toggle */}
            <ViewModeToggle value={viewMode} onChange={setViewMode} />

            {/* Actions menu */}
            <div className="relative ml-auto">
              <div className="flex items-center gap-2">
                {/* Primary action */}
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs px-3 py-1.5 h-auto hover-nukleo">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nouveau client
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
                      ></div>
                      <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
                        <div className="py-1">
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

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading && clients.length === 0 ? (
        <div className="glass-card rounded-xl border border-border p-6">
          <div className="py-12 text-center">
            <Loading />
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="glass-card rounded-xl border border-border">
          <DataTable
            data={filteredClients as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun client trouvé"
            loading={loading}
            infiniteScroll={true}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as Client)}
          />
        </div>
      ) : (
        <ClientGallery
          clients={filteredClients}
          onClientClick={openDetailPage}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau client"
        size="lg"
      >
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedClient !== null}
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
            loading={loading}
          />
        )}
      </Modal>
    </MotionDiv>
  );
}

export default function ClientsPage() {
  return <ClientsContent />;
}
