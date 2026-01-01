'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Linkedin,
  Star,
  Plus,
  Camera,
  FileText,
  User,
  Building2,
  Clock,
  X,
  LayoutGrid,
  List,
  MapPin,
  Briefcase,
} from 'lucide-react';

type Contact = {
  id: number;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  photo: string;
  tags: string[];
  isFavorite: boolean;
  lastInteraction: string;
  linkedin?: string;
};

type FilterType = 'all' | 'favorites' | 'vip' | 'clients' | 'prospects' | 'partners';
type ViewMode = 'gallery' | 'list';

export default function ContactsDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data - 12 contacts
  const mockContacts: Contact[] = [
    {
      id: 1,
      name: 'Sophie Martin',
      role: 'CEO',
      company: 'TechCorp',
      email: 'sophie.martin@techcorp.com',
      phone: '+1 (514) 555-0101',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=1',
      tags: ['VIP', 'Client'],
      isFavorite: true,
      lastInteraction: 'Il y a 2 jours',
      linkedin: 'https://linkedin.com/in/sophiemartin',
    },
    {
      id: 2,
      name: 'Jean Dupont',
      role: 'CTO',
      company: 'InnovateLab',
      email: 'jean.dupont@innovatelab.com',
      phone: '+1 (514) 555-0102',
      city: 'Québec',
      photo: 'https://i.pravatar.cc/300?img=12',
      tags: ['Client'],
      isFavorite: false,
      lastInteraction: 'Il y a 5 jours',
      linkedin: 'https://linkedin.com/in/jeandupont',
    },
    {
      id: 3,
      name: 'Marie Leblanc',
      role: 'Marketing Director',
      company: 'BrandCo',
      email: 'marie.leblanc@brandco.com',
      phone: '+1 (514) 555-0103',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=5',
      tags: ['Prospect'],
      isFavorite: false,
      lastInteraction: 'Il y a 1 semaine',
    },
    {
      id: 4,
      name: 'Pierre Durand',
      role: 'Sales Manager',
      company: 'SalesForce Inc',
      email: 'pierre.durand@salesforce.com',
      phone: '+1 (514) 555-0104',
      city: 'Laval',
      photo: 'https://i.pravatar.cc/300?img=13',
      tags: ['Partenaire'],
      isFavorite: true,
      lastInteraction: 'Il y a 3 jours',
    },
    {
      id: 5,
      name: 'Claire Rousseau',
      role: 'Product Manager',
      company: 'StartupXYZ',
      email: 'claire.rousseau@startupxyz.com',
      phone: '+1 (514) 555-0105',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=9',
      tags: ['Prospect'],
      isFavorite: false,
      lastInteraction: 'Il y a 2 semaines',
    },
    {
      id: 6,
      name: 'Thomas Bernard',
      role: 'CFO',
      company: 'FinanceHub',
      email: 'thomas.bernard@financehub.com',
      phone: '+1 (514) 555-0106',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=14',
      tags: ['VIP', 'Client'],
      isFavorite: true,
      lastInteraction: 'Aujourd\'hui',
      linkedin: 'https://linkedin.com/in/thomasbernard',
    },
    {
      id: 7,
      name: 'Julie Petit',
      role: 'HR Director',
      company: 'TalentCo',
      email: 'julie.petit@talentco.com',
      phone: '+1 (514) 555-0107',
      city: 'Québec',
      photo: 'https://i.pravatar.cc/300?img=10',
      tags: ['Fournisseur'],
      isFavorite: false,
      lastInteraction: 'Il y a 4 jours',
    },
    {
      id: 8,
      name: 'Marc Lefebvre',
      role: 'Developer',
      company: 'CodeFactory',
      email: 'marc.lefebvre@codefactory.com',
      phone: '+1 (514) 555-0108',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=15',
      tags: ['Prospect'],
      isFavorite: false,
      lastInteraction: 'Il y a 1 mois',
    },
    {
      id: 9,
      name: 'Emma Moreau',
      role: 'Designer',
      company: 'CreativeStudio',
      email: 'emma.moreau@creativestudio.com',
      phone: '+1 (514) 555-0109',
      city: 'Laval',
      photo: 'https://i.pravatar.cc/300?img=20',
      tags: ['Partenaire'],
      isFavorite: true,
      lastInteraction: 'Hier',
    },
    {
      id: 10,
      name: 'Lucas Simon',
      role: 'Consultant',
      company: 'ConsultPro',
      email: 'lucas.simon@consultpro.com',
      phone: '+1 (514) 555-0110',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=16',
      tags: ['Client'],
      isFavorite: false,
      lastInteraction: 'Il y a 6 jours',
    },
    {
      id: 11,
      name: 'Camille Laurent',
      role: 'Entrepreneur',
      company: 'MyStartup',
      email: 'camille.laurent@mystartup.com',
      phone: '+1 (514) 555-0111',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=23',
      tags: ['VIP', 'Prospect'],
      isFavorite: true,
      lastInteraction: 'Il y a 1 jour',
      linkedin: 'https://linkedin.com/in/camillelaurent',
    },
    {
      id: 12,
      name: 'Nicolas Dubois',
      role: 'Investor',
      company: 'VentureCapital',
      email: 'nicolas.dubois@venturecapital.com',
      phone: '+1 (514) 555-0112',
      city: 'Montréal',
      photo: 'https://i.pravatar.cc/300?img=17',
      tags: ['VIP', 'Partenaire'],
      isFavorite: true,
      lastInteraction: 'Il y a 3 heures',
      linkedin: 'https://linkedin.com/in/nicolasdubois',
    },
  ];

  // Tag colors
  const tagColors: Record<string, { bg: string; text: string; border: string }> = {
    VIP: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/20' },
    Client: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' },
    Prospect: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
    Partenaire: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
    Fournisseur: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  };

  // Get unique values for filters
  const uniqueCities = ['all', ...Array.from(new Set(mockContacts.map((c) => c.city)))];
  const uniqueRoles = ['all', ...Array.from(new Set(mockContacts.map((c) => c.role)))];
  const uniqueTags = ['all', ...Array.from(new Set(mockContacts.flatMap((c) => c.tags)))];

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let filtered = mockContacts;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.company.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.role.toLowerCase().includes(query) ||
          contact.city.toLowerCase().includes(query)
      );
    }

    // Apply quick filter
    if (activeFilter === 'favorites') {
      filtered = filtered.filter((c) => c.isFavorite);
    } else if (activeFilter === 'vip') {
      filtered = filtered.filter((c) => c.tags.includes('VIP'));
    } else if (activeFilter === 'clients') {
      filtered = filtered.filter((c) => c.tags.includes('Client'));
    } else if (activeFilter === 'prospects') {
      filtered = filtered.filter((c) => c.tags.includes('Prospect'));
    } else if (activeFilter === 'partners') {
      filtered = filtered.filter((c) => c.tags.includes('Partenaire'));
    }

    // Apply city filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter((c) => c.city === cityFilter);
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((c) => c.role === roleFilter);
    }

    // Apply tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter((c) => c.tags.includes(tagFilter));
    }

    return filtered;
  }, [searchQuery, activeFilter, cityFilter, roleFilter, tagFilter]);

  // Quick filters
  const quickFilters: { id: FilterType; label: string; icon: any; count: number }[] = [
    { id: 'all', label: 'Tous', icon: User, count: mockContacts.length },
    { id: 'favorites', label: 'Favoris', icon: Star, count: mockContacts.filter((c) => c.isFavorite).length },
    { id: 'vip', label: 'VIP', icon: Star, count: mockContacts.filter((c) => c.tags.includes('VIP')).length },
    { id: 'clients', label: 'Clients', icon: Building2, count: mockContacts.filter((c) => c.tags.includes('Client')).length },
    { id: 'prospects', label: 'Prospects', icon: User, count: mockContacts.filter((c) => c.tags.includes('Prospect')).length },
    { id: 'partners', label: 'Partenaires', icon: Building2, count: mockContacts.filter((c) => c.tags.includes('Partenaire')).length },
  ];

  // Toggle favorite
  const toggleFavorite = (id: number) => {
    // In real app, call API
    console.log('Toggle favorite:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <span>/</span>
          <span>Contacts Demo</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Contacts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gérez vos contacts commerciaux efficacement
        </p>
      </div>

      {/* Search & Actions */}
      <div className="glass-card p-4 rounded-xl mb-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, entreprise, email, rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-blue-600 text-white'
                  : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              Galerie
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
              Liste
            </button>
          </div>

          {/* Add Contact Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau contact
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Ville
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city === 'all' ? 'Toutes les villes' : city}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Rôle
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'Tous les rôles' : role}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Tag
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag === 'all' ? 'Tous les tags' : tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} trouvé{filteredContacts.length > 1 ? 's' : ''}
      </div>

      {/* Contacts Gallery */}
      {filteredContacts.length === 0 ? (
        <div className="glass-card p-12 rounded-xl text-center border border-gray-200/50 dark:border-gray-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-badge flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun contact trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Essayez de modifier vos filtres ou ajoutez un nouveau contact
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un contact
          </button>
        </div>
      ) : viewMode === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-card rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:scale-[1.01] transition-all duration-200 group"
            >
              {/* Photo - Portrait Mode */}
              <div className="relative h-64 bg-gradient-to-br from-blue-500 to-purple-600">
                <img
                  src={contact.photo}
                  alt={contact.name}
                  className="w-full h-full object-cover"
                />
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(contact.id)}
                  className={`absolute top-3 right-3 w-10 h-10 rounded-full glass-button flex items-center justify-center transition-all ${
                    contact.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`w-5 h-5 ${contact.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Name & Role */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {contact.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
                  {contact.role}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-500 mb-3">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{contact.company}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {contact.tags.map((tag) => {
                    const colors = tagColors[tag] || tagColors.Client;
                    return (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors?.bg} ${colors?.text} border ${colors?.border}`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>

                {/* Last Interaction */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500 mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{contact.lastInteraction}</span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                  <a
                    href={`tel:${contact.phone}`}
                    className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Appeler"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  {contact.linkedin ? (
                    <a
                      href={contact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      className="glass-button p-2.5 rounded-lg flex items-center justify-center text-gray-400 cursor-not-allowed"
                      disabled
                      title="LinkedIn non disponible"
                    >
                      <Linkedin className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-card p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:scale-[1.005] transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* Photo */}
                <img
                  src={contact.photo}
                  alt={contact.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {contact.name}
                    </h3>
                    {contact.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                    {contact.role} @ {contact.company}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {contact.tags.map((tag) => {
                      const colors = tagColors[tag] || tagColors.Client;
                      return (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors?.bg} ${colors?.text} border ${colors?.border}`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {contact.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {contact.lastInteraction}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={`tel:${contact.phone}`}
                    className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Appeler"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  {contact.linkedin && (
                    <a
                      href={contact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button p-2.5 rounded-lg flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter un contact</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-lg glass-button flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Scan Business Card */}
              <button className="glass-card p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Scanner carte
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Prenez une photo de la carte d'affaires pour extraire les informations
                </p>
              </button>

              {/* Option 2: Import LinkedIn */}
              <button className="glass-card p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Linkedin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Import LinkedIn
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Importez depuis un screenshot de profil LinkedIn
                </p>
              </button>

              {/* Option 3: Manual Form */}
              <button className="glass-card p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Formulaire manuel
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Remplissez les informations manuellement
                </p>
              </button>
            </div>

            {/* Note */}
            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Astuce :</strong> Le scan de carte et l'import LinkedIn utilisent l'IA pour extraire automatiquement les informations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
