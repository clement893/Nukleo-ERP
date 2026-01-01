'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { projectsAPI, type Project } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { 
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Users,
  Archive,
  Share2,
  ExternalLink,
  BarChart3,
  ArrowUpDown,
  Briefcase,
} from 'lucide-react';

type ViewMode = 'cards' | 'kanban' | 'list';
type SortBy = 'name' | 'client' | 'status' | 'annee';

// Helper function to generate client logo from name
function getClientLogo(clientName: string | null | undefined): { initials: string; color: string } {
  if (!clientName) return { initials: '??', color: 'bg-gray-500' };
  
  const trimmed = clientName.trim();
  const words = trimmed.split(/\s+/);
  const initials = words.length >= 2 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : trimmed.substring(0, 2).toUpperCase();
  
  // Generate consistent color based on first letter
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
  ];
  const colorIndex = clientName.trim().charCodeAt(0) % colors.length;
  
  return { initials, color: colors[colorIndex] };
}

function ProjectsContent() {
  // const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Load projects from API
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsAPI.list();
      setProjects(data || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  // Initialize projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = projects
      .map(p => p.client_name)
      .filter((c): c is string => !!c);
    return Array.from(new Set(clients)).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = searchQuery === '' || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.equipe?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesClient = clientFilter === 'all' || project.client_name === clientFilter;
      
      return matchesSearch && matchesStatus && matchesClient;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'client':
          comparison = (a.client_name || '').localeCompare(b.client_name || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'annee':
          comparison = (a.annee_realisation || '').localeCompare(b.annee_realisation || '');
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return filtered;
  }, [projects, searchQuery, statusFilter, clientFilter, sortBy, sortAsc]);

  // Calculate KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const archivedProjects = projects.filter(p => p.status === 'ARCHIVED').length;

  // Status config
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
    ACTIVE: { label: 'Actif', color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-600 dark:text-blue-400' },
    COMPLETED: { label: 'Terminé', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-600 dark:text-green-400' },
    ARCHIVED: { label: 'Archivé', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-600 dark:text-gray-400' },
  };

  // Format currency
  // const formatCurrency = (amount: number | null | undefined) => {
  //   if (!amount) return '-';
  //   return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
  // };

  // Toggle sort
  // const handleSort = (newSortBy: SortBy) => {
  //   if (sortBy === newSortBy) {
  //     setSortAsc(!sortAsc);
  //   } else {
  //     setSortBy(newSortBy);
  //     setSortAsc(true);
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Projets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos projets avec intelligence et efficacité
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="px-6 py-3 rounded-lg flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors border border-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nouveau projet</span>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total */}
        <div className="glass-card p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gray-500/10">
              <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</p>
        </div>

        {/* Actifs */}
        <div className="glass-card p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Actifs</p>
        </div>

        {/* Terminés */}
        <div className="glass-card p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{completedProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Terminés</p>
        </div>

        {/* Archivés */}
        <div className="glass-card p-4 rounded-xl border border-gray-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gray-500/10">
              <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-600 dark:text-gray-400">{archivedProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Archivés</p>
        </div>
      </div>

      {/* Filters & Views */}
      <div className="glass-card p-4 rounded-xl mb-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="COMPLETED">Terminés</option>
              <option value="ARCHIVED">Archivés</option>
            </select>

            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            >
              <option value="all">Tous les clients</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            >
              <option value="name">Trier par nom</option>
              <option value="client">Trier par client</option>
              <option value="status">Trier par statut</option>
              <option value="annee">Trier par année</option>
            </select>

            {/* Sort Direction */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-500/10 transition-colors"
            >
              <ArrowUpDown className={`w-4 h-4 ${sortAsc ? '' : 'rotate-180'} transition-transform`} />
            </button>

            {/* Analytics Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-500/10 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors border ${
                viewMode === 'cards'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10 border-gray-200 dark:border-gray-700'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors border ${
                viewMode === 'list'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10 border-gray-200 dark:border-gray-700'
              }`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors border ${
                viewMode === 'kanban'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="glass-card p-6 rounded-xl mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Taux de complétion */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taux de complétion</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Projets actifs */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Projets actifs</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Projets archivés */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Projets archivés</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${totalProjects > 0 ? (archivedProjects / totalProjects) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalProjects > 0 ? Math.round((archivedProjects / totalProjects) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map((project) => {
            const logo = getClientLogo(project.client_name);
            const config = statusConfig[project.status || 'ACTIVE'] || statusConfig['ACTIVE'];
            
            return (
              <div
                key={project.id}
                className="glass-card rounded-xl p-6 hover:scale-[1.01] transition-all duration-200 group border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/30"
              >
                {/* Header with Logo */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Client Logo */}
                  <div className={`${logo.color} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {logo.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{project.client_name || '-'}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config?.bgColor} ${config?.textColor}`}>
                    {project.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                    {config?.label}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  {project.etape && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Étape:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{project.etape}</span>
                    </div>
                  )}
                  {project.equipe && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{project.equipe}</span>
                    </div>
                  )}
                  {project.annee_realisation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{project.annee_realisation}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-center hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    Voir détails
                  </Link>
                  <button className="p-2 rounded-lg hover:bg-gray-500/10 transition-colors border border-gray-200 dark:border-gray-700">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projects List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredAndSortedProjects.map((project) => {
            const logo = getClientLogo(project.client_name);
            const config = statusConfig[project.status || 'ACTIVE'] || statusConfig['ACTIVE'];
            
            return (
              <div
                key={project.id}
                className="glass-card rounded-xl p-4 hover:scale-[1.005] transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/30"
              >
                <div className="flex items-center gap-4">
                  {/* Client Logo */}
                  <div className={`${logo.color} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {logo.initials}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config?.bgColor} ${config?.textColor}`}>
                         {config?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.client_name || '-'}</p>
                  </div>

                  {/* Etape */}
                  {project.etape && (
                    <div className="text-center w-32">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Étape</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{project.etape}</p>
                    </div>
                  )}

                  {/* Team */}
                  {project.equipe && (
                    <div className="text-center w-32">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Équipe</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{project.equipe}</p>
                    </div>
                  )}

                  {/* Year */}
                  {project.annee_realisation && (
                    <div className="text-center w-24">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Année</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{project.annee_realisation}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/projects/${project.id}`} className="p-1.5 rounded-lg hover:bg-gray-500/10 transition-colors border border-gray-200 dark:border-gray-700">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {(['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const).map((status) => {
            const statusProjects = filteredAndSortedProjects.filter(p => p.status === status);
            const config = statusConfig[status] || statusConfig['ACTIVE'];
            
            return (
              <div key={status} className="flex-shrink-0 w-80">
                <div className="glass-card p-4 rounded-xl mb-4 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold ${config?.textColor}`}>
                      {config?.label}
                    </h3>
                    <span className="px-2 py-1 rounded text-sm font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50">
                      {statusProjects.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {statusProjects.map((project) => {
                    const logo = getClientLogo(project.client_name);
                    
                    return (
                      <div key={project.id} className="glass-card p-4 rounded-xl hover:scale-[1.01] transition-all border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`${logo.color} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                            {logo.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{project.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{project.client_name || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          {project.equipe && (
                            <>
                              <Users className="w-3 h-3" />
                              <span>{project.equipe}</span>
                            </>
                          )}
                          {project.annee_realisation && (
                            <>
                              <Calendar className="w-3 h-3 ml-2" />
                              <span>{project.annee_realisation}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedProjects.length === 0 && (
        <div className="glass-card p-12 rounded-xl text-center border border-gray-200/50 dark:border-gray-700/50">
          <div className="p-4 rounded-full bg-gray-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Aucun projet trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Essayez de modifier vos filtres ou créez un nouveau projet.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors border border-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nouveau projet</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
