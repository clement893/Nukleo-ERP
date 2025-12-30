'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Project, type ProjectCreate, type ProjectUpdate } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ProjectForm from '@/components/projets/ProjectForm';
import SearchBar from '@/components/ui/SearchBar';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical, 
  Trash2
} from 'lucide-react';
import ImportLogsViewer from '@/components/commercial/ImportLogsViewer';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteProjects, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteAllProjects,
  projectsAPI 
} from '@/lib/query/projects';

function ProjectsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for projects
  const {
    data: projectsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteProjects(20);
  
  // Mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteAllProjectsMutation = useDeleteAllProjects();
  
  // Flatten pages into single array
  const projects = useMemo(() => {
    return projectsData?.pages.flat() || [];
  }, [projectsData]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  // Debounce search query to avoid excessive re-renders (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Mock data pour les entreprises et employés (à remplacer par des appels API réels)
  const [companies] = useState<Array<{ id: number; name: string }>>([]);
  const [employees] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  const statuses = ['active', 'archived', 'completed'];

  // Load more projects for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered projects with debounced search
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status filter
      const matchesStatus = filterStatus.length === 0 || (project.status && filterStatus.includes(project.status));
      
      // Search filter: search in name, description, client name
      const matchesSearch = !debouncedSearchQuery || 
        project.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [projects, filterStatus, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!(filterStatus.length > 0 || debouncedSearchQuery);
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterStatus([]);
    setSearchQuery('');
  }, []);

  // Handle create with React Query mutation
  const handleCreate = async (data: ProjectCreate | ProjectUpdate) => {
    try {
      await createProjectMutation.mutateAsync(data as ProjectCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Projet créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du projet',
        type: 'error',
      });
    }
  };

  // Handle update with React Query mutation
  const handleUpdate = async (data: ProjectCreate | ProjectUpdate) => {
    if (!selectedProject) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: selectedProject.id,
        data: data as ProjectUpdate,
      });
      setShowEditModal(false);
      setSelectedProject(null);
      showToast({
        message: 'Projet modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du projet',
        type: 'error',
      });
    }
  };

  // Handle delete all projects with React Query mutation
  const handleDeleteAll = async () => {
    const count = projects.length;
    if (count === 0) {
      showToast({
        message: 'Aucun projet à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les ${count} projet(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Tous les projets seront définitivement supprimés. Tapez OK pour confirmer.'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      const result = await deleteAllProjectsMutation.mutateAsync();
      setSelectedProject(null);
      showToast({
        message: result.message || `${result.deleted_count} projet(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des projets',
        type: 'error',
      });
    }
  };

  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Handle import
  const handleImport = async (file: File) => {
    try {
      // Generate import_id before starting import
      const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentImportId(importId);
      setShowImportLogs(true);
      
      const result = await projectsAPI.import(file, importId);
      
      // Update import_id if backend returns a different one (should be the same)
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        // Invalidate projects query to refetch after import
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
      setShowImportLogs(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await projectsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projets-${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Navigate to detail page
  const openDetailPage = (project: Project) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/projets/${project.id}`);
  };

  // Table columns
  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Nom du projet',
      sortable: true,
      render: (_value, project) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium cursor-pointer hover:text-primary" onClick={() => openDetailPage(project)}>
              {project.name}
            </div>
            {project.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">{project.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'client_name',
      label: 'Client',
      sortable: true,
      render: (_value, project) => (
        project.client_name ? (
          <span className="text-foreground cursor-pointer hover:text-primary" onClick={() => {
            // Navigate to client page if needed
          }}>
            {project.client_name}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        
        const statusColors: Record<string, string> = {
          active: 'bg-green-500 hover:bg-green-600',
          archived: 'bg-gray-500 hover:bg-gray-600',
          completed: 'bg-blue-500 hover:bg-blue-600',
        };
        
        const statusLabels: Record<string, string> = {
          active: 'Actif',
          archived: 'Archivé',
          completed: 'Complété',
        };
        
        return (
          <Badge 
            variant="default" 
            className={`text-white ${statusColors[String(value)] || 'bg-gray-500'}`}
          >
            {statusLabels[String(value)] || String(value)}
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

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Projets"
        description={`Gérez vos projets${projects.length > 0 ? ` - ${projects.length} projet${projects.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules Opérations', href: '/dashboard/projets' },
          { label: 'Projets' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Project count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} 
              {hasActiveFilters && ` (filtré${filteredProjects.length > 1 ? 's' : ''} sur ${projects.length})`}
            </div>
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par nom, description, client..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          {/* Filters and Actions */}
          <div className="flex items-center justify-between">
            {/* Status filter */}
            <div className="flex items-center gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => {
                    if (filterStatus.includes(status)) {
                      setFilterStatus(filterStatus.filter(s => s !== status));
                    } else {
                      setFilterStatus([...filterStatus, status]);
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded-md ${
                    filterStatus.includes(status)
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {status === 'active' ? 'Actif' : status === 'archived' ? 'Archivé' : 'Complété'}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-xs rounded-md bg-muted text-foreground hover:bg-muted/80"
                >
                  Effacer les filtres
                </button>
              )}
            </div>

            {/* Actions menu */}
            <div className="relative ml-auto">
              <div className="flex items-center gap-2">
                {/* Primary action */}
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs px-3 py-1.5 h-auto">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nouveau projet
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
                      />
                      <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
                        <div className="py-1">
                          <button
                            onClick={async () => {
                              try {
                                await projectsAPI.downloadTemplate();
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
                                await projectsAPI.downloadZipTemplate();
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
                            Modèle ZIP
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
                            id="import-projects"
                          />
                          <label
                            htmlFor="import-projects"
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
                            disabled={loading || projects.length === 0}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer tous les projets
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
      {loading && projects.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredProjects as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun projet trouvé"
            loading={loading}
            infiniteScroll={filterStatus.length === 0}
            hasMore={hasMore && filterStatus.length === 0}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as Project)}
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau projet"
        size="lg"
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
          companies={companies}
          employees={employees}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedProject !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
        }}
        title="Modifier le projet"
        size="lg"
      >
        {selectedProject && (
          <ProjectForm
            project={selectedProject}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedProject(null);
            }}
            loading={loading}
            companies={companies}
            employees={employees}
          />
        )}
      </Modal>
      
      {/* Import Logs Modal */}
      {showImportLogs && (
        <Modal
          isOpen={showImportLogs}
          onClose={() => setShowImportLogs(false)}
          title="Logs d'import"
          size="lg"
        >
          {currentImportId ? (
            <ImportLogsViewer
              endpointUrl={`/v1/projects/import/${currentImportId}/logs`}
              importId={currentImportId}
              onComplete={() => {
                // Don't auto-close - let user close manually to review logs
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
    </MotionDiv>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
