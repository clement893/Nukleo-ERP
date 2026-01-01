'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading } from '@/components/ui';
import { useInfiniteProjects, useDeleteProject } from '@/lib/query/projects';
import { useToast } from '@/components/ui';
import type { Project } from '@/lib/api/projects';

type ViewMode = 'grid' | 'list';

const statusConfig = {
  ACTIVE: { label: 'Actif', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: TrendingUp },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archivé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: Archive },
  ON_HOLD: { label: 'En pause', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Target },
};

export default function ProjetsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch data
  const { data, isLoading } = useInfiniteProjects(1000);
  const deleteProjectMutation = useDeleteProject();

  // Flatten data
  const projects = useMemo(() => data?.pages.flat() || [], [data]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project: Project) => {
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p: Project) => p.status === 'ACTIVE').length;
    const completed = projects.filter((p: Project) => p.status === 'COMPLETED').length;
    const archived = projects.filter((p: Project) => p.status === 'ARCHIVED').length;
    
    // Calculate total budget
    const totalBudget = projects.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);
    // spent is not available in Project interface, using budget as placeholder
    const totalSpent = 0;
    
    return { total, active, completed, archived, totalBudget, totalSpent };
  }, [projects]);

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

  const handleView = (id: number) => {
    router.push(`/dashboard/projets/projets/${id}`);
  };

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
            <Button 
              className="bg-white text-[#523DC9] hover:bg-white/90"
              onClick={() => router.push('/dashboard/projets/projets/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Briefcase className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Projets</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Terminés</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Archive className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.archived}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Archivés</div>
          </Card>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <DollarSign className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.totalBudget)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Budget Total</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <DollarSign className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.totalSpent)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses Totales</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
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
            
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Tous
              </Button>
              <Button 
                variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Actifs
              </Button>
              <Button 
                variant={statusFilter === 'COMPLETED' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Terminés
              </Button>
              <Button 
                variant={statusFilter === 'ARCHIVED' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('ARCHIVED')}
              >
                Archivés
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
        </Card>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun projet trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre premier projet'}
            </p>
            <Button onClick={() => router.push('/dashboard/projets/projets/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau projet
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project: Project) => {
              const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
              // progress is not available in Project interface, using 0 as default
              const progress = 0;
              const budget = project.budget || 0;
              // spent is not available in Project interface
              const spent = 0;
              
              return (
                <Card 
                  key={project.id}
                  className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer"
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

                  <div className="space-y-3 mb-4">
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
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Info */}
                  {budget > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => handleView(project.id)}>
                        <Eye className="w-4 h-4" />
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
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProjects.map((project: Project) => {
                const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                // progress is not available in Project interface, using 0 as default
                const progress = 0;
                
                return (
                  <div 
                    key={project.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => handleView(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                            <Badge className={`${statusInfo.color} border`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {project.client_name && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{project.client_name}</span>
                              </div>
                            )}
                            {project.equipe && (
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                <span>{project.equipe}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => handleView(project.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
