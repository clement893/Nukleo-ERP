'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { Heading, Text } from '@/components/ui';
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
  if (!trimmed) return { initials: '??', color: 'bg-gray-500' };
  
  const words = trimmed.split(/\s+/);
  let initials: string = '??';
  if (words.length >= 2 && words[0] && words[1]) {
    const firstChar = words[0][0];
    const secondChar = words[1][0];
    if (firstChar && secondChar) {
      initials = (firstChar + secondChar).toUpperCase();
    } else {
      const fallback = trimmed.substring(0, 2).toUpperCase();
      initials = fallback || '??';
    }
  } else {
    const fallback = trimmed.substring(0, 2).toUpperCase();
    initials = fallback || '??';
  }
  
  // Generate consistent color based on first letter
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
  ];
  const firstChar = trimmed[0];
  const colorIndex = firstChar ? firstChar.charCodeAt(0) % colors.length : 0;
  const color: string = colors[colorIndex] ?? colors[0] ?? 'bg-gray-500';
  
  return { initials, color };
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
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
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

  // Get unique teams for filter
  const uniqueTeams = useMemo(() => {
    const teams = projects
      .map(p => p.equipe)
      .filter((t): t is string => !!t);
    return Array.from(new Set(teams)).sort();
  }, [projects]);

  // Get unique stages for filter
  const uniqueStages = useMemo(() => {
    const stages = projects
      .map(p => p.etape)
      .filter((s): s is string => !!s);
    return Array.from(new Set(stages)).sort();
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
      const matchesTeam = teamFilter === 'all' || project.equipe === teamFilter;
      const matchesStage = stageFilter === 'all' || project.etape === stageFilter;
      
      return matchesSearch && matchesStatus && matchesClient && matchesTeam && matchesStage;
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
  }, [projects, searchQuery, statusFilter, clientFilter, teamFilter, stageFilter, sortBy, sortAsc]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Heading level={1}>Projets</Heading>
            <Text variant="body" className="text-muted-foreground mt-1">
              Gérez vos projets avec intelligence et efficacité
            </Text>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="glass-button px-6 py-3 rounded-lg flex items-center gap-2"
            aria-label="Créer un nouveau projet"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">Nouveau projet</span>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-2xl">
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2xl">
        {/* Total */}
        <div className="glass-card p-lg rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-muted">
              <Briefcase className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalProjects}</p>
          <Text variant="caption" className="text-muted-foreground mt-1">Total</Text>
        </div>

        {/* Actifs */}
        <div className="glass-card p-lg rounded-xl border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-primary">{activeProjects}</p>
          <Text variant="caption" className="text-muted-foreground mt-1">Actifs</Text>
        </div>

        {/* Terminés */}
        <div className="glass-card p-lg rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{completedProjects}</p>
          <Text variant="caption" className="text-muted-foreground mt-1">Terminés</Text>
        </div>

        {/* Archivés */}
        <div className="glass-card p-lg rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-muted">
              <Archive className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-muted-foreground">{archivedProjects}</p>
          <Text variant="caption" className="text-muted-foreground mt-1">Archivés</Text>
        </div>
      </div>

      {/* Filters & Views */}
      <div className="glass-card p-lg rounded-xl mb-2xl border border-border">
        <div className="flex flex-col lg:flex-row gap-md items-start lg:items-center justify-between">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder="Rechercher un projet, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                aria-label="Rechercher un projet ou un client"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              aria-label="Filtrer par statut"
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
              className="glass-input px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              aria-label="Filtrer par client"
            >
              <option value="all">Tous les clients</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              aria-label="Filtrer par équipe"
            >
              <option value="all">Toutes les équipes</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              aria-label="Filtrer par étape"
            >
              <option value="all">Toutes les étapes</option>
              {uniqueStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="glass-input px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              aria-label="Trier par"
            >
              <option value="name">Trier par nom</option>
              <option value="client">Trier par client</option>
              <option value="status">Trier par statut</option>
              <option value="annee">Trier par année</option>
            </select>

            {/* Sort Direction */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="glass-button px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label={sortAsc ? "Trier par ordre décroissant" : "Trier par ordre croissant"}
              aria-pressed={!sortAsc}
            >
              <ArrowUpDown className={`w-4 h-4 ${sortAsc ? '' : 'rotate-180'} transition-transform`} aria-hidden="true" />
            </button>

            {/* Analytics Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-muted transition-colors border border-border"
              aria-label="Afficher/masquer les analytics"
              aria-pressed={showAnalytics}
            >
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`glass-button p-2 rounded-lg transition-colors border ${
                viewMode === 'cards'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'text-muted-foreground hover:bg-muted border-border'
              }`}
              aria-label="Vue en cartes"
              aria-pressed={viewMode === 'cards'}
            >
              <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`glass-button p-2 rounded-lg transition-colors border ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'text-muted-foreground hover:bg-muted border-border'
              }`}
              aria-label="Vue en liste"
              aria-pressed={viewMode === 'list'}
            >
              <ListIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`glass-button p-2 rounded-lg transition-colors border ${
                viewMode === 'kanban'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'text-muted-foreground hover:bg-muted border-border'
              }`}
              aria-label="Vue kanban"
              aria-pressed={viewMode === 'kanban'}
            >
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="glass-card p-xl rounded-xl mb-2xl border border-border">
          <Heading level={3} className="mb-4">Analytics</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Taux de complétion */}
            <div>
              <Text variant="small" className="text-muted-foreground mb-2">Taux de complétion</Text>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0}%` }}
                    role="progressbar"
                    aria-valuenow={totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="text-2xl font-black text-foreground">
                  {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Projets actifs */}
            <div>
              <Text variant="small" className="text-muted-foreground mb-2">Projets actifs</Text>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0}%` }}
                    role="progressbar"
                    aria-valuenow={totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="text-2xl font-black text-foreground">
                  {totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Projets archivés */}
            <div>
              <Text variant="small" className="text-muted-foreground mb-2">Projets archivés</Text>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${totalProjects > 0 ? (archivedProjects / totalProjects) * 100 : 0}%` }}
                    role="progressbar"
                    aria-valuenow={totalProjects > 0 ? Math.round((archivedProjects / totalProjects) * 100) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="text-2xl font-black text-foreground">
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
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="glass-card rounded-xl p-lg hover:scale-[1.01] transition-all duration-200 group border border-border hover:border-primary/30 block cursor-pointer"
                aria-label={`Voir les détails du projet ${project.name}`}
              >
                {/* Header with Logo */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Client Logo */}
                  <div className={`${logo.color} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`} aria-hidden="true">
                    {logo.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Heading level={3} className="mb-1 group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </Heading>
                    <Text variant="small" className="text-muted-foreground truncate">{project.client_name || '-'}</Text>
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
                      <Text variant="small" className="text-muted-foreground">Étape:</Text>
                      <Text variant="small" className="font-medium text-foreground">{project.etape}</Text>
                    </div>
                  )}
                  {project.equipe && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <Text variant="small" className="text-foreground">{project.equipe}</Text>
                    </div>
                  )}
                  {project.annee_realisation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <Text variant="small" className="text-foreground">{project.annee_realisation}</Text>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Share project:', project.id);
                    }}
                    className="glass-button p-2 rounded-lg hover:bg-muted transition-colors border border-border"
                    aria-label={`Partager le projet ${project.name}`}
                  >
                    <Share2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </Link>
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
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="glass-card rounded-xl p-lg hover:scale-[1.005] transition-all duration-200 border border-border hover:border-primary/30 block cursor-pointer"
                aria-label={`Voir les détails du projet ${project.name}`}
              >
                <div className="flex items-center gap-4">
                  {/* Client Logo */}
                  <div className={`${logo.color} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`} aria-hidden="true">
                    {logo.initials}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Heading level={3} className="truncate">
                        {project.name}
                      </Heading>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config?.bgColor} ${config?.textColor}`}>
                         {config?.label}
                      </span>
                    </div>
                    <Text variant="small" className="text-muted-foreground">{project.client_name || '-'}</Text>
                  </div>

                  {/* Etape */}
                  {project.etape && (
                    <div className="text-center w-32">
                      <Text variant="caption" className="text-muted-foreground">Étape</Text>
                      <Text variant="small" className="font-bold text-foreground">{project.etape}</Text>
                    </div>
                  )}

                  {/* Team */}
                  {project.equipe && (
                    <div className="text-center w-32">
                      <Text variant="caption" className="text-muted-foreground">Équipe</Text>
                      <Text variant="small" className="font-bold text-foreground">{project.equipe}</Text>
                    </div>
                  )}

                  {/* Year */}
                  {project.annee_realisation && (
                    <div className="text-center w-24">
                      <Text variant="caption" className="text-muted-foreground">Année</Text>
                      <Text variant="small" className="font-bold text-foreground">{project.annee_realisation}</Text>
                    </div>
                  )}

                </div>
              </Link>
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
                <div className="glass-card p-lg rounded-xl mb-4 border border-border">
                  <div className="flex items-center justify-between">
                    <Heading level={3} className={config?.textColor}>
                      {config?.label}
                    </Heading>
                    <span className="px-2 py-1 rounded text-sm font-bold bg-muted border border-border">
                      {statusProjects.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {statusProjects.map((project) => {
                    const logo = getClientLogo(project.client_name);
                    
                    return (
                      <Link 
                        key={project.id} 
                        href={`/dashboard/projects/${project.id}`} 
                        className="glass-card p-lg rounded-xl hover:scale-[1.01] transition-all border border-border block cursor-pointer"
                        aria-label={`Voir les détails du projet ${project.name}`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`${logo.color} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0`} aria-hidden="true">
                            {logo.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Heading level={4} className="text-sm truncate">{project.name}</Heading>
                            <Text variant="caption" className="text-muted-foreground truncate">{project.client_name || '-'}</Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {project.equipe && (
                            <>
                              <Users className="w-3 h-3" aria-hidden="true" />
                              <span>{project.equipe}</span>
                            </>
                          )}
                          {project.annee_realisation && (
                            <>
                              <Calendar className="w-3 h-3 ml-2" aria-hidden="true" />
                              <span>{project.annee_realisation}</span>
                            </>
                          )}
                        </div>
                      </Link>
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
        <div className="glass-card p-3xl rounded-xl text-center border border-border">
          <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-border">
            <Search className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <Heading level={3} className="mb-2">
            Aucun projet trouvé
          </Heading>
          <Text variant="body" className="text-muted-foreground mb-6">
            Essayez de modifier vos filtres ou créez un nouveau projet.
          </Text>
          <Link
            href="/dashboard/projects/new"
            className="glass-button inline-flex items-center gap-2 px-6 py-3 rounded-lg"
            aria-label="Créer un nouveau projet"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
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
