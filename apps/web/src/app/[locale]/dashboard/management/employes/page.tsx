'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Employee, type EmployeeCreate, type EmployeeUpdate } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import EmployeesGallery from '@/components/employes/EmployeesGallery';
import EmployeeForm from '@/components/employes/EmployeeForm';
import EmployeeAvatar from '@/components/employes/EmployeeAvatar';
import EmployeeCounter from '@/components/employes/EmployeeCounter';
import ViewModeToggle, { type ViewMode } from '@/components/employes/ViewModeToggle';
import EmployeeRowActions from '@/components/employes/EmployeeRowActions';
import SearchBar from '@/components/ui/SearchBar';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical, 
  Trash2,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  UserCircle
} from 'lucide-react';
import ImportEmployeesInstructions from '@/components/employes/ImportEmployeesInstructions';
import ImportLogsViewer from '@/components/commercial/ImportLogsViewer';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteEmployees, 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee, 
  useDeleteAllEmployees,
  employeesAPI 
} from '@/lib/query/employees';

function EmployeesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for employees
  const {
    data: employeesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteEmployees(20);
  
  // Mutations
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const deleteAllEmployeesMutation = useDeleteAllEmployees();
  
  // Flatten pages into single array
  const employees = useMemo(() => {
    return employeesData?.pages.flat() || [];
  }, [employeesData]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showImportLogs, setShowImportLogs] = useState(false);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Load more employees for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered employees with debounced search
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch = !debouncedSearchQuery || 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        employee.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        employee.phone?.includes(debouncedSearchQuery) ||
        employee.linkedin?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [employees, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!debouncedSearchQuery;
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle create
  const handleCreate = async (data: EmployeeCreate | EmployeeUpdate) => {
    try {
      await createEmployeeMutation.mutateAsync(data as EmployeeCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Employé créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de l\'employé',
        type: 'error',
      });
    }
  };

  // Handle update
  const handleUpdate = async (data: EmployeeCreate | EmployeeUpdate) => {
    if (!selectedEmployee) return;

    try {
      await updateEmployeeMutation.mutateAsync({
        id: selectedEmployee.id,
        data: data as EmployeeUpdate,
      });
      setShowEditModal(false);
      setSelectedEmployee(null);
      showToast({
        message: 'Employé modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification de l\'employé',
        type: 'error',
      });
    }
  };

  // Handle delete
  const handleDelete = async (employeeId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      await deleteEmployeeMutation.mutateAsync(employeeId);
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null);
      }
      showToast({
        message: 'Employé supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de l\'employé',
        type: 'error',
      });
    }
  };

  // Handle delete all employees
  const handleDeleteAll = async () => {
    const count = employees.length;
    if (count === 0) {
      showToast({
        message: 'Aucun employé à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les ${count} employé(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Tous les employés seront définitivement supprimés. Tapez OK pour confirmer.'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      const result = await deleteAllEmployeesMutation.mutateAsync();
      setSelectedEmployee(null);
      showToast({
        message: result.message || `${result.deleted_count} employé(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des employés',
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
      
      const result = await employeesAPI.import(file, importId);
      
      // Update import_id if backend returns a different one (should be the same)
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
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
      const blob = await employeesAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const openDetailPage = (employee: Employee) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/management/employes/${employee.id}`);
  };

  // Navigate to portal page
  const openPortalPage = (employee: Employee) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/management/employes/${employee.id}/portail`);
  };

  // Open edit modal
  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Table columns
  const columns: Column<Employee>[] = [
    {
      key: 'photo_url',
      label: '',
      sortable: false,
      render: (_value, employee) => (
        <div className="flex items-center">
          <EmployeeAvatar employee={employee} size="md" />
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Prénom',
      sortable: true,
      render: (_value, employee) => (
        <div className="flex items-center justify-between group">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate" title={`${employee.first_name} ${employee.last_name}`}>{employee.first_name} {employee.last_name}</div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPortalPage(employee);
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Accéder au portail employé"
              aria-label="Accéder au portail employé"
            >
              <UserCircle className="w-4 h-4 text-primary" />
            </button>
            <EmployeeRowActions
              employee={employee}
              onView={() => openDetailPage(employee)}
              onEdit={() => openEditModal(employee)}
              onDelete={() => handleDelete(employee.id)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value) => (
        value ? (
          <a href={`mailto:${value}`} className="text-primary hover:underline flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {String(value)}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value) => (
        value ? (
          <a href={`tel:${value}`} className="text-primary hover:underline flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {String(value)}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      sortable: true,
      render: (value) => (
        value ? (
          <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'hire_date',
      label: 'Date d\'embauche',
      sortable: true,
      render: (value) => (
        value ? (
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(String(value)).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'birthday',
      label: 'Anniversaire',
      sortable: true,
      render: (value) => (
        value ? (
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(String(value)).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Employés"
        description={`Gérez vos employés${employees.length > 0 ? ` - ${employees.length} employé${employees.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Employés' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Employee count */}
          <div className="flex items-center justify-between">
            <EmployeeCounter
              filtered={filteredEmployees.length}
              total={employees.length}
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
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs px-3 py-1.5 h-auto">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nouvel employé
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
                            onClick={() => {
                              setShowImportInstructions(true);
                              setShowActionsMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Instructions d'import
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await employeesAPI.downloadZipTemplate();
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
                            Modèle ZIP (avec photos)
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
                            id="import-employees"
                          />
                          <label
                            htmlFor="import-employees"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted cursor-pointer border-t border-border"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Importer
                          </label>
                          <button
                            onClick={() => {
                              handleExport();
                              setShowActionsMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
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
                            disabled={loading || employees.length === 0}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer tous les employés
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
      {loading && employees.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <DataTable
            data={filteredEmployees as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun employé trouvé"
            loading={loading}
            infiniteScroll={true}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as Employee)}
          />
        </Card>
      ) : (
        <EmployeesGallery
          employees={filteredEmployees}
          onEmployeeClick={openDetailPage}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouvel employé"
        size="lg"
      >
        <EmployeeForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedEmployee !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        title="Modifier l'employé"
        size="lg"
      >
        {selectedEmployee && (
          <EmployeeForm
            employee={selectedEmployee}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedEmployee(null);
            }}
            loading={loading}
          />
        )}
      </Modal>

      {/* Import Instructions Modal */}
      <ImportEmployeesInstructions
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
        onDownloadTemplate={async () => {
          try {
            await employeesAPI.downloadZipTemplate();
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
      />
      
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
              endpointUrl={`/v1/employes/employees/import/${currentImportId}/logs`}
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

export default function EmployeesPage() {
  return <EmployeesContent />;
}
