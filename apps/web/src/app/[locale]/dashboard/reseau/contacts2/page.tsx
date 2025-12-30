'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Contact, type ContactCreate, type ContactUpdate } from '@/lib/api/reseau-contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ContactsGallery from '@/components/reseau/ContactsGallery';
import ContactForm from '@/components/reseau/ContactForm';
import ContactAvatar from '@/components/reseau/ContactAvatar';
import ContactCounter from '@/components/reseau/ContactCounter';
import ViewModeToggle from '@/components/reseau/ViewModeToggle';
import ContactActionLink from '@/components/reseau/ContactActionLink';
import ContactRowActions from '@/components/reseau/ContactRowActions';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelectFilter from '@/components/reseau/MultiSelectFilter';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MoreVertical, 
  Trash2,
  HelpCircle,
  X
} from 'lucide-react';
import ImportContacts2Instructions from '@/components/reseau/ImportContacts2Instructions';
import ImportLogsViewer from '@/components/commercial/ImportLogsViewer';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteReseauContacts, 
  useCreateReseauContact, 
  useUpdateReseauContact, 
  useDeleteReseauContact, 
  useDeleteAllReseauContacts,
  reseauContactsAPI 
} from '@/lib/query/reseau-contacts';
import { companiesAPI } from '@/lib/api/companies';

import type { ViewMode } from '@/components/reseau/ViewModeToggle';

function Contacts2Content() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for contacts
  const {
    data: contactsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteReseauContacts(20);
  
  // Mutations
  const createContactMutation = useCreateReseauContact();
  const updateContactMutation = useUpdateReseauContact();
  const deleteContactMutation = useDeleteReseauContact();
  const deleteAllContactsMutation = useDeleteAllReseauContacts();
  
  // Flatten pages into single array
  const contacts = useMemo(() => {
    return contactsData?.pages.flat() || [];
  }, [contactsData]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterCircle, setFilterCircle] = useState<string[]>([]);
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showImportLogs, setShowImportLogs] = useState(false);
  
  // Load companies for filter
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  
  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await companiesAPI.list(0, 1000);
        setCompanies(companiesData.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.warn('Could not load companies:', err);
      }
    };
    loadCompanies();
  }, []);
  
  // Debounce search query to avoid excessive re-renders (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Load more contacts for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const countries = new Set<string>();
    const circles = new Set<string>();

    contacts.forEach((contact) => {
      if (contact.country) countries.add(contact.country);
      if (contact.circle) circles.add(contact.circle);
    });

    return {
      countries: Array.from(countries).sort(),
      circles: Array.from(circles).sort(),
    };
  }, [contacts]);

  // Filtered contacts with debounced search
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Country filter
      const matchesCountry = filterCountry.length === 0 || (contact.country && filterCountry.includes(contact.country));
      
      // Circle filter
      const matchesCircle = filterCircle.length === 0 || (contact.circle && filterCircle.includes(contact.circle));
      
      // Company filter
      const matchesCompany = filterCompany.length === 0 || 
        (contact.company_id && filterCompany.includes(contact.company_id.toString()));
      
      // Search filter
      const matchesSearch = !debouncedSearchQuery || 
        contact.first_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesCountry && matchesCircle && matchesCompany && matchesSearch;
    });
  }, [contacts, filterCountry, filterCircle, filterCompany, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!(filterCountry.length > 0 || filterCircle.length > 0 || filterCompany.length > 0 || debouncedSearchQuery);
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterCountry([]);
    setFilterCircle([]);
    setFilterCompany([]);
    setSearchQuery('');
  }, []);

  // Handle create with React Query mutation
  const handleCreate = async (data: ContactCreate | ContactUpdate) => {
    try {
      await createContactMutation.mutateAsync(data as ContactCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Contact créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du contact',
        type: 'error',
      });
    }
  };

  // Handle update with React Query mutation
  const handleUpdate = async (data: ContactCreate | ContactUpdate) => {
    if (!selectedContact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        data: data as ContactUpdate,
      });
      setShowEditModal(false);
      setSelectedContact(null);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
    }
  };

  // Handle delete with React Query mutation
  const handleDelete = async (contactId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      await deleteContactMutation.mutateAsync(contactId);
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      showToast({
        message: 'Contact supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du contact',
        type: 'error',
      });
    }
  };

  // Handle delete all contacts with React Query mutation
  const handleDeleteAll = async () => {
    const count = contacts.length;
    if (count === 0) {
      showToast({
        message: 'Aucun contact à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les ${count} contact(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Tous les contacts seront définitivement supprimés. Tapez OK pour confirmer.'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      const result = await deleteAllContactsMutation.mutateAsync();
      setSelectedContact(null);
      showToast({
        message: result.message || `${result.deleted_count} contact(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des contacts',
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
      
      const result = await reseauContactsAPI.import(file, importId);
      
      // Update import_id if backend returns a different one (should be the same)
      if (result.import_id && result.import_id !== importId) {
        setCurrentImportId(result.import_id);
      }
      
      if (result.valid_rows > 0) {
        // Invalidate contacts query to refetch after import
        queryClient.invalidateQueries({ queryKey: ['reseau-contacts'] });
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
      const blob = await reseauContactsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts2-${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const openDetailPage = (contact: Contact) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/reseau/contacts/${contact.id}`);
  };

  // Open edit modal
  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  // Table columns - adapted for Contacts2
  const columns: Column<Contact>[] = [
    {
      key: 'photo_url',
      label: '',
      sortable: false,
      render: (_value, contact) => (
        <div className="flex items-center w-10 h-10">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <ContactAvatar contact={contact} size="md" className="w-full h-full object-cover" />
          </div>
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Prénom',
      sortable: true,
      render: (_value, contact) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium">{contact.first_name} {contact.last_name}</div>
            {contact.position && (
              <div className="text-sm text-muted-foreground">
                {contact.position}
              </div>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ContactRowActions
              contact={contact}
              onView={() => openDetailPage(contact)}
              onEdit={() => openEditModal(contact)}
              onDelete={() => handleDelete(contact.id)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value, contact) => (
        <ContactActionLink type="email" value={value ? String(value) : ''} contact={contact} />
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value, contact) => (
        <ContactActionLink type="phone" value={value ? String(value) : ''} contact={contact} />
      ),
    },
    {
      key: 'company_name',
      label: 'Compagnie',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'company_id',
      label: 'ID Entreprise',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'position',
      label: 'Poste',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'circle',
      label: 'Cercle',
      sortable: true,
      render: (value) => {
        if (!value) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <Badge variant="default" className="text-xs">
            {String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'city',
      label: 'Ville',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        const url = String(value);
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:text-primary-600 transition-colors"
          >
            {url}
          </a>
        );
      },
    },
    {
      key: 'birthday',
      label: 'Anniversaire',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        try {
          const dateStr = String(value);
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            return <span className="text-muted-foreground">{dateStr}</span>;
          }
          return <span className="text-muted-foreground">{date.toLocaleDateString('fr-FR')}</span>;
        } catch {
          return <span className="text-muted-foreground">{String(value)}</span>;
        }
      },
    },
    {
      key: 'language',
      label: 'Langue',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value).toUpperCase() : '-'}</span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Contacts2"
        description={`Gérez vos contacts${contacts.length > 0 ? ` - ${contacts.length} contact${contacts.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Contacts2' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Contact count */}
          <div className="flex items-center justify-between">
            <ContactCounter
              filtered={filteredContacts.length}
              total={contacts.length}
              showFilteredBadge={hasActiveFilters}
            />
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par nom, email, téléphone, compagnie..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          {/* Active filters badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtres actifs:</span>
              {filterCountry.map((country) => (
                <Badge key={`country-${country}`} variant="default" className="flex items-center gap-1.5 px-2 py-1 cursor-pointer" onClick={() => setFilterCountry(filterCountry.filter(v => v !== country))}>
                  <span>Pays: {country}</span>
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              {filterCircle.map((circle) => (
                <Badge key={`circle-${circle}`} variant="default" className="flex items-center gap-1.5 px-2 py-1 cursor-pointer" onClick={() => setFilterCircle(filterCircle.filter(v => v !== circle))}>
                  <span>Cercle: {circle.charAt(0).toUpperCase() + circle.slice(1)}</span>
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              {filterCompany.map((companyId) => {
                const company = companies.find(c => c.id.toString() === companyId);
                return (
                  <Badge key={`company-${companyId}`} variant="default" className="flex items-center gap-1.5 px-2 py-1 cursor-pointer" onClick={() => setFilterCompany(filterCompany.filter(v => v !== companyId))}>
                    <span>Compagnie: {company?.name || companyId}</span>
                    <X className="w-3 h-3" />
                  </Badge>
                );
              })}
              {debouncedSearchQuery && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1 cursor-pointer" onClick={() => setSearchQuery('')}>
                  <span>Recherche: {debouncedSearchQuery}</span>
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {(filterCountry.length > 0 || filterCircle.length > 0 || filterCompany.length > 0 || debouncedSearchQuery) && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1 cursor-pointer" onClick={clearAllFilters}>
                  <span>Tout effacer</span>
                </Badge>
              )}
            </div>
          )}
          
          {/* Top row: Filters, View toggle, Actions */}
          <div className="flex flex-col gap-3">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Pays */}
              <MultiSelectFilter
                label="Pays"
                options={uniqueValues.countries.map((country) => ({
                  value: country,
                  label: country,
                }))}
                selectedValues={filterCountry}
                onSelectionChange={setFilterCountry}
                className="min-w-[120px]"
              />

              {/* Cercle */}
              <MultiSelectFilter
                label="Cercle"
                options={uniqueValues.circles.map((circle) => ({
                  value: circle,
                  label: circle,
                }))}
                selectedValues={filterCircle}
                onSelectionChange={setFilterCircle}
                className="min-w-[120px]"
              />

              {/* Compagnie */}
              <MultiSelectFilter
                label="Compagnie"
                options={companies.map((company) => ({
                  value: company.id.toString(),
                  label: company.name,
                }))}
                selectedValues={filterCompany}
                onSelectionChange={setFilterCompany}
                className="min-w-[150px]"
              />
            </div>

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
                    Nouveau contact
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
                              <HelpCircle className="w-3.5 h-3.5" />
                              Instructions d'import
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await reseauContactsAPI.downloadTemplate();
                                  setShowActionsMenu(false);
                                } catch (err) {
                                  const appError = handleApiError(err);
                                  showToast({
                                    message: appError.message || 'Erreur lors du téléchargement du modèle',
                                    type: 'error',
                                  });
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Modèle Excel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await reseauContactsAPI.downloadZipTemplate();
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
                              id="import-contacts2"
                            />
                            <label
                              htmlFor="import-contacts2"
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
                              disabled={loading || contacts.length === 0}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer tous les contacts
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

        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading && contacts.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <DataTable
            data={filteredContacts as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun contact trouvé"
            loading={loading}
            infiniteScroll={filterCountry.length === 0 && filterCircle.length === 0 && filterCompany.length === 0}
            hasMore={hasMore && filterCountry.length === 0 && filterCircle.length === 0 && filterCompany.length === 0}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => openDetailPage(row as unknown as Contact)}
          />
        </Card>
      ) : (
        <ContactsGallery
          contacts={filteredContacts}
          onContactClick={openDetailPage}
          hasMore={hasMore && filterCountry.length === 0 && filterCircle.length === 0 && filterCompany.length === 0}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau contact"
        size="lg"
      >
        <ContactForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
          companies={companies}
          employees={[]}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedContact !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContact(null);
        }}
        title="Modifier le contact"
        size="lg"
      >
        {selectedContact && (
          <ContactForm
            contact={selectedContact}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedContact(null);
            }}
            loading={loading}
            companies={companies}
            employees={[]}
          />
        )}
      </Modal>

      {/* Import Instructions Modal */}
      <ImportContacts2Instructions
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
        onDownloadTemplate={async () => {
          try {
            await reseauContactsAPI.downloadZipTemplate();
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
              endpointUrl={`/v1/reseau/contacts/import/${currentImportId}/logs`}
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

export default function Contacts2Page() {
  return <Contacts2Content />;
}
