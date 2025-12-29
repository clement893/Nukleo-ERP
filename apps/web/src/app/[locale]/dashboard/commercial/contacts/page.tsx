'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { contactsAPI, type Contact, type ContactCreate, type ContactUpdate } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ContactsGallery from '@/components/commercial/ContactsGallery';
import ContactForm from '@/components/commercial/ContactForm';
import { Plus, Edit, Trash2, Eye, List, Grid, Download, Upload, Filter, X, ChevronDown, MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';
import MotionDiv from '@/components/motion/MotionDiv';

type ViewMode = 'list' | 'gallery';

function ContactsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCircle, setFilterCircle] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Mock data pour les entreprises et employés (à remplacer par des appels API réels)
  const [companies] = useState<Array<{ id: number; name: string }>>([]);
  const [employees] = useState<Array<{ id: number; name: string }>>([]);
  const circles = ['client', 'prospect', 'partenaire', 'fournisseur', 'autre'];

  // Load contacts
  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactsAPI.list();
      setContacts(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des contacts');
      showToast({
        message: appError.message || 'Erreur lors du chargement des contacts',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revalidate contacts when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadContacts();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        !searchTerm ||
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCircle = !filterCircle || contact.circle === filterCircle;
      const matchesCompany = !filterCompany || contact.company_id?.toString() === filterCompany;

      return matchesSearch && matchesCircle && matchesCompany;
    });
  }, [contacts, searchTerm, filterCircle, filterCompany]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterCircle) count++;
    if (filterCompany) count++;
    return count;
  }, [filterCircle, filterCompany]);

  // Clear all filters
  const clearFilters = () => {
    setFilterCircle('');
    setFilterCompany('');
  };

  // Handle create
  const handleCreate = async (data: ContactCreate | ContactUpdate) => {
    try {
      setLoading(true);
      setError(null);
      await contactsAPI.create(data as ContactCreate);
      // Reload contacts to ensure we have the latest data with correct presigned URLs
      await loadContacts();
      setShowCreateModal(false);
      showToast({
        message: 'Contact créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création du contact');
      showToast({
        message: appError.message || 'Erreur lors de la création du contact',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update
  const handleUpdate = async (data: ContactCreate | ContactUpdate) => {
    if (!selectedContact) return;

    try {
      setLoading(true);
      setError(null);
      await contactsAPI.update(selectedContact.id, data as ContactUpdate);
      // Reload contacts to ensure we have the latest data with correct presigned URLs
      await loadContacts();
      setShowEditModal(false);
      setSelectedContact(null);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification du contact');
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (contactId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await contactsAPI.delete(contactId);
      // Reload contacts to ensure we have the latest data
      await loadContacts();
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      showToast({
        message: 'Contact supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression du contact');
      showToast({
        message: appError.message || 'Erreur lors de la suppression du contact',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle import
  const handleImport = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const result = await contactsAPI.import(file);
      
      if (result.valid_rows > 0) {
        // Reload contacts after import
        await loadContacts();
        showToast({
          message: `${result.valid_rows} contact(s) importé(s) avec succès`,
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
      setError(appError.message || 'Erreur lors de l\'import');
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await contactsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      setError(appError.message || 'Erreur lors de l\'export');
      showToast({
        message: appError.message || 'Erreur lors de l\'export',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigate to detail page
  const openDetailPage = (contact: Contact) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/contacts/${contact.id}`);
  };

  // Open edit modal
  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  // Table columns
  const columns: Column<Contact>[] = [
    {
      key: 'photo_url',
      label: '',
      sortable: false,
      render: (value, contact) => (
        <div className="flex items-center">
          {value ? (
            <img
              src={String(value)}
              alt={`${contact.first_name} ${contact.last_name}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">
                {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Prénom',
      sortable: true,
      render: (_value, contact) => (
        <div>
          <div className="font-medium">{contact.first_name} {contact.last_name}</div>
          {contact.position && (
            <div className="text-sm text-muted-foreground">{contact.position}</div>
          )}
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Entreprise',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'circle',
      label: 'Cercle',
      sortable: true,
      render: (value) => (
        value ? (
          <Badge variant="default" className="capitalize">{String(value)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'city',
      label: 'Ville',
      sortable: true,
      render: (_value, contact) => (
        <span className="text-muted-foreground">
          {[contact.city, contact.country].filter(Boolean).join(', ') || '-'}
        </span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Contacts"
        description="Gérez vos contacts commerciaux"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Contacts' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Top row: Search, View toggle, Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full sm:w-auto min-w-0">
              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Right side: View toggle, Circle filter, Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View mode toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'px-2 py-1.5 transition-colors text-xs',
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-background text-foreground hover:bg-muted'
                  )}
                  aria-label="Vue liste"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('gallery')}
                  className={clsx(
                    'px-2 py-1.5 transition-colors text-xs',
                    viewMode === 'gallery'
                      ? 'bg-primary text-white'
                      : 'bg-background text-foreground hover:bg-muted'
                  )}
                  aria-label="Vue galerie"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Circle filter - simplified */}
              <select
                value={filterCircle}
                onChange={(e) => setFilterCircle(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous</option>
                {circles.map((circle) => (
                  <option key={circle} value={circle}>
                    {circle.charAt(0).toUpperCase() + circle.slice(1)}
                  </option>
                ))}
              </select>

              {/* Actions menu */}
              <div className="relative ml-auto sm:ml-0">
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
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImport(file);
                                  setShowActionsMenu(false);
                                }
                              }}
                              className="hidden"
                              id="import-contacts"
                            />
                            <label
                              htmlFor="import-contacts"
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
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters section - collapsible */}
          {(activeFiltersCount > 0 || showFilters) && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Filtres avancés</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Réinitialiser
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Active filters badges */}
                {filterCircle && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 flex items-center gap-1">
                    Cercle: {circles.find(c => c === filterCircle)?.charAt(0).toUpperCase() + circles.find(c => c === filterCircle)?.slice(1)}
                    <button
                      onClick={() => setFilterCircle('')}
                      className="ml-1 hover:text-danger"
                      aria-label="Retirer le filtre cercle"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterCompany && companies.length > 0 && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 flex items-center gap-1">
                    Entreprise: {companies.find(c => c.id.toString() === filterCompany)?.name}
                    <button
                      onClick={() => setFilterCompany('')}
                      className="ml-1 hover:text-danger"
                      aria-label="Retirer le filtre entreprise"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
                  {companies.length > 0 && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Entreprise</label>
                      <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Toutes les entreprises</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id.toString()}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
            pageSize={10}
            searchable={false}
            emptyMessage="Aucun contact trouvé"
            loading={loading}
            onRowClick={(row) => openDetailPage(row as unknown as Contact)}
            actions={(row) => {
              const contact = row as unknown as Contact;
              return [
                {
                  label: 'Voir',
                  onClick: () => openDetailPage(contact),
                  icon: <Eye className="w-4 h-4" />,
                },
                {
                  label: 'Modifier',
                  onClick: () => openEditModal(contact),
                  icon: <Edit className="w-4 h-4" />,
                },
                {
                  label: 'Supprimer',
                  onClick: () => handleDelete(contact.id),
                  icon: <Trash2 className="w-4 h-4" />,
                  variant: 'danger',
                },
              ];
            }}
          />
        </Card>
      ) : (
        <ContactsGallery
          contacts={filteredContacts}
          onContactClick={openDetailPage}
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
          employees={employees}
          circles={circles}
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
            employees={employees}
            circles={circles}
          />
        )}
      </Modal>
    </MotionDiv>
  );
}

export default function ContactsPage() {
  return <ContactsContent />;
}
