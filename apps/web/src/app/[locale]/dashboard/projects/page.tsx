'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { projectsAPI, type Project } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { 
  Plus, 
  LayoutGrid, 
  LayoutList, 
  Filter,
  Search,
  ExternalLink,
  Calendar,
  Users,
  TrendingUp,
  Briefcase
} from 'lucide-react';

type ViewMode = 'table' | 'cards';

function ProjectsContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [etapeFilter, setEtapeFilter] = useState<string>('all');
  const [anneeFilter, setAnneeFilter] = useState<string>('all');

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

  // Get unique values for filters
  const uniqueEtapes = useMemo(() => {
    const etapes = projects
      .map(p => p.etape)
      .filter((e): e is string => !!e);
    return Array.from(new Set(etapes)).sort();
  }, [projects]);

  const uniqueAnnees = useMemo(() => {
    const annees = projects
      .map(p => p.annee_realisation)
      .filter((a): a is string => !!a);
    return Array.from(new Set(annees)).sort().reverse();
  }, [projects]);

  // Filter and search projects
  const filteredProjects = useMemo((): Project[] => {
    return projects.filter((project: Project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.client_name?.toLowerCase().includes(query) ||
          project.equipe?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }

      // Etape filter
      if (etapeFilter !== 'all' && project.etape !== etapeFilter) {
        return false;
      }

      // Annee filter
      if (anneeFilter !== 'all' && project.annee_realisation !== anneeFilter) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, statusFilter, etapeFilter, anneeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const active = filteredProjects.filter(p => p.status === 'ACTIVE').length;
    const completed = filteredProjects.filter(p => p.status === 'COMPLETED').length;
    const withBudget = filteredProjects.filter(p => (p as Project & { budget?: number | null }).budget).length;

    return { total, active, completed, withBudget };
  }, [filteredProjects]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      ACTIVE: 'success',
      COMPLETED: 'default',
      ARCHIVED: 'warning',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      COMPLETED: 'Terminé',
      ARCHIVED: 'Archivé',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span 
            className="font-medium text-foreground hover:text-primary cursor-pointer"
            onClick={() => router.push(`/dashboard/projects/${row.id}`)}
          >
            {String(value)}
          </span>
          {row.client_name && (
            <span className="text-sm text-muted-foreground">{row.client_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'etape',
      label: 'Étape',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-foreground">
          {value ? String(value) : '-'}
        </span>
      ),
    },
    {
      key: 'equipe',
      label: 'Équipe',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value ? String(value) : '-'}
        </span>
      ),
    },
    {
      key: 'annee_realisation',
      label: 'Année',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value ? String(value) : '-'}
        </span>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-foreground">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusBadge(String(value))}>
          {getStatusLabel(String(value))}
        </Badge>
      ),
    },
  ];

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Projets</h1>
            <p className="text-muted-foreground">
              Gérez vos projets, clients et livrables
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/projects/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau projet
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Terminés</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avec budget</p>
                <p className="text-3xl font-bold text-purple-600">{stats.withBudget}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <Card className="glass-card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un projet, client, équipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  fullWidth
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'ACTIVE', label: 'Actif' },
                  { value: 'COMPLETED', label: 'Terminé' },
                  { value: 'ARCHIVED', label: 'Archivé' },
                ]}
                className="w-40"
              />

              <Select
                value={etapeFilter}
                onChange={(e) => setEtapeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Toutes les étapes' },
                  ...uniqueEtapes.map(e => ({ value: e, label: e })),
                ]}
                className="w-48"
              />

              <Select
                value={anneeFilter}
                onChange={(e) => setAnneeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Toutes les années' },
                  ...uniqueAnnees.map(a => ({ value: a, label: a || '' })),
                ]}
                className="w-40"
              />

              {/* View Toggle */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 transition-colors ${
                    viewMode === 'table'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  }`}
                  title="Vue table"
                >
                  <LayoutList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  }`}
                  title="Vue cartes"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading && projects.length === 0 ? (
          <Card className="glass-card">
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : viewMode === 'table' ? (
          <Card className="glass-card">
            <div className="p-6">
              <DataTable
                data={filteredProjects as unknown as Array<Record<string, unknown>>}
                columns={columns as unknown as Column<Record<string, unknown>>[]}
                pageSize={20}
                searchable={false}
                emptyMessage="Aucun projet trouvé"
                loading={loading}
              />
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: Project) => {
              const desc = project.description ?? null;
              return (
              <Card 
                key={project.id} 
                className="glass-card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">
                      {project.name}
                    </h3>
                    {project.client_name && (
                      <p className="text-sm text-muted-foreground">{project.client_name}</p>
                    )}
                  </div>
                  <Badge variant={getStatusBadge(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                {/* Description */}
                {desc && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {desc}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  {project.etape && (
                    <div className="flex items-center gap-2 text-sm">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{project.etape}</span>
                    </div>
                  )}
                  {project.equipe && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Équipe {project.equipe}</span>
                    </div>
                  )}
                  {project.annee_realisation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{project.annee_realisation}</span>
                    </div>
                  )}
                </div>

                {/* Budget */}
                {'budget' in project && project.budget && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Budget</span>
                      <span className="text-lg font-semibold text-foreground">
                        {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Links */}
                {(project.drive_url || project.slack_url || project.proposal_url) && (
                  <div className="pt-4 border-t border-border mt-4">
                    <div className="flex gap-2">
                      {project.drive_url && (
                        <a
                          href={project.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {project.slack_url && (
                        <a
                          href={project.slack_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          Slack <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {project.proposal_url && (
                        <a
                          href={project.proposal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          Proposal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
