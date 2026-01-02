'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Button, Alert, Loading, Badge, Card, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Drawer from '@/components/ui/Drawer';
import Tabs from '@/components/ui/Tabs';
import { type Client, type ClientCreate, type ClientUpdate, ClientStatus } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';
import ClientForm from '@/components/projects/ClientForm';
import ClientAvatar from '@/components/projects/ClientAvatar';
import { companiesAPI, type Company } from '@/lib/api/companies';
import { projectsAPI, type Project } from '@/lib/api/projects';
import { 
  Plus, 
  Search,
  Building2,
  Users,
  TrendingUp,
  ExternalLink,
  Briefcase,
  ChevronDown,
  Check,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Copy,
  CheckSquare,
  Square,
  Grid,
  List,
  Info,
  MessageSquare,
  Paperclip,
  Globe,
  MapPin,
  Eye,
  FolderOpen
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteClients, 
  useCreateClient, 
  useUpdateClient,
  useDeleteClient,
  useClient,
  clientsAPI
} from '@/lib/query/clients';

function ClientsContent() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'fr';
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
  const deleteClientMutation = useDeleteClient();
  
  // Drawer state (must be declared before useClient hook)
  const [showClientDrawer, setShowClientDrawer] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  // Fetch client details when drawer opens
  const { data: clientDetailData, isLoading: isLoadingClientDetail } = useClient(
    selectedClientId || 0,
    !!selectedClientId && showClientDrawer
  );
  
  // Update clientDetails when data is loaded
  useEffect(() => {
    if (clientDetailData) {
      setClientDetails(clientDetailData);
    }
  }, [clientDetailData]);
  
  // Flatten pages into single array
  const clients = useMemo(() => {
    return clientsData?.pages.flat() || [];
  }, [clientsData]);
  
  // State for companies (for logos) and projects
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projectsByClient, setProjectsByClient] = useState<Record<number, Project[]>>({});
  const [contactsByClient, setContactsByClient] = useState<Record<number, number>>({});
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<Record<number, boolean>>({});
  const [_actionDropdownOpen, setActionDropdownOpen] = useState<Record<number, boolean>>({});
  
  // Selection
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Client details state
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'info' | 'comments' | 'attachments' | 'edit'>('info');
  
  // Load companies for logos
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const allCompanies = await companiesAPI.list(0, 1000);
        setCompanies(allCompanies);
      } catch (error) {
        logger.error('Error loading companies', error);
      }
    };
    loadCompanies();
  }, []);
  
  // Load projects for each client
  useEffect(() => {
    const loadProjects = async () => {
      if (clients.length === 0) return;
      
      try {
        const projectsMap: Record<number, Project[]> = {};
        
        // Load all projects and group by client_id
        const allProjects = await projectsAPI.list(0, 1000);
        allProjects.forEach(project => {
          if (project.client_id) {
            const clientId = project.client_id;
            if (!projectsMap[clientId]) {
              projectsMap[clientId] = [];
            }
            projectsMap[clientId]!.push(project);
          }
        });
        
        setProjectsByClient(projectsMap);
      } catch (error) {
        logger.error('Error loading projects', error);
      }
    };
    loadProjects();
  }, [clients]);
  
  // Load contacts for each client
  useEffect(() => {
    const loadContacts = async () => {
      if (clients.length === 0) return;
      
      try {
        const contactsMap: Record<number, number> = {};
        
        // Load contacts for each client
        const contactsPromises = clients.map(async (client) => {
          try {
            const contacts = await clientsAPI.getContacts(client.id);
            contactsMap[client.id] = contacts.length;
          } catch (error) {
            contactsMap[client.id] = 0;
          }
        });
        
        await Promise.all(contactsPromises);
        setContactsByClient(contactsMap);
      } catch (error) {
        logger.error('Error loading contacts', error);
      }
    };
    loadContacts();
  }, [clients]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown-container') && !target.closest('.action-dropdown-container')) {
        setStatusDropdownOpen({});
        setActionDropdownOpen({});
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get logo URL for a client by matching company name
  const getClientLogo = useCallback((client: Client): string | null => {
    const company = companies.find(c => 
      c.name.toLowerCase() === client.company_name.toLowerCase() ||
      c.name.toLowerCase().includes(client.company_name.toLowerCase()) ||
      client.company_name.toLowerCase().includes(c.name.toLowerCase())
    );
    return company?.logo_url || null;
  }, [companies]);
  
  // Get projects for a client
  const getClientProjects = useCallback((clientId: number): Project[] => {
    return projectsByClient[clientId] || [];
  }, [projectsByClient]);
  
  // Get contacts count for a client
  const getClientContactsCount = useCallback((clientId: number): number => {
    return contactsByClient[clientId] || 0;
  }, [contactsByClient]);
  
  // Handle status change
  const handleStatusChange = useCallback(async (client: Client, newStatus: ClientStatus) => {
    try {
      await updateClientMutation.mutateAsync({
        id: client.id,
        data: { status: newStatus },
      });
      setStatusDropdownOpen(prev => ({ ...prev, [client.id]: false }));
      showToast({
        message: `Statut changé à ${getStatusLabel(newStatus.toLowerCase())}`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du changement de statut',
        type: 'error',
      });
    }
  }, [updateClientMutation, showToast]);
  
  // Handle delete
  const handleDelete = useCallback(async (client: Client) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.company_name}" ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      await deleteClientMutation.mutateAsync(client.id);
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
  }, [deleteClientMutation, showToast]);
  
  // Handle duplicate
  const handleDuplicate = useCallback(async (client: Client) => {
    try {
      const duplicateData: ClientCreate = {
        company_name: `${client.company_name} (Copie)`,
        type: client.type,
        portal_url: null,
        status: 'ACTIVE',
      };
      await createClientMutation.mutateAsync(duplicateData);
      showToast({
        message: 'Client dupliqué avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la duplication du client',
        type: 'error',
      });
    }
  }, [createClientMutation, showToast]);
  
  // Handle edit
  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
    setActionDropdownOpen(prev => ({ ...prev, [client.id]: false }));
  }, []);
  
  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedClients.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''} ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedClients).map(id =>
        deleteClientMutation.mutateAsync(id)
      );
      await Promise.all(deletePromises);
      setSelectedClients(new Set());
      showToast({
        message: `${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''} supprimé${selectedClients.size > 1 ? 's' : ''} avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  }, [selectedClients, deleteClientMutation, showToast]);
  
  // Bulk status change
  const handleBulkStatusChange = useCallback(async (newStatus: ClientStatus) => {
    if (selectedClients.size === 0) return;
    
    try {
      const updatePromises = Array.from(selectedClients).map(id =>
        updateClientMutation.mutateAsync({
          id,
          data: { status: newStatus },
        })
      );
      await Promise.all(updatePromises);
      setSelectedClients(new Set());
      showToast({
        message: `Statut de ${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''} changé avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du changement de statut',
        type: 'error',
      });
    }
  }, [selectedClients, updateClientMutation, showToast]);
  
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
  
  // Toggle selection
  const toggleSelection = useCallback((clientId: number) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  }, []);
  
  const toggleSelectAll = useCallback(() => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  }, [selectedClients.size, filteredClients]);
  
  // Export handlers
  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const data = filteredClients.map(client => ({
        Nom: client.company_name,
        Type: client.type || '',
        Statut: client.status,
        'Nombre de projets': client.project_count || getClientProjects(client.id).length || 0,
        'Nombre de contacts': getClientContactsCount(client.id),
        'Date de création': client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '',
      }));
      
      if (data.length === 0) {
        showToast({
          message: 'Aucune donnée à exporter',
          type: 'error',
        });
        return;
      }
      
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header as keyof typeof row];
          if (value === null || value === undefined) return '';
          return String(value).replace(/"/g, '""');
        }).join(','))
      ];
      const csv = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clients_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast({
        message: `Export ${format.toUpperCase()} réussi`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'export',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredClients, getClientProjects, getClientContactsCount, showToast]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'ACTIVE').length;
    const totalProjects = clients.reduce((sum, c) => sum + (c.project_count || 0), 0);
    const totalContacts = clients.reduce((sum, c) => sum + getClientContactsCount(c.id), 0);
    
    return {
      totalClients: clients.length,
      activeClients,
      totalProjects,
      totalContacts,
    };
  }, [clients, getClientContactsCount]);

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
      // Refresh drawer if same client
      if (clientDetails?.id === selectedClient.id) {
        const updated = await clientsAPI.get(selectedClient.id);
        setClientDetails(updated);
      }
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

  // Handle view client in drawer
  const handleView = async (id: number) => {
    setSelectedClientId(id);
    setShowClientDrawer(true);
    setLoadingDetails(true);
    setClientDetails(null);
    
    try {
      const client = await clientsAPI.get(id);
      setClientDetails(client);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement du client',
        type: 'error',
      });
      setShowClientDrawer(false);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleCloseDrawer = () => {
    setShowClientDrawer(false);
    setSelectedClientId(null);
    setClientDetails(null);
    setDrawerTab('info');
  };
  
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Non renseigné';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  // Navigate to detail page (fallback, can be removed later)
  const openDetailPage = (client: Client) => {
    handleView(client.id);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };
  
  const statusOptions: { value: ClientStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'INACTIVE', label: 'Inactif' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];
  
  const selectedCount = selectedClients.size;
  const hasActiveFilters = searchQuery.trim() !== '' || selectedType !== 'all';

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
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
            <div className="flex gap-2">
              <Dropdown
                trigger={
                  <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                }
                items={[
                  {
                    label: 'Exporter en Excel',
                    onClick: () => handleExport('excel'),
                    icon: <Download className="w-4 h-4" />,
                    disabled: isExporting || filteredClients.length === 0,
                  },
                  {
                    label: 'Exporter en CSV',
                    onClick: () => handleExport('csv'),
                    icon: <Download className="w-4 h-4" />,
                    disabled: isExporting || filteredClients.length === 0,
                  },
                ]}
                position="bottom"
              />
              <Button 
                className="bg-white text-primary-500 hover:bg-white/90"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Building2 className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.activeClients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/30">
                <Briefcase className="w-6 h-6 text-secondary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalProjects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projets totaux</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <Users className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalContacts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts totaux</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalClients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients totaux</div>
          </Card>
        </div>

        {/* Filtres et Recherche */}
        <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
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
            <div className="flex flex-wrap items-center gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedType(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedType === filter.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
              
              {/* Bulk actions */}
              {selectedCount > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                  </span>
                  <Dropdown
                    trigger={
                      <Button variant="outline" size="sm">
                        Actions en masse
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    }
                    items={[
                      {
                        label: 'Marquer comme Actif',
                        onClick: () => handleBulkStatusChange('ACTIVE'),
                        icon: <Check className="w-4 h-4" />,
                      },
                      {
                        label: 'Marquer comme Inactif',
                        onClick: () => handleBulkStatusChange('INACTIVE'),
                        icon: <Check className="w-4 h-4" />,
                      },
                      {
                        label: 'Marquer comme Maintenance',
                        onClick: () => handleBulkStatusChange('MAINTENANCE'),
                        icon: <Check className="w-4 h-4" />,
                      },
                      { divider: true },
                      {
                        label: 'Supprimer',
                        onClick: handleBulkDelete,
                        icon: <Trash2 className="w-4 h-4" />,
                        variant: 'danger',
                      },
                    ]}
                    position="bottom"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className={selectedCount > 0 ? '' : 'ml-auto flex gap-2'}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
              </p>
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
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucun client trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters ? 'Aucun client ne correspond à vos critères' : 'Créez votre premier client pour commencer'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un client
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            {filteredClients.map((client) => {
              const logoUrl = getClientLogo(client);
              const projects = getClientProjects(client.id);
              const contactsCount = getClientContactsCount(client.id);
              const isSelected = selectedClients.has(client.id);
              
              return (
                <Card
                  key={client.id}
                  className="glass-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer group relative"
                  onClick={() => handleView(client.id)}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(client.id);
                      }}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex flex-col">
                    {/* Logo Section - Photo rectangulaire en hauteur comme les entreprises */}
                    <div className="relative">
                      <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${client.company_name} logo`}
                            className="w-full h-full object-cover"
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
                            {client.company_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                      </div>
                      {/* Badge de statut en overlay */}
                      <div className="absolute top-3 right-3">
                        <Badge className={getStatusColor(client.status || 'ACTIVE')}>
                          {getStatusLabel(client.status || 'ACTIVE')}
                        </Badge>
                      </div>
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {client.company_name}
                        </h3>
                        {client.type && (
                          <p className="text-sm text-muted-accessible line-clamp-2 mt-1">{client.type}</p>
                        )}
                      </div>

                      {/* Informations clés */}
                      <div className="space-y-2.5">
                        {client.portal_url && (
                          <div className="flex items-center gap-2 text-sm text-muted-accessible group/portal">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate flex-1">Portail client</span>
                            <a
                              href={client.portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover/portal:opacity-100 text-primary hover:text-primary-600 transition-all"
                              title="Ouvrir le portail"
                              aria-label={`Ouvrir le portail de ${client.company_name}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-accessible">
                          <FolderOpen className="w-4 h-4 flex-shrink-0" />
                          <span>{projects.length} projet{projects.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-accessible">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>{contactsCount} contact{contactsCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-3 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(client.id)}
                          className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                          aria-label={`Voir les détails de ${client.company_name}`}
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(client)}
                          className="glass-badge p-2 rounded-lg hover:bg-primary-500/10 hover:text-primary-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                          aria-label={`Modifier ${client.company_name}`}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(client)}
                          className="glass-badge p-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                          aria-label={`Supprimer ${client.company_name}`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card rounded-xl border border-nukleo-lavender/20">
            {/* Select all header */}
            {filteredClients.length > 0 && (
              <div className="glass-card p-3 rounded-lg border border-nukleo-lavender/20 flex items-center gap-3 mb-2">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {selectedClients.size === filteredClients.length ? (
                    <CheckSquare className="w-5 h-5 text-primary-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedClients.size > 0 
                    ? `${selectedClients.size} sélectionné${selectedClients.size > 1 ? 's' : ''}`
                    : 'Sélectionner tout'}
                </span>
              </div>
            )}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => {
                const logoUrl = getClientLogo(client);
                const projects = getClientProjects(client.id);
                const contactsCount = getClientContactsCount(client.id);
                const isDropdownOpen = statusDropdownOpen[client.id] || false;
                const isSelected = selectedClients.has(client.id);
                
                return (
                  <div
                    key={client.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative"
                  >
                    <div className="flex items-center gap-4">
                      {/* Selection checkbox */}
                      <button
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(client.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary-500" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Logo */}
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={`${client.company_name} logo`}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={logoUrl ? 'hidden' : ''}>
                        <ClientAvatar client={client} size="md" />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0" onClick={() => handleView(client.id)}>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {client.company_name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                          {client.type || 'Client'}
                        </p>
                        {projects.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {projects.slice(0, 2).map((project) => (
                              <span 
                                key={project.id}
                                className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
                                title={project.name}
                              >
                                <Briefcase className="w-3 h-3 text-primary-500" />
                                <span className="truncate max-w-[150px]">{project.name}</span>
                              </span>
                            ))}
                            {projects.length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                +{projects.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative status-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusDropdownOpen(prev => ({ ...prev, [client.id]: !prev[client.id] }));
                          }}
                          className="relative"
                        >
                          <Badge className={`${getStatusColor(client.status || 'ACTIVE')} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}>
                            {getStatusLabel(client.status || 'ACTIVE')}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </Badge>
                        </button>
                        
                        {isDropdownOpen && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            {statusOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(client, option.value);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                                  client.status === option.value ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                }`}
                              >
                                <span>{option.label}</span>
                                {client.status === option.value && (
                                  <Check className="w-4 h-4 text-primary-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{client.project_count || projects.length || 0}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Projets</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{contactsCount}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Contacts</p>
                        </div>
                      </div>

                      {/* Action Dropdown */}
                      <div className="relative action-dropdown-container">
                        <Dropdown
                          trigger={
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                          items={[
                            {
                              label: 'Voir les détails',
                              onClick: () => openDetailPage(client),
                              icon: <ExternalLink className="w-4 h-4" />,
                            },
                            {
                              label: 'Modifier',
                              onClick: () => handleEdit(client),
                              icon: <Edit className="w-4 h-4" />,
                            },
                            {
                              label: 'Dupliquer',
                              onClick: () => handleDuplicate(client),
                              icon: <Copy className="w-4 h-4" />,
                            },
                            { divider: true },
                            {
                              label: 'Supprimer',
                              onClick: () => handleDelete(client),
                              icon: <Trash2 className="w-4 h-4" />,
                              variant: 'danger',
                            },
                          ]}
                          position="bottom"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Client Details Drawer */}
      <Drawer
        isOpen={showClientDrawer}
        onClose={handleCloseDrawer}
        title={clientDetails ? clientDetails.company_name : 'Détails du client'}
        position="right"
        size="xl"
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        {loadingDetails || isLoadingClientDetail ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : clientDetails ? (
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
                      {clientDetails && (
                        <div className="flex justify-end mb-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              router.push(`/${locale}/dashboard/projets/clients/${clientDetails.id}`);
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
                          {getClientLogo(clientDetails) ? (
                            <img 
                              src={getClientLogo(clientDetails) || undefined} 
                              alt={`${clientDetails.company_name} logo`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {clientDetails.company_name}
                          </h3>
                          {clientDetails.type && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{clientDetails.type}</p>
                          )}
                          <Badge className={getStatusColor(clientDetails.status)}>
                            {getStatusLabel(clientDetails.status)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientDetails.portal_url && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Portail client
                            </h4>
                            <a 
                              href={clientDetails.portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-500 hover:underline"
                            >
                              {clientDetails.portal_url}
                            </a>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Nombre de projets
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {clientDetails.project_count || getClientProjects(clientDetails.id).length}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Nombre de contacts
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {getClientContactsCount(clientDetails.id)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Projects List */}
                      {getClientProjects(clientDetails.id).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Projets associés
                          </h4>
                          <div className="space-y-2">
                            {getClientProjects(clientDetails.id).slice(0, 5).map((project) => (
                              <div 
                                key={project.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                              >
                                <Briefcase className="w-4 h-4 text-primary-500" />
                                <span className="text-sm text-gray-900 dark:text-white">{project.name}</span>
                              </div>
                            ))}
                            {getClientProjects(clientDetails.id).length > 5 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                +{getClientProjects(clientDetails.id).length - 5} autres projets
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Dates */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Créé le
                          </h4>
                          <p className="text-xs text-gray-900 dark:text-white">
                            {formatDate(clientDetails.created_at)}
                          </p>
                        </div>
                        {clientDetails.updated_at && clientDetails.updated_at !== clientDetails.created_at && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Modifié le
                            </h4>
                            <p className="text-xs text-gray-900 dark:text-white">
                              {formatDate(clientDetails.updated_at)}
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
                      <ClientForm
                        client={clientDetails}
                        onSubmit={async (data) => {
                          await handleUpdate(data);
                          setDrawerTab('info');
                        }}
                        onCancel={() => setDrawerTab('info')}
                        loading={updateClientMutation.isPending}
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
            <p className="text-gray-600 dark:text-gray-400">Client non trouvé</p>
          </div>
        )}
      </Drawer>

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
