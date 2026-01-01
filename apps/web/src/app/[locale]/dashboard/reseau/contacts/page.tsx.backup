'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useInfiniteReseauContacts, 
  useCreateReseauContact, 
  useUpdateReseauContact,
  useReseauContactsCount
} from '@/lib/query/reseau-contacts';
import type { Contact } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import Alert from '@/components/ui/Alert';
import ContactForm from '@/components/reseau/ContactForm';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { 
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Phone,
  Mail,
  MessageCircle,
  Linkedin,
  Star,
  Users,
  Briefcase,
  UserPlus,
  TrendingUp,
  X,
  Tag
} from 'lucide-react';

type ViewMode = 'gallery' | 'list';
type FilterType = 'all' | 'favorites' | 'vip' | 'clients' | 'prospects' | 'partners';
type SortBy = 'name' | 'date' | 'company' | 'city';
type SortDirection = 'asc' | 'desc';

export default function ContactsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [customQuickFilters, setCustomQuickFilters] = useState<string[]>([]);
  const [showAddQuickFilterModal, setShowAddQuickFilterModal] = useState(false);

  // API Hooks
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteReseauContacts(50);

  const createContactMutation = useCreateReseauContact();
  const updateContactMutation = useUpdateReseauContact();
  
  // Get total count
  const { data: totalCount } = useReseauContactsCount();

  // Flatten contacts from pages
  const contacts = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  // Get unique cities, roles, tags
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    contacts.forEach(contact => {
      if (contact.city && contact.city.trim()) {
        cities.add(contact.city.trim());
      }
    });
    return Array.from(cities).sort();
  }, [contacts]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    contacts.forEach(contact => {
      if (contact.position && contact.position.trim()) {
        roles.add(contact.position.trim());
      }
    });
    return Array.from(roles).sort();
  }, [contacts]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(contact => {
      if (contact.circle && typeof contact.circle === 'string') {
        contact.circle.split(',').forEach((tag: string) => {
          const trimmed = tag.trim();
          if (trimmed) tags.add(trimmed);
        });
      }
    });
    return Array.from(tags).sort();
  }, [contacts]);

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    const filtered = contacts.filter(contact => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          contact.first_name?.toLowerCase().includes(query) ||
          contact.last_name?.toLowerCase().includes(query) ||
          contact.company_name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.position?.toLowerCase().includes(query) ||
          contact.city?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter (favorites, vip, etc.)
      if (filterType === 'favorites' && !favorites.has(contact.id)) return false;
      
      // Safely check circle tags - handle null/undefined and case-insensitive matching
      const circleTags = contact.circle && typeof contact.circle === 'string' 
        ? contact.circle.split(',').map((t: string) => t.trim().toLowerCase())
        : [];
      
      // Only apply circle filters if filterType is not 'all' and not 'favorites'
      if (filterType !== 'all' && filterType !== 'favorites') {
        if (filterType === 'vip' && !circleTags.includes('vip')) return false;
        if (filterType === 'clients' && !circleTags.includes('client')) return false;
        if (filterType === 'prospects' && !circleTags.includes('prospect')) return false;
        if (filterType === 'partners' && !circleTags.includes('partenaire')) return false;
      }

      // City filter - handle null/undefined safely
      if (cityFilter !== 'all' && (!contact.city || contact.city.trim() !== cityFilter)) return false;

      // Role filter - handle null/undefined safely
      if (roleFilter !== 'all' && (!contact.position || contact.position.trim() !== roleFilter)) return false;

      // Tag filter - handle null/undefined and case-insensitive matching
      if (tagFilter !== 'all' && !circleTags.includes(tagFilter.toLowerCase())) return false;

      return true;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
          const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
          comparison = aName.localeCompare(bName, 'fr', { sensitivity: 'base' });
          break;
        
        case 'date':
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = aDate - bDate;
          break;
        
        case 'company':
          const aCompany = (a.company_name || '').toLowerCase();
          const bCompany = (b.company_name || '').toLowerCase();
          comparison = aCompany.localeCompare(bCompany, 'fr', { sensitivity: 'base' });
          break;
        
        case 'city':
          const aCity = (a.city || '').toLowerCase();
          const bCity = (b.city || '').toLowerCase();
          comparison = aCity.localeCompare(bCity, 'fr', { sensitivity: 'base' });
          break;
        
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [contacts, searchQuery, filterType, cityFilter, roleFilter, tagFilter, favorites, sortBy, sortDirection]);

  // Count by type - safely handle null/undefined and case-insensitive
  const counts = useMemo(() => {
    return {
      all: contacts.length,
      favorites: contacts.filter(c => favorites.has(c.id)).length,
      vip: contacts.filter(c => {
        if (!c.circle || typeof c.circle !== 'string') return false;
        return c.circle.split(',').map((t: string) => t.trim().toLowerCase()).includes('vip');
      }).length,
      clients: contacts.filter(c => {
        if (!c.circle || typeof c.circle !== 'string') return false;
        return c.circle.split(',').map((t: string) => t.trim().toLowerCase()).includes('client');
      }).length,
      prospects: contacts.filter(c => {
        if (!c.circle || typeof c.circle !== 'string') return false;
        return c.circle.split(',').map((t: string) => t.trim().toLowerCase()).includes('prospect');
      }).length,
      partners: contacts.filter(c => {
        if (!c.circle || typeof c.circle !== 'string') return false;
        return c.circle.split(',').map((t: string) => t.trim().toLowerCase()).includes('partenaire');
      }).length,
    };
  }, [contacts, favorites]);

  // Toggle favorite
  const toggleFavorite = (contactId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(contactId)) {
        newFavorites.delete(contactId);
      } else {
        newFavorites.add(contactId);
      }
      return newFavorites;
    });
  };

  // Get tag colors
  const getTagColors = (tag: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'VIP': { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
      'Client': { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
      'Prospect': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
      'Partenaire': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
      'Fournisseur': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
    };
    return colors[tag] || { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' };
  };

  // Handle create
  const handleCreate = async (data: any) => {
    try {
      await createContactMutation.mutateAsync(data);
      setShowAddModal(false);
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

  // Handle update
  const handleUpdate = async (data: any) => {
    if (!selectedContact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        data,
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

  // Loading skeleton for gallery view
  const ContactCardSkeleton = () => (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
      <Skeleton variant="rectangular" height={256} className="w-full" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="60%" height={16} />
        </div>
        <div className="flex gap-1">
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="circular" width={40} height={40} />
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-2">
              <Skeleton variant="text" width={200} height={36} />
              <Skeleton variant="text" width={300} height={20} />
            </div>
            <Skeleton variant="rectangular" width={160} height={44} />
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="glass-card p-4 rounded-xl mb-6 space-y-4">
          <Skeleton variant="rectangular" width="100%" height={44} />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={100} height={36} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={100} height={36} />
            ))}
          </div>
        </div>

        {/* Gallery skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ContactCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen p-6">
        <Alert variant="error">
          {error?.message || 'Erreur lors du chargement des contacts'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Contacts</h1>
              {totalCount !== undefined && (
                <span className="glass-badge px-3 py-1 rounded-full text-sm font-medium text-muted-accessible">
                  {totalCount} total
                </span>
              )}
            </div>
            <p className="text-muted-accessible mt-1">Gérez vos contacts commerciaux efficacement</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="glass-button px-6 py-3 rounded-xl flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition-all"
            aria-label="Créer un nouveau contact"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Nouveau contact
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-xl mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher par nom, entreprise, email, rôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-lg"
            aria-label="Rechercher des contacts"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'gallery'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode galerie"
            aria-pressed={viewMode === 'gallery'}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Galerie
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              viewMode === 'list'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Afficher en mode liste"
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon className="w-4 h-4" aria-hidden="true" />
            Liste
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => {
              setFilterType('all');
              setTagFilter('all');
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'all' && tagFilter === 'all'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            Tous {counts.all}
          </button>
          <button
            onClick={() => {
              setFilterType('favorites');
              setTagFilter('all');
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'favorites'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Star className="w-4 h-4" aria-hidden="true" />
            Favoris {counts.favorites}
          </button>
          <button
            onClick={() => {
              setFilterType('vip');
              setTagFilter('all');
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'vip'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            VIP {counts.vip}
          </button>
          <button
            onClick={() => {
              setFilterType('clients');
              setTagFilter('all');
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'clients'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Briefcase className="w-4 h-4" aria-hidden="true" />
            Clients {counts.clients}
          </button>
          <button
            onClick={() => {
              setFilterType('prospects');
              setTagFilter('all');
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'prospects'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Prospects {counts.prospects}
          </button>
          <button
            onClick={() => {
              setFilterType('partners');
              setTagFilter('all');
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              filterType === 'partners'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            Partenaires {counts.partners}
          </button>
          
          {/* Custom Quick Filters */}
          {customQuickFilters.map((tag) => {
            const tagCount = contacts.filter(c => {
              if (!c.circle || typeof c.circle !== 'string') return false;
              return c.circle.split(',').map((t: string) => t.trim().toLowerCase()).includes(tag.toLowerCase());
            }).length;
            
            return (
              <button
                key={tag}
                onClick={() => {
                  setFilterType('all');
                  setTagFilter(tag);
                }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  tagFilter === tag && filterType === 'all'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Tag className="w-4 h-4" aria-hidden="true" />
                {tag} {tagCount}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomQuickFilters(prev => prev.filter(t => t !== tag));
                    if (tagFilter === tag) {
                      setFilterType('all');
                      setTagFilter('all');
                    }
                  }}
                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
                  aria-label={`Supprimer le filtre ${tag}`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </button>
            );
          })}
          
          {/* Add Quick Filter Button */}
          <button
            onClick={() => setShowAddQuickFilterModal(true)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 glass-badge hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-dashed border-gray-300 dark:border-gray-600"
            aria-label="Ajouter un filtre rapide"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <Tag className="w-4 h-4" aria-hidden="true" />
            Ajouter un filtre
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par ville"
          >
            <option value="all">Toutes les villes</option>
            {uniqueCities.length > 0 ? (
              uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))
            ) : (
              <option value="all" disabled>Aucune ville disponible</option>
            )}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par rôle"
          >
            <option value="all">Tous les rôles</option>
            {uniqueRoles.length > 0 ? (
              uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))
            ) : (
              <option value="all" disabled>Aucun rôle disponible</option>
            )}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par tag"
          >
            <option value="all">Tous les tags</option>
            {uniqueTags.length > 0 ? (
              uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))
            ) : (
              <option value="all" disabled>Aucun tag disponible</option>
            )}
          </select>

          {/* Sort Selector */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="glass-input flex-1 px-4 py-2 rounded-lg"
              aria-label="Trier les contacts"
            >
              <option value="name">Trier par nom</option>
              <option value="date">Trier par date d'ajout</option>
              <option value="company">Trier par entreprise</option>
              <option value="city">Trier par ville</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="glass-input px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={sortDirection === 'asc' ? 'Trier en ordre croissant' : 'Trier en ordre décroissant'}
              title={sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-muted-accessible">
        {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} trouvé{filteredContacts.length > 1 ? 's' : ''}
      </div>

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {filteredContacts.map((contact) => {
            const tags = contact.circle ? contact.circle.split(',').map((t: string) => t.trim()) : [];
            
            return (
              <div
                key={contact.id}
                onClick={() => router.push(`/dashboard/reseau/contacts/${contact.id}`)}
                className="glass-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/dashboard/reseau/contacts/${contact.id}`);
                  }
                }}
                aria-label={`Voir la fiche de ${contact.first_name} ${contact.last_name}`}
              >
                {/* Photo */}
                <div className="relative">
                  <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    {contact.photo_url ? (
                      <img
                        src={contact.photo_url}
                        alt={`${contact.first_name} ${contact.last_name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="text-6xl font-bold text-gray-400">
                        {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(contact.id);
                    }}
                    className="absolute top-3 right-3 glass-badge p-2 rounded-full hover:scale-110 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
                    aria-label={favorites.has(contact.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    title={favorites.has(contact.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        favorites.has(contact.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    <p className="text-sm text-muted-accessible">{contact.position}</p>
                    <p className="text-sm text-muted-accessible flex items-center gap-1 mt-1">
                      <Briefcase className="w-3 h-3" aria-hidden="true" />
                      {contact.company_name}
                    </p>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag: string, idx: number) => {
                        const colors = getTagColors(tag);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="glass-badge p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Appeler ${contact.first_name} ${contact.last_name}`}
                        title="Appeler"
                      >
                        <Phone className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="glass-badge p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Envoyer un email à ${contact.first_name} ${contact.last_name}`}
                        title="Email"
                      >
                        <Mail className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-badge p-2 rounded-lg hover:bg-green-500/10 hover:text-green-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Envoyer un message WhatsApp à ${contact.first_name} ${contact.last_name}`}
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {contact.linkedin && (
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-badge p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={`Voir le profil LinkedIn de ${contact.first_name} ${contact.last_name}`}
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredContacts.map((contact) => {
            const tags = contact.circle ? contact.circle.split(',').map((t: string) => t.trim()) : [];
            
            return (
              <div
                key={contact.id}
                onClick={() => router.push(`/dashboard/reseau/contacts/${contact.id}`)}
                className="glass-card p-4 rounded-xl hover:scale-[1.005] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/dashboard/reseau/contacts/${contact.id}`);
                  }
                }}
                aria-label={`Voir la fiche de ${contact.first_name} ${contact.last_name}`}
              >
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {contact.photo_url ? (
                      <img
                        src={contact.photo_url}
                        alt={`${contact.first_name} ${contact.last_name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="text-xl font-bold text-gray-400">
                        {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {tags.slice(0, 2).map((tag: string, idx: number) => {
                        const colors = getTagColors(tag);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-accessible">
                      {contact.position} • {contact.company_name}
                    </p>
                    <p className="text-xs text-muted-accessible mt-1">
                      {contact.city && `${contact.city} • `}
                      {contact.email}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(contact.id)}
                      className="glass-badge p-2 rounded-lg hover:scale-110 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={favorites.has(contact.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      title={favorites.has(contact.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.has(contact.id)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="glass-badge p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Appeler ${contact.first_name} ${contact.last_name}`}
                        title="Appeler"
                      >
                        <Phone className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="glass-badge p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Envoyer un email à ${contact.first_name} ${contact.last_name}`}
                        title="Email"
                      >
                        <Mail className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-badge p-2 rounded-lg hover:bg-green-500/10 hover:text-green-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Envoyer un message WhatsApp à ${contact.first_name} ${contact.last_name}`}
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {contact.linkedin && (
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-badge p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Voir le profil LinkedIn de ${contact.first_name} ${contact.last_name}`}
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun contact trouvé"
          description="Essayez de modifier vos filtres ou créez un nouveau contact"
          variant="default"
          action={{
            label: "Nouveau contact",
            onClick: () => setShowAddModal(true)
          }}
        />
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="mt-6 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="glass-button px-6 py-3 rounded-xl text-blue-600 hover:bg-blue-500/10 transition-all"
              aria-label="Charger plus de contacts"
            >
              {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
            </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Nouveau contact"
          size="xl"
        >
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}
      
      {/* Add Quick Filter Modal */}
      {showAddQuickFilterModal && (
        <Modal
          isOpen={showAddQuickFilterModal}
          onClose={() => setShowAddQuickFilterModal(false)}
          title="Ajouter un filtre rapide"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-muted-accessible">
              Sélectionnez un tag à ajouter comme filtre rapide :
            </p>
            <select
              className="glass-input w-full px-4 py-2 rounded-lg"
              onChange={(e) => {
                const selectedTag = e.target.value;
                if (selectedTag && !customQuickFilters.includes(selectedTag)) {
                  setCustomQuickFilters(prev => [...prev, selectedTag]);
                  setShowAddQuickFilterModal(false);
                }
              }}
              defaultValue=""
            >
              <option value="">Sélectionner un tag...</option>
              {uniqueTags
                .filter(tag => !customQuickFilters.includes(tag))
                .map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
            </select>
            {uniqueTags.filter(tag => !customQuickFilters.includes(tag)).length === 0 && (
              <p className="text-sm text-muted-accessible">
                Tous les tags disponibles sont déjà dans les filtres rapides.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedContact && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedContact(null);
          }}
          title="Modifier le contact"
        >
          <ContactForm
            contact={selectedContact}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedContact(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
