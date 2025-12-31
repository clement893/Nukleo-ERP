'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Client, type ClientCreate, type ClientUpdate, ClientStatus, clientsAPI } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ClientForm from '@/components/projects/ClientForm';
import CompanyAvatar from '@/components/commercial/CompanyAvatar';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelectFilter from '@/components/reseau/MultiSelectFilter';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical, 
  Trash2,
} from 'lucide-react';
import ImportLogsViewer from '@/components/commercial/ImportLogsViewer';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery, useMutation, useQueryClient as useRQClient } from '@tanstack/react-query';
import type { Company } from '@/lib/api/companies';

function ClientsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useRQClient();
  
  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<ClientStatus[]>([]);
  const [filterResponsable, setFilterResponsable] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportLogs, setShowImportLogs] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Fetch clients
  const { data: clients = [], isLoading, error: queryError } = useQuery({
    queryKey: ['clients', filterStatus, filterResponsable, debouncedSearchQuery],
    queryFn: () => {
      const status = filterStatus.length > 0 ? filterStatus[0] : undefined;
      const responsableId = filterResponsable.length > 0 && filterResponsable[0] 
        ? parseInt(filterResponsable[0], 10) 
        : undefined;
      return clientsAPI.list(0, 1000, status, responsableId, debouncedSearchQuery || undefined);
    },
  });
  
  // Fetch count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['clients-count'],
    queryFn: () => clientsAPI.count(),
  });
  
  // Fetch users for dropdowns - extract from clients
  const users = useMemo(() => {
    const userMap = new Map<number, { id: number; first_name: string; last_name: string }>();
    clients.forEach((client) => {
      if (client.responsable_id && client.responsable_name) {
        const nameParts = client.responsable_name.split(' ');
        if (nameParts.length >= 2 && nameParts[0]) {
          userMap.set(client.responsable_id, {
            id: client.responsable_id,
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' '),
          });
        }
      }
    });
    return Array.from(userMap.values());
  }, [clients]);
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ClientCreate) => clientsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-count'] });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientUpdate }) => clientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-count'] });
    },
  });
  
  const deleteAllMutation = useMutation({
    mutationFn: () => clientsAPI.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-count'] });
    },
  });
  
  
  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(client.status);
      const matchesResponsable = filterResponsable.length === 0 || 
        (client.responsable_id && filterResponsable.includes(client.responsable_id.toString()));
      const matchesSearch = !debouncedSearchQuery || 
        client.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        client.responsable_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      return matchesStatus && matchesResponsable && matchesSearch;
    });
  }, [clients, filterStatus, filterResponsable, debouncedSearchQuery]);
  
  const hasActiveFilters = !!(filterStatus.length > 0 || filterResponsable.length > 0 || debouncedSearchQuery);
  
  const clearAllFilters = useCallback(() => {
    setFilterStatus([]);
    setFilterResponsable([]);
    setSearchQuery('');
  }, []);
  
  // Handlers
  const handleCreate = async (data: ClientCreate | ClientUpdate) => {
    try {
      await createMutation.mutateAsync(data as ClientCreate);
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
  
  const handleUpdate = async (data: ClientCreate | ClientUpdate) => {
    if (!selectedClient) return;
    try {
      await updateMutation.mutateAsync({
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
  
  const handleDelete = async (clientId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(clientId);
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
  
  const handleDeleteAll = async () => {
    const count = clients.length;
    if (count === 0) {
      showToast({
        message: 'Aucun client à supprimer',
        type: 'info',
      });
      return;
    }
    
    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les ${count} client(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );
    
    if (!confirmed) return;
    
    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Tous les clients seront définitivement supprimés. Tapez OK pour confirmer.'
    );
    
    if (!doubleConfirmed) return;
    
    try {
      const result = await deleteAllMutation.mutateAsync();
      setSelectedClient(null);
      showToast({
        message: result.message || `${result.deleted_count} client(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des clients',
        type: 'error',
      });
    }
  };
  
  const handleImport = async (file: File) => {
    try {
      const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentImportId(importId);
      setShowImportLogs(true);
      
      const result = await clientsAPI.import(file, importId);
      
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['clients-count'] });
        
        const logosMsg = result.logos_uploaded && result.logos_uploaded > 0 ? ` (${result.logos_uploaded} logo(s) uploadé(s))` : '';
        showToast({
          message: `${result.valid_rows} client(s) importé(s) avec succès${logosMsg}`,
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
  
  const handleExport = async () => {
    try {
      const blob = await clientsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-${new Date().toISOString().split('T')[0]}.xlsx`;
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
  
  const openDetailPage = (client: Client) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/projets/clients/${client.id}`);
  };
  
  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };
  
  // Table columns
  const columns: Column<Client>[] = [
    {
      key: 'company_logo_url',
      label: '',
      sortable: false,
      render: (_value, client) => {
        const companyForAvatar = {
          id: client.company_id,
          name: client.company_name || '',
          logo_url: client.company_logo_url,
          parent_company_id: null,
          description: null,
          website: null,
          email: null,
          phone: null,
          address: null,
          city: null,
          country: null,
          is_client: true,
          facebook: null,
          instagram: null,
          linkedin: null,
          created_at: '',
          updated_at: '',
        } as Company;
        return (
          <div className="flex items-center">
            <CompanyAvatar company={companyForAvatar} size="md" />
          </div>
        );
      },
    },
    {
      key: 'company_name',
      label: 'Nom du client',
      sortable: true,
      render: (_value, client) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium">{client.company_name || '-'}</div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(client);
              }}
            >
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(client.id);
              }}
              className="text-destructive hover:text-destructive"
            >
              Supprimer
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => {
        const statusColors: Record<ClientStatus, string> = {
          [ClientStatus.ACTIVE]: 'bg-green-500 hover:bg-green-600',
          [ClientStatus.INACTIVE]: 'bg-gray-500 hover:bg-gray-600',
          [ClientStatus.MAINTENANCE]: 'bg-yellow-500 hover:bg-yellow-600',
        };
        
        const statusLabels: Record<ClientStatus, string> = {
          [ClientStatus.ACTIVE]: 'Actif',
          [ClientStatus.INACTIVE]: 'Inactif',
          [ClientStatus.MAINTENANCE]: 'Maintenance',
        };
        
        return (
          <Badge 
            variant="default" 
            className={`capitalize text-white ${statusColors[value as ClientStatus] || 'bg-gray-500'}`}
          >
            {statusLabels[value as ClientStatus] || String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'responsable_name',
      label: 'Responsable',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
  ];
  
  const loading = isLoading;
  const error = queryError ? handleApiError(queryError).message : null;
  
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Clients"
        description={`Gérez vos clients${clients.length > 0 ? ` - ${clients.length} client${clients.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules Opérations', href: '/dashboard/projets' },
          { label: 'Clients' },
        ]}
      />
      
      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Client count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters ? (
                <span>{filteredClients.length} sur {totalCount} client(s)</span>
              ) : (
                <span>{totalCount} client(s) au total</span>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par nom d'entreprise, responsable..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut */}
            <MultiSelectFilter
              label="Statut"
              options={[
                { value: ClientStatus.ACTIVE, label: 'Actif' },
                { value: ClientStatus.INACTIVE, label: 'Inactif' },
                { value: ClientStatus.MAINTENANCE, label: 'Maintenance' },
              ]}
              selectedValues={filterStatus.map(s => s.toString())}
              onSelectionChange={(values) => setFilterStatus(values.map(v => v as ClientStatus))}
              className="min-w-[120px]"
            />
            
            {/* Responsable */}
            {users.length > 0 && (
              <MultiSelectFilter
                label="Responsable"
              options={users.map((user: { id: number; first_name: string; last_name: string }) => ({
                value: user.id.toString(),
                label: `${user.first_name} ${user.last_name}`,
              }))}
                selectedValues={filterResponsable}
                onSelectionChange={setFilterResponsable}
                className="min-w-[150px]"
              />
            )}
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Nouveau client
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
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
                        <button
                          onClick={async () => {
                            try {
                              await clientsAPI.downloadTemplate();
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
                              await clientsAPI.downloadZipTemplate();
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
                          id="import-clients"
                        />
                        <label
                          htmlFor="import-clients"
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
                        <button
                          onClick={() => {
                            handleDeleteAll();
                            setShowActionsMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 border-t border-border"
                          disabled={loading || clients.length === 0}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer tous les clients
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
      
      {/* Content */}
      {loading && clients.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredClients as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={true}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun client trouvé"
            loading={loading}
            onRowClick={(row) => openDetailPage(row as unknown as Client)}
          />
        </Card>
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
              endpointUrl={`/v1/projects/clients/import/${currentImportId}/logs`}
              importId={currentImportId}
              onComplete={() => {}}
            />
          ) : (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Initialisation de l&apos;import...</p>
            </div>
          )}
        </Modal>
      )}
    </MotionDiv>
  );
}

export default function ClientsPage() {
  return <ClientsContent />;
}
