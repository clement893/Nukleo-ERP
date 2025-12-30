'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import ContactAvatar from '@/components/commercial/ContactAvatar';
import { Plus, Edit, Trash2, Eye, List, Grid, Download, Upload, MoreVertical, FileSpreadsheet, Search, Mail, Phone, X, Users, Building2 } from 'lucide-react';
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
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterPhone, setFilterPhone] = useState<string>('');
  const [filterCircle, setFilterCircle] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  // Pagination pour le scroll infini
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20); // Nombre de contacts par page
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Mock data pour les entreprises et employés (à remplacer par des appels API réels)
  const [companies] = useState<Array<{ id: number; name: string }>>([]);
  const [employees] = useState<Array<{ id: number; name: string }>>([]);
  const circles = ['client', 'prospect', 'partenaire', 'fournisseur', 'autre'];

  // Load contacts avec pagination
  const loadContacts = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setContacts([]);
      setHasMore(true);
    }
    
    setLoading(reset);
    setLoadingMore(!reset);
    setError(null);
    
    try {
      const currentSkip = reset ? 0 : skip;
      const data = await contactsAPI.list(currentSkip, limit);
      
      if (reset) {
        setContacts(data);
        setSkip(limit); // Fix: Always increment by limit, not data.length
      } else {
        // Limit contacts in memory to prevent excessive memory usage
        // Keep only the last 200 contacts loaded
        const MAX_CONTACTS_IN_MEMORY = 200;
        setContacts((prev) => {
          const updated = [...prev, ...data];
          // If we exceed the limit, keep only the most recent ones
          if (updated.length > MAX_CONTACTS_IN_MEMORY) {
            return updated.slice(-MAX_CONTACTS_IN_MEMORY);
          }
          return updated;
        });
        setSkip((prevSkip) => prevSkip + limit); // Fix: Always increment by limit
      }
      
      // Si on reçoit moins de contacts que la limite, il n'y a plus de données
      setHasMore(data.length === limit);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des contacts');
      showToast({
        message: appError.message || 'Erreur lors du chargement des contacts',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [skip, limit, showToast]);

  // Charger plus de contacts pour le scroll infini
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadContacts(false);
    }
  }, [loadingMore, hasMore, loadContacts]);

  useEffect(() => {
    loadContacts(true);
  }, [loadContacts]);

  // Revalidate contacts when window regains focus (with debounce to avoid excessive reloads)
  useEffect(() => {
    let lastReloadTime = Date.now();
    const RELOAD_COOLDOWN = 30000; // 30 seconds minimum between reloads

    const handleFocus = () => {
      const now = Date.now();
      // Only reload if more than 30 seconds have passed since last reload
      if (now - lastReloadTime > RELOAD_COOLDOWN) {
        lastReloadTime = now;
        loadContacts(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadContacts]);

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const cities = new Set<string>();
    const phones = new Set<string>();
    const companyNames = new Set<string>();

    contacts.forEach((contact) => {
      if (contact.city) cities.add(contact.city);
      if (contact.phone) phones.add(contact.phone);
      if (contact.company_name) companyNames.add(contact.company_name);
    });

    return {
      cities: Array.from(cities).sort(),
      phones: Array.from(phones).sort(),
      companyNames: Array.from(companyNames).sort(),
    };
  }, [contacts]);

  // Filtered contacts with search
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesCity = !filterCity || contact.city === filterCity;
      const matchesPhone = !filterPhone || contact.phone === filterPhone;
      const matchesCircle = !filterCircle || contact.circle === filterCircle;
      // Fix: Compare with company_id correctly
      const matchesCompany = !filterCompany || (contact.company_id && contact.company_id.toString() === filterCompany);
      
      // Search filter: search in name, email, phone, company
      const matchesSearch = !searchQuery || 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery) ||
        contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCity && matchesPhone && matchesCircle && matchesCompany && matchesSearch;
    });
  }, [contacts, filterCity, filterPhone, filterCircle, filterCompany, searchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = filterCity || filterPhone || filterCircle || filterCompany || searchQuery;
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterCity('');
    setFilterPhone('');
    setFilterCircle('');
    setFilterCompany('');
    setSearchQuery('');
  }, []);


  // Handle create with optimistic update
  const handleCreate = async (data: ContactCreate | ContactUpdate) => {
    try {
      setLoading(true);
      setError(null);
      const newContact = await contactsAPI.create(data as ContactCreate);
      
      // Optimistic update: add contact to list immediately
      setContacts((prev) => [newContact, ...prev]);
      setShowCreateModal(false);
      showToast({
        message: 'Contact créé avec succès',
        type: 'success',
      });
      
      // Reload only first page in background to ensure data consistency
      // This ensures presigned URLs are fresh, but doesn't block UI
      setTimeout(() => {
        loadContacts(true).catch(() => {
          // Silent fail - optimistic update already shown
        });
      }, 1000);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création du contact');
      showToast({
        message: appError.message || 'Erreur lors de la création du contact',
        type: 'error',
      });
      // Reload on error to ensure consistency
      await loadContacts(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle update with optimistic update
  const handleUpdate = async (data: ContactCreate | ContactUpdate) => {
    if (!selectedContact) return;

    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.update(selectedContact.id, data as ContactUpdate);
      
      // Optimistic update: update contact in list immediately
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedContact.id ? updatedContact : contact
        )
      );
      setShowEditModal(false);
      setSelectedContact(null);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
      
      // Reload only first page in background to ensure data consistency
      setTimeout(() => {
        loadContacts(true).catch(() => {
          // Silent fail - optimistic update already shown
        });
      }, 1000);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification du contact');
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
      // Reload on error to ensure consistency
      await loadContacts(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete with optimistic update
  const handleDelete = async (contactId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    // Optimistic update: remove contact from list immediately
    const contactToDelete = contacts.find((c) => c.id === contactId);
    setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
    if (selectedContact?.id === contactId) {
      setSelectedContact(null);
    }

    try {
      setLoading(true);
      setError(null);
      await contactsAPI.delete(contactId);
      showToast({
        message: 'Contact supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      // Revert optimistic update on error
      if (contactToDelete) {
        setContacts((prev) => [...prev, contactToDelete].sort((a, b) => a.id - b.id));
      }
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression du contact');
      showToast({
        message: appError.message || 'Erreur lors de la suppression du contact',
        type: 'error',
      });
      // Reload on error to ensure consistency
      await loadContacts(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete all contacts
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
      setLoading(true);
      setError(null);
      const result = await contactsAPI.deleteAll();
      // Reload contacts to ensure we have the latest data
      await loadContacts(true);
      setSelectedContact(null);
      showToast({
        message: result.message || `${result.deleted_count} contact(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression des contacts');
      showToast({
        message: appError.message || 'Erreur lors de la suppression des contacts',
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
        const photosMsg = result.photos_uploaded && result.photos_uploaded > 0 ? ` (${result.photos_uploaded} photo(s) uploadée(s))` : '';
        showToast({
          message: `${result.valid_rows} contact(s) importé(s) avec succès${photosMsg}`,
          type: 'success',
        });
      }
      
      // Display warnings, especially for companies not found
      if (result.warnings && result.warnings.length > 0) {
        const companyWarnings = result.warnings.filter(w => 
          w.type === 'company_not_found' || w.type === 'company_partial_match'
        );
        
        if (companyWarnings.length > 0) {
          const uniqueCompanies = new Set(
            companyWarnings
              .map(w => w.data?.company_name as string)
              .filter(Boolean)
          );
          
          const warningMsg = companyWarnings.length === 1 && companyWarnings[0]
            ? `⚠️ ${companyWarnings[0].message}`
            : `⚠️ ${companyWarnings.length} entreprise(s) nécessitent une révision (${Array.from(uniqueCompanies).join(', ')})`;
          
          showToast({
            message: warningMsg,
            type: 'warning',
            duration: 8000, // Longer duration for important warnings
          });
          
          // Also set error state to show detailed warnings
          const warningsText = companyWarnings
            .map(w => `Ligne ${w.row}: ${w.message}`)
            .join('\n');
          setError(`Avertissements d'import:\n${warningsText}`);
        }
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
    router.push(`/${locale}/dashboard/reseau/contacts/${contact.id}`);
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
      render: (_value, contact) => (
        <div className="flex items-center">
          <ContactAvatar contact={contact} size="md" />
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
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        
        const circleColors: Record<string, string> = {
          client: 'bg-green-500 hover:bg-green-600',
          prospect: 'bg-blue-500 hover:bg-blue-600',
          partenaire: 'bg-purple-500 hover:bg-purple-600',
          fournisseur: 'bg-orange-500 hover:bg-orange-600',
          autre: 'bg-gray-500 hover:bg-gray-600',
        };
        
        return (
          <Badge 
            variant="default" 
            className={`capitalize text-white ${circleColors[String(value)] || 'bg-gray-500'}`}
          >
            {String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value, contact) => (
        value ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{String(value)}</span>
            <a
              href={`mailto:${value}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:text-primary-600 transition-colors"
              title="Envoyer un email"
              aria-label={`Envoyer un email à ${contact.first_name} ${contact.last_name}`}
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value, contact) => (
        value ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{String(value)}</span>
            <a
              href={`tel:${value}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:text-primary-600 transition-colors"
              title="Appeler"
              aria-label={`Appeler ${contact.first_name} ${contact.last_name}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
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
        description={`Gérez vos contacts commerciaux${contacts.length > 0 ? ` - ${contacts.length} contact${contacts.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Contacts' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Contact count with improved visual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {filteredContacts.length > 0 ? (
                    <>
                      <span className="text-primary">{filteredContacts.length}</span>
                      {filteredContacts.length !== contacts.length && (
                        <> / <span className="text-muted-foreground">{contacts.length}</span></>
                      )}
                      {' '}contact{filteredContacts.length > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>Aucun contact</>
                  )}
                </span>
              </div>
              {filteredContacts.length !== contacts.length && hasActiveFilters && (
                <Badge variant="default" className="text-xs">
                  Filtré{filteredContacts.length !== contacts.length ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone, entreprise..."
              className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Active filters badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtres actifs:</span>
              {filterCity && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
                  <span>Ville: {filterCity}</span>
                  <button
                    onClick={() => setFilterCity('')}
                    className="hover:text-destructive transition-colors"
                    aria-label={`Supprimer le filtre ville: ${filterCity}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filterPhone && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
                  <span>Téléphone: {filterPhone}</span>
                  <button
                    onClick={() => setFilterPhone('')}
                    className="hover:text-destructive transition-colors"
                    aria-label={`Supprimer le filtre téléphone: ${filterPhone}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filterCircle && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
                  <span>Cercle: {filterCircle.charAt(0).toUpperCase() + filterCircle.slice(1)}</span>
                  <button
                    onClick={() => setFilterCircle('')}
                    className="hover:text-destructive transition-colors"
                    aria-label={`Supprimer le filtre cercle: ${filterCircle}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filterCompany && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
                  <Building2 className="w-3 h-3" />
                  <span>Entreprise: {companies.find(c => c.id.toString() === filterCompany)?.name || filterCompany}</span>
                  <button
                    onClick={() => setFilterCompany('')}
                    className="hover:text-destructive transition-colors"
                    aria-label="Supprimer le filtre entreprise"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
                  <Search className="w-3 h-3" />
                  <span>Recherche: "{searchQuery}"</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-destructive transition-colors"
                    aria-label="Supprimer la recherche"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-primary hover:text-primary-600 hover:underline transition-colors"
              >
                Effacer tous les filtres
              </button>
            </div>
          )}
          
          {/* Top row: Filters, View toggle, Actions */}
          <div className="flex flex-col gap-3">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Entreprise */}
              {companies.length > 0 && (
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px]"
                >
                  <option value="">Entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id.toString()}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Ville */}
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[120px]"
              >
                <option value="">Ville</option>
                {uniqueValues.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {/* Téléphone */}
              <select
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
              >
                <option value="">Téléphone</option>
                {uniqueValues.phones.map((phone) => (
                  <option key={phone} value={phone}>
                    {phone}
                  </option>
                ))}
              </select>

              {/* Cercle */}
              <select
                value={filterCircle}
                onChange={(e) => setFilterCircle(e.target.value)}
                className="px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[120px]"
              >
                <option value="">Cercle</option>
                {circles.map((circle) => (
                  <option key={circle} value={circle}>
                    {circle.charAt(0).toUpperCase() + circle.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Bottom row: View toggle, Actions */}
            <div className="flex items-center justify-between">
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
                              onClick={async () => {
                                try {
                                  await contactsAPI.downloadTemplate();
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
                                  await contactsAPI.downloadZipTemplate();
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
            infiniteScroll={!filterCity && !filterPhone && !filterCircle && !filterCompany}
            hasMore={hasMore && !filterCity && !filterPhone && !filterCircle && !filterCompany}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
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
          hasMore={hasMore && !filterCity && !filterPhone && !filterCircle && !filterCompany}
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
