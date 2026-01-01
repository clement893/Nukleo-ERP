'use client';

import { useState } from 'react';
import { Search, Plus, Building2, Users, DollarSign, TrendingUp, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { NukleoPageHeader } from '@/components/nukleo';
import Link from 'next/link';

export default function ClientsDemoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data
  const clients = [
    {
      id: 69,
      name: 'Innovatech Solutions Inc.',
      type: 'Entreprise',
      industry: 'Technologies',
      status: 'Actif',
      revenue: 450000,
      employees: 125,
      city: 'Montréal',
      province: 'Québec',
      phone: '+1 (514) 555-0100',
      email: 'info@innovatech.ca',
      website: 'www.innovatech.ca',
      projects: 8,
      contacts: 12,
      logo: 'https://ui-avatars.com/api/?name=Innovatech&background=523DC9&color=fff&size=200',
    },
    {
      id: 70,
      name: 'Groupe Financier Laval',
      type: 'Entreprise',
      industry: 'Finance',
      status: 'Actif',
      revenue: 780000,
      employees: 250,
      city: 'Laval',
      province: 'Québec',
      phone: '+1 (450) 555-0200',
      email: 'contact@gfl.ca',
      website: 'www.gfl.ca',
      projects: 15,
      contacts: 24,
      logo: 'https://ui-avatars.com/api/?name=GFL&background=5F2B75&color=fff&size=200',
    },
    {
      id: 71,
      name: 'Services Conseils Québec',
      type: 'PME',
      industry: 'Conseil',
      status: 'Actif',
      revenue: 220000,
      employees: 45,
      city: 'Québec',
      province: 'Québec',
      phone: '+1 (418) 555-0300',
      email: 'info@scq.ca',
      website: 'www.scq.ca',
      projects: 6,
      contacts: 8,
      logo: 'https://ui-avatars.com/api/?name=SCQ&background=6B1817&color=fff&size=200',
    },
    {
      id: 72,
      name: 'Manufacturier Gatineau',
      type: 'Entreprise',
      industry: 'Manufacturier',
      status: 'Actif',
      revenue: 1200000,
      employees: 380,
      city: 'Gatineau',
      province: 'Québec',
      phone: '+1 (819) 555-0400',
      email: 'contact@mfg.ca',
      website: 'www.mfg.ca',
      projects: 22,
      contacts: 35,
      logo: 'https://ui-avatars.com/api/?name=MFG&background=A7A2CF&color=333&size=200',
    },
    {
      id: 73,
      name: 'Distribution Sherbrooke',
      type: 'PME',
      industry: 'Distribution',
      status: 'Prospect',
      revenue: 180000,
      employees: 32,
      city: 'Sherbrooke',
      province: 'Québec',
      phone: '+1 (819) 555-0500',
      email: 'info@dist-sherb.ca',
      website: 'www.dist-sherb.ca',
      projects: 2,
      contacts: 4,
      logo: 'https://ui-avatars.com/api/?name=DS&background=523DC9&color=fff&size=200',
    },
    {
      id: 74,
      name: 'Tech Startup Montréal',
      type: 'Startup',
      industry: 'Technologies',
      status: 'Actif',
      revenue: 95000,
      employees: 18,
      city: 'Montréal',
      province: 'Québec',
      phone: '+1 (514) 555-0600',
      email: 'hello@techstartup.ca',
      website: 'www.techstartup.ca',
      projects: 4,
      contacts: 6,
      logo: 'https://ui-avatars.com/api/?name=TSM&background=5F2B75&color=fff&size=200',
    },
  ];

  const stats = [
    { icon: Building2, label: 'Clients actifs', value: '5', color: 'text-primary-600', bgColor: 'bg-primary-100' },
    { icon: DollarSign, label: 'Revenu total', value: '2.9M $', color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: Users, label: 'Contacts', value: '89', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: TrendingUp, label: 'Projets', value: '57', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  const quickFilters = [
    { id: 'all', label: 'Tous', count: 6 },
    { id: 'active', label: 'Actifs', count: 5 },
    { id: 'prospect', label: 'Prospects', count: 1 },
    { id: 'enterprise', label: 'Entreprises', count: 3 },
    { id: 'sme', label: 'PME', count: 2 },
    { id: 'startup', label: 'Startups', count: 1 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif': return 'bg-green-100 text-green-700 border-green-300';
      case 'Prospect': return 'bg-primary-100 text-primary-700 border-primary-300';
      case 'Inactif': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedType === 'all') return matchesSearch;
    if (selectedType === 'active') return matchesSearch && client.status === 'Actif';
    if (selectedType === 'prospect') return matchesSearch && client.status === 'Prospect';
    if (selectedType === 'enterprise') return matchesSearch && client.type === 'Entreprise';
    if (selectedType === 'sme') return matchesSearch && client.type === 'PME';
    if (selectedType === 'startup') return matchesSearch && client.type === 'Startup';
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <NukleoPageHeader
          title="Clients"
          description="Gérez vos clients et suivez vos relations d'affaires"
          actions={
            <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/30">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau client
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card hover-nukleo">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filtres et Recherche */}
        <Card className="glass-card">
          <div className="p-6 space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, industrie ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedType(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedType === filter.id
                      ? 'bg-[#523DC9] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'grid'
                      ? 'bg-[#523DC9] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'list'
                      ? 'bg-[#523DC9] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Liste
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Clients Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Link key={client.id} href={`/fr/dashboard/client-detail-demo/${client.id}`}>
                <Card className="glass-card hover-nukleo cursor-pointer h-full">
                  <div className="p-6">
                    {/* Logo + Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                        <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
                      </div>
                      <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                    </div>

                    {/* Nom + Type */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 font-nukleo">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {client.type} • {client.industry}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Revenu</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(client.revenue / 1000).toFixed(0)}k $
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Employés</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{client.employees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Projets</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{client.projects}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contacts</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{client.contacts}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{client.city}, {client.province}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <Link key={client.id} href={`/fr/dashboard/client-detail-demo/${client.id}`}>
                  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white font-nukleo truncate">
                            {client.name}
                          </h3>
                          <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {client.type} • {client.industry} • {client.city}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{(client.revenue / 1000).toFixed(0)}k $</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Revenu</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{client.projects}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Projets</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{client.contacts}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Contacts</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
