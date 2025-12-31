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
import { type People, type PeopleCreate, type PeopleUpdate } from '@/lib/api/people';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import PeopleGallery from '@/components/projects/PeopleGallery';
import PeopleForm from '@/components/projects/PeopleForm';
import PeopleAvatar from '@/components/projects/PeopleAvatar';
import PeopleCounter from '@/components/projects/PeopleCounter';
import ViewModeToggle, { type ViewMode } from '@/components/employes/ViewModeToggle';
import PeopleRowActions from '@/components/projects/PeopleRowActions';
import SearchBar from '@/components/ui/SearchBar';
import { 
  Plus, 
  MoreVertical, 
  Trash2
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfinitePeople, 
  useCreatePerson, 
  useUpdatePerson, 
  useDeletePerson,
  peopleAPI 
} from '@/lib/query/people';

function PeopleContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for people
  const {
    data: peopleData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfinitePeople(20);
  
  // Mutations
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const deletePersonMutation = useDeletePerson();
  
  // Flatten pages into single array
  const people = useMemo(() => {
    return peopleData?.pages.flat() || [];
  }, [peopleData]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<People | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Load more people for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered people with debounced search
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchesSearch = !debouncedSearchQuery || 
        `${person.first_name} ${person.last_name}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        person.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        person.phone?.includes(debouncedSearchQuery) ||
        person.linkedin?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [people, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!debouncedSearchQuery;
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle create
  const handleCreate = async (data: PeopleCreate | PeopleUpdate) => {
    try {
      await createPersonMutation.mutateAsync(data as PeopleCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Personne créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de la personne',
        type: 'error',
      });
    }
  };

  // Handle update
  const handleUpdate = async (data: PeopleCreate | PeopleUpdate) => {
    if (!selectedPerson) return;

    try {
      await updatePersonMutation.mutateAsync({
        id: selectedPerson.id,
        data: data as PeopleUpdate,
      });
      setShowEditModal(false);
      setSelectedPerson(null);
      showToast({
        message: 'Personne modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification de la personne',
        type: 'error',
      });
    }
  };

  // Handle delete
  const handleDelete = async (personId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
      return;
    }

    try {
      await deletePersonMutation.mutateAsync(personId);
      if (selectedPerson?.id === personId) {
        setSelectedPerson(null);
      }
      showToast({
        message: 'Personne supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de la personne',
        type: 'error',
      });
    }
  };

  // Navigate to detail page
  const openDetailPage = (person: People) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/projets/people/${person.id}`);
  };

  // Open edit modal
  const openEditModal = (person: People) => {
    setSelectedPerson(person);
    setShowEditModal(true);
  };

  // Table columns - Only Nom, Statut
  const columns: Column<People>[] = [
    {
      key: 'first_name',
      label: 'Nom',
      sortable: true,
      render: (_value, person) => (
        <div className="flex items-center justify-between group">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <PeopleAvatar person={person} size="sm" />
            <div className="font-medium truncate" title={`${person.first_name} ${person.last_name}`}>
              {person.first_name} {person.last_name}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
            <PeopleRowActions
              person={person}
              onView={() => openDetailPage(person)}
              onEdit={() => openEditModal(person)}
              onDelete={() => handleDelete(person.id)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (_value, person) => {
        const status = person.status || 'active';
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
      <PageHeader
        title="People"
        description={`Gérez vos personnes${people.length > 0 ? ` - ${people.length} personne${people.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules Opérations', href: '/dashboard/projets' },
          { label: 'People' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* People count */}
          <div className="flex items-center justify-between">
            <PeopleCounter
              filtered={filteredPeople.length}
              total={people.length}
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
                  Nouvelle personne
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
      {loading && people.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <DataTable
            data={filteredPeople as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucune personne trouvée"
            loading={loading}
            infiniteScroll={true}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as People)}
          />
        </Card>
      ) : (
        <PeopleGallery
          people={filteredPeople}
          onPersonClick={openDetailPage}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle personne"
        size="lg"
      >
        <PeopleForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedPerson !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPerson(null);
        }}
        title="Modifier la personne"
        size="lg"
      >
        {selectedPerson && (
          <PeopleForm
            person={selectedPerson}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPerson(null);
            }}
            loading={loading}
          />
        )}
      </Modal>
    </MotionDiv>
  );
}

export default function PeoplePage() {
  return <PeopleContent />;
}
