'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge, Modal } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SearchBar from '@/components/ui/SearchBar';
import { type Client, type ClientCreate, type ClientUpdate, ClientStatus, clientsAPI } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ClientForm from '@/components/projects/ClientForm';
import CompanyAvatar from '@/components/commercial/CompanyAvatar';
import { companiesAPI, Company } from '@/lib/api/companies';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteClients, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  useImportClients,
  useExportClients,
} from '@/lib/query/clients';
import { useQuery } from '@tanstack/react-query';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import ImportClientsInstructions from '@/components/projects/ImportClientsInstructions';

// ImportLogsViewer component for clients (adapted from commercial contacts)
function ClientImportLogsViewer({ importId, onComplete }: { importId: string; onComplete?: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    if (!importId) return;
    
    const sseUrl = clientsAPI.getImportLogsUrl(importId);
    
    // Add authentication token to URL if available
    const token = TokenStorage.getToken();
    const urlWithAuth = token ? `${sseUrl}?token=${encodeURIComponent(token)}` : sseUrl;
    
    const eventSource = new EventSource(urlWithAuth);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setStatus(data.data);
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            onComplete?.();
          }
        } else if (data.type === 'done') {
          eventSource.close();
          onComplete?.();
        } else {
          setLogs((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [importId, onComplete]);
  
  return (
    <div className="space-y-4">
      {status && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Statut: {status.status}</span>
            {status.progress !== undefined && status.total !== undefined && (
              <span className="text-sm text-muted-foreground">
                {status.progress} / {status.total}
              </span>
            )}
          </div>
          {status.progress !== undefined && status.total !== undefined && (
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(status.progress / status.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {logs.map((log, idx) => (
          <div key={idx} className={`p-2 rounded text-sm ${
            log.level === 'error' ? 'bg-destructive/10 text-destructive' :
            log.level === 'warning' ? 'bg-warning/10 text-warning' :
            log.level === 'success' ? 'bg-success/10 text-success' :
            'bg-muted'
          }`}>
            <div className="font-medium">{log.message}</div>
            {log.data && Object.keys(log.data).length > 0 && (
              <pre className="text-xs mt-1 opacity-75">{JSON.stringify(log.data, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
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
  const importClientsMutation = useImportClients();
  const exportClientsMutation = useExportClients();

  // Fetch companies for display
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.list(0, 1000),
  });

  // Flatten pages into single array
  const clients = useMemo(() => {
    return clientsData?.pages.flat() || [];
  }, [clientsData]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<ClientStatus[]>([]);
  const [filterResponsible, setFilterResponsible] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showImportLogs, setShowImportLogs] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  
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
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(client.status);
      const matchesResponsible = filterResponsible.length === 0 || 
        (client.responsible_id && filterResponsible.includes(client.responsible_id));
      const matchesSearch = !debouncedSearchQuery || 
        client.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        client.responsible_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        client.notes?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesStatus && matchesResponsible && matchesSearch;
    });
  }, [clients, filterStatus, filterResponsible, debouncedSearchQuery]);

  // Check if any filters are active
  const hasActiveFilters = !!(filterStatus.length > 0 || filterResponsible.length > 0 || debouncedSearchQuery);
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterStatus([]);
    setFilterResponsible([]);
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
        clientId: selectedClient.id,
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

  // Handle import
  const handleImport = async (file: File) => {
    try {
      const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentImportId(importId);
      setShowImportLogs(true);
      
      const result = await importClientsMutation.mutateAsync({ file, importId });
      
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        
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

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await exportClientsMutation.mutateAsync();
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

  // Handle download ZIP template
  const handleDownloadZipTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await clientsAPI.downloadZipTemplate();
      showToast({
        message: 'Modèle ZIP téléchargé avec succès',
        type: 'success',
      });
      setShowActionsMenu(false);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du téléchargement du modèle',
        type: 'error',
      });
    } finally {
      setDownloadingTemplate(false);
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

  // Get company for avatar
  const getCompanyForClient = (client: Client): Company | null => {
    return companies.find((c: Company) => c.id === client.company_id) || null;
  };

  // Status badge colors
  const getStatusBadgeColor = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.ACTIVE:
        return 'bg-green-500 hover:bg-green-600';
      case ClientStatus.INACTIVE:
        return 'bg-gray-500 hover:bg-gray-600';
      case ClientStatus.MAINTENANCE:
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Table columns
  const columns: Column<Client>[] = [
    {
      key: 'company_logo_url',
      label: '',
      sortable: false,
      render: (_value, client) => {
        const company = getCompanyForClient(client);
        if (company) {
          return (
            <div className="flex items-center">
              <CompanyAvatar company={company} size="md" />
            </div>
          );
        }
        return null;
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
            {client.responsible_name && (
              <div className="text-sm text-muted-foreground">Responsable: {client.responsible_name}</div>
            )}
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
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(client.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
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
        const status = value as ClientStatus;
        const statusLabels: Record<ClientStatus, string> = {
          [ClientStatus.ACTIVE]: 'Actif',
          [ClientStatus.INACTIVE]: 'Inactif',
          [ClientStatus.MAINTENANCE]: 'Maintenance',
        };
        return (
          <Badge 
            variant="default" 
            className={`capitalize text-white ${getStatusBadgeColor(status)}`}
          >
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      key: 'responsible_name',
      label: 'Responsable',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'portal_url',
      label: 'Portail',
      sortable: false,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir
          </a>
        );
      },
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Clients"
        description="Gérez vos clients et leurs informations"
      />

      {/* Filters and Actions */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher par nom d'entreprise, responsable..."
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {Object.values(ClientStatus).map((status) => {
                const statusLabels: Record<ClientStatus, string> = {
                  [ClientStatus.ACTIVE]: 'Actif',
                  [ClientStatus.INACTIVE]: 'Inactif',
                  [ClientStatus.MAINTENANCE]: 'Maintenance',
                };
                const isSelected = filterStatus.includes(status);
                return (
                  <Button
                    key={status}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFilterStatus(
                        isSelected
                          ? filterStatus.filter((s) => s !== status)
                          : [...filterStatus, status]
                      );
                    }}
                  >
                    {statusLabels[status]}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Effacer les filtres
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredClients.length} client(s)
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Nouveau client
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Instructions d'import
                        </button>
                        <button
                          onClick={handleDownloadZipTemplate}
                          disabled={downloadingTemplate}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted border-t border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          {downloadingTemplate ? 'Téléchargement...' : 'Télécharger modèle ZIP'}
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
                          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer border-t border-border"
                        >
                          <Upload className="w-4 h-4" />
                          Importer
                        </label>
                        <button
                          onClick={() => {
                            handleExport();
                            setShowActionsMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted border-t border-border"
                        >
                          <Download className="w-4 h-4" />
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
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun client trouvé"
            loading={loading}
            infiniteScroll={!hasActiveFilters}
            hasMore={hasMore && !hasActiveFilters}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
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
            <ClientImportLogsViewer
              importId={currentImportId}
              onComplete={() => {
                setTimeout(() => {
                  setShowImportLogs(false);
                  setCurrentImportId(null);
                }, 3000);
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

      {/* Import Instructions Modal */}
      <ImportClientsInstructions
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
      />
    </MotionDiv>
  );
}

export default function ClientsPage() {
  return <ClientsContent />;
}
