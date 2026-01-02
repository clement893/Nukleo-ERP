'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  Archive,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  Users,
  Target,
  DollarSign,
  Eye,
  Trash2,
  Edit,
  Download,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Link as LinkIcon,
  FileText
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading, Modal, Select, Alert, useToast } from '@/components/ui';
import { useInfiniteProjects, useDeleteProject, useUpdateProject, useCreateProject } from '@/lib/query/projects';
import { projectsAPI } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import type { Project, ProjectCreate, ProjectUpdate } from '@/lib/api/projects';
import ProjectForm from '@/components/projets/ProjectForm';

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'status' | 'budget' | 'created_at' | 'deadline' | 'client_name' | 'etape';
type SortDirection = 'asc' | 'desc';

const statusConfig = {
  ACTIVE: { label: 'Actif', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: TrendingUp },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archivé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: Archive },
  ON_HOLD: { label: 'En pause', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Target },
};

export default function ProjetsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'fr';
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [equipeFilter, setEquipeFilter] = useState<string>('all');
  const [etapeFilter, setEtapeFilter] = useState<string>('all');
  const [anneeFilter, setAnneeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch data
  const { data, isLoading, refetch } = useInfiniteProjects(1000);
  const deleteProjectMutation = useDeleteProject();
  const updateProjectMutation = useUpdateProject();
  const createProjectMutation = useCreateProject();

  // Flatten data
  const projects = useMemo(() => data?.pages.flat() || [], [data]);

  // Get unique values for filters
  const uniqueEquipes = useMemo(() => {
    const equipes = projects
      .map(p => p.equipe)
      .filter((e): e is string => !!e);
    return Array.from(new Set(equipes)).sort();
  }, [projects]);

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

  const uniqueClients = useMemo(() => {
    const clients = projects
      .map(p => ({ id: p.client_id, name: p.client_name }))
      .filter((c): c is { id: number; name: string } => !!c.id && !!c.name);
    const unique = new Map<number, string>();
    clients.forEach(c => unique.set(c.id, c.name));
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter((project: Project) => {
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.etape && project.etape.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesEquipe = equipeFilter === 'all' || project.equipe === equipeFilter;
      const matchesEtape = etapeFilter === 'all' || project.etape === etapeFilter;
      const matchesAnnee = anneeFilter === 'all' || project.annee_realisation === anneeFilter;
      const matchesClient = clientFilter === 'all' || project.client_id === parseInt(clientFilter);
      
      return matchesSearch && matchesStatus && matchesEquipe && matchesEtape && matchesAnnee && matchesClient;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
          bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
          break;
        case 'client_name':
          aValue = a.client_name || '';
          bValue = b.client_name || '';
          break;
        case 'etape':
          aValue = a.etape || '';
          bValue = b.etape || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, searchQuery, statusFilter, equipeFilter, etapeFilter, anneeFilter, clientFilter, sortField, sortDirection]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p: Project) => p.status === 'ACTIVE').length;
    const completed = projects.filter((p: Project) => p.status === 'COMPLETED').length;
    const archived = projects.filter((p: Project) => p.status === 'ARCHIVED').length;
    
    const totalBudget = projects.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);
    // Spent amount calculation requires time entries and expenses API integration
    // This will be implemented when the backend provides aggregated spending data
    const totalSpent = 0;
    
    return { total, active, completed, archived, totalBudget, totalSpent };
  }, [projects]);

  // Calculate progress (placeholder - should come from backend or calculated from tasks)
  const calculateProgress = (_project: Project): number => {
    // TODO: Calculate from completed tasks / total tasks
    // For now, return 0 or a placeholder
    return 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    
    try {
      await deleteProjectMutation.mutateAsync(id);
      showToast({ message: 'Projet supprimé avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (data: ProjectCreate | ProjectUpdate) => {
    if (!selectedProject) return;
    
    try {
      await updateProjectMutation.mutateAsync({ id: selectedProject.id, data: data as ProjectUpdate });
      setShowEditModal(false);
      setSelectedProject(null);
      showToast({ message: 'Projet modifié avec succès', type: 'success' });
      refetch();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la modification', type: 'error' });
      throw error;
    }
  };

  const handleCreateProject = async (data: ProjectCreate | ProjectUpdate) => {
    try {
      await createProjectMutation.mutateAsync(data as ProjectCreate);
      setShowCreateModal(false);
      showToast({ message: 'Projet créé avec succès', type: 'success' });
      refetch();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
      throw error;
    }
  };

  const handleView = (id: number) => {
    router.push(`/${locale}/dashboard/projets/${id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await projectsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projets-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({ message: 'Export réussi', type: 'success' });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de l\'export', type: 'error' });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await projectsAPI.import(file);
      showToast({
        message: `Import réussi: ${result.valid_rows} projet(s) importé(s)`,
        type: 'success',
      });
      setShowImportModal(false);
      refetch();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de l\'import', type: 'error' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setEquipeFilter('all');
    setEtapeFilter('all');
    setAnneeFilter('all');
    setClientFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || equipeFilter !== 'all' || 
    etapeFilter !== 'all' || anneeFilter !== 'all' || clientFilter !== 'all';

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Projets
              </h1>
              <p className="text-white/80 text-lg">Gérez vos projets et suivez leur progression</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button 
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button 
                className="bg-white text-[#523DC9] hover:bg-white/90"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau projet
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Briefcase className="w-5 h-5 text-[#523DC9]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.active}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Actifs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.completed}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Terminés</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Archive className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.archived}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Archivés</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <DollarSign className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(stats.totalBudget)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Budget</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <DollarSign className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(stats.totalSpent)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Dépenses</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  Tous
                </Button>
                <Button 
                  variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('ACTIVE')}
                  size="sm"
                >
                  Actifs
                </Button>
                <Button 
                  variant={statusFilter === 'COMPLETED' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('COMPLETED')}
                  size="sm"
                >
                  Terminés
                </Button>
                <Button 
                  variant={statusFilter === 'ARCHIVED' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('ARCHIVED')}
                  size="sm"
                >
                  Archivés
                </Button>
                <Button 
                  variant={statusFilter === 'ON_HOLD' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('ON_HOLD')}
                  size="sm"
                >
                  En pause
                </Button>
              </div>

              <div className="flex gap-2 border-l pl-4">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  size="sm"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('list')}
                  size="sm"
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Select
                value={equipeFilter}
                onChange={(e) => setEquipeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Toutes les équipes' },
                  ...uniqueEquipes.map(e => ({ value: e, label: e }))
                ]}
              />
              <Select
                value={etapeFilter}
                onChange={(e) => setEtapeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Toutes les étapes' },
                  ...uniqueEtapes.map(e => ({ value: e, label: e }))
                ]}
              />
              <Select
                value={anneeFilter}
                onChange={(e) => setAnneeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Toutes les années' },
                  ...uniqueAnnees.map(a => ({ value: a, label: a || '' }))
                ]}
              />
              <Select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Tous les clients' },
                  ...uniqueClients.map(c => ({ value: c.id.toString(), label: c.name }))
                ]}
              />
            </div>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="w-full md:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </Card>

        {/* Projects Grid/List */}
        {filteredAndSortedProjects.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun projet trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre premier projet'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            ) : (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau projet
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProjects.map((project: Project) => {
              const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
              const progress = calculateProgress(project);
              const budget = project.budget || 0;
              const spent = 0; // TODO: Calculate from time entries and expenses
              
              return (
                <Card 
                  key={project.id}
                  className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleView(project.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {project.name}
                      </h3>
                      <Badge className={`${statusInfo.color} border`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {project.client_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="truncate">{project.client_name}</span>
                      </div>
                    )}
                    {project.equipe && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Target className="w-4 h-4" />
                        <span className="truncate">{project.equipe}</span>
                      </div>
                    )}
                    {project.etape && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{project.etape}</span>
                      </div>
                    )}
                    {project.annee_realisation && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{project.annee_realisation}</span>
                      </div>
                    )}
                    {(project.end_date || project.deadline) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.end_date || project.deadline!).toLocaleDateString('fr-CA')}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Progression</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#523DC9] to-[#6B1817] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(progress, 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Info */}
                  {budget > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Budget</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(budget)}</span>
                      </div>
                      {spent > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Dépensé</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(spent)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {(project.proposal_url || project.drive_url || project.slack_url || project.echeancier_url) && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {project.proposal_url && (
                          <a href={project.proposal_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Proposition
                            </Badge>
                          </a>
                        )}
                        {project.drive_url && (
                          <a href={project.drive_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Drive
                            </Badge>
                          </a>
                        )}
                        {project.slack_url && (
                          <a href={project.slack_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Slack
                            </Badge>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => handleView(project.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(project)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-[#523DC9]"
                      >
                        Nom
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('client_name')}
                        className="flex items-center gap-1 hover:text-[#523DC9]"
                      >
                        Client
                        {sortField === 'client_name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-[#523DC9]"
                      >
                        Statut
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('etape')}
                        className="flex items-center gap-1 hover:text-[#523DC9]"
                      >
                        Étape
                        {sortField === 'etape' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('budget')}
                        className="flex items-center gap-1 hover:text-[#523DC9]"
                      >
                        Budget
                        {sortField === 'budget' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-left">Progression</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedProjects.map((project: Project) => {
                    const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                    const progress = calculateProgress(project);
                    
                    return (
                      <tr
                        key={project.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => handleView(project.id)}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {project.client_name || '-'}
                        </td>
                        <td className="p-3">
                          <Badge className={`${statusInfo.color} border`}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {project.etape || '-'}
                        </td>
                        <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                          {project.budget ? formatCurrency(project.budget) : '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[#523DC9] to-[#6B1817] h-2 rounded-full"
                                style={{ width: `${Math.max(progress, 0)}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{progress}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" onClick={() => handleView(project.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(project)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </MotionDiv>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau projet"
        size="lg"
      >
        <ProjectForm
          project={null}
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
          loading={createProjectMutation.isPending}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
        }}
        title="Modifier le projet"
        size="lg"
      >
        {selectedProject && (
          <ProjectForm
            project={selectedProject}
            onSubmit={handleUpdateProject}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedProject(null);
            }}
            loading={updateProjectMutation.isPending}
          />
        )}
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des projets"
        size="lg"
      >
        <div className="space-y-4">
          <Alert variant="info">
            Téléchargez d'abord le modèle Excel, remplissez-le avec vos données, puis importez-le ici.
          </Alert>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await projectsAPI.downloadTemplate();
                  showToast({
                    message: 'Modèle téléchargé',
                    type: 'success',
                  });
                } catch (err) {
                  const appError = handleApiError(err);
                  showToast({
                    message: appError.message || 'Erreur lors du téléchargement',
                    type: 'error',
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le modèle
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Fichier Excel à importer
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await handleImport(file);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formats acceptés: .xlsx, .xls
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
