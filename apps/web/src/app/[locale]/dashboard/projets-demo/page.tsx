'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

// Mock data pour la démo
const mockProjects = [
  {
    id: 1,
    name: 'Refonte Site Web Acme Corp',
    client: 'Acme Corporation',
    status: 'ACTIVE',
    progress: 65,
    team: 'Design & Dev',
    dueDate: '2026-02-15',
    budget: 45000,
    spent: 29250,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Application Mobile TechStart',
    client: 'TechStart Inc',
    status: 'ACTIVE',
    progress: 40,
    team: 'Mobile Team',
    dueDate: '2026-03-30',
    budget: 80000,
    spent: 32000,
    color: 'bg-purple-500'
  },
  {
    id: 3,
    name: 'Plateforme E-commerce GlobalShop',
    client: 'GlobalShop Ltd',
    status: 'COMPLETED',
    progress: 100,
    team: 'Full Stack',
    dueDate: '2025-12-20',
    budget: 120000,
    spent: 115000,
    color: 'bg-green-500'
  },
  {
    id: 4,
    name: 'Dashboard Analytics DataViz',
    client: 'DataViz Solutions',
    status: 'ACTIVE',
    progress: 85,
    team: 'Data Team',
    dueDate: '2026-01-25',
    budget: 55000,
    spent: 46750,
    color: 'bg-orange-500'
  },
  {
    id: 5,
    name: 'API Integration CloudSync',
    client: 'CloudSync Technologies',
    status: 'ACTIVE',
    progress: 30,
    team: 'Backend Team',
    dueDate: '2026-04-10',
    budget: 35000,
    spent: 10500,
    color: 'bg-cyan-500'
  },
  {
    id: 6,
    name: 'Migration Infrastructure Legacy Co',
    client: 'Legacy Corporation',
    status: 'ARCHIVED',
    progress: 100,
    team: 'DevOps',
    dueDate: '2025-11-30',
    budget: 95000,
    spent: 92000,
    color: 'bg-gray-500'
  },
];

const statusConfig = {
  ACTIVE: { label: 'Actif', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  ARCHIVED: { label: 'Archivé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

export default function ProjetsDemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = mockProjects.filter(p => p.status === 'COMPLETED').length;
  const archivedProjects = mockProjects.filter(p => p.status === 'ARCHIVED').length;

  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);

  // Filter projects
  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <p className="text-white/80 text-lg">
                Gérez vos projets avec intelligence et efficacité
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Briefcase className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalProjects}
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
              {activeProjects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projets Actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {completedProjects}
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
              {archivedProjects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Archivés</div>
          </Card>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <DollarSign className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Total</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tous les projets</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalBudget)}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <Target className="w-6 h-6 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dépenses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {((totalSpent / totalBudget) * 100).toFixed(0)}% du budget utilisé
                </p>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalSpent)}
            </div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un projet, client ou équipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="hover-nukleo"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="hover-nukleo"
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/dashboard/projets/${project.id}`}>
                <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${project.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {project.client.substring(0, 2).toUpperCase()}
                    </div>
                    <Badge className={`${statusConfig[project.status as keyof typeof statusConfig].color} border`}>
                      {statusConfig[project.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{project.client}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${project.color}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{project.team}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.dueDate).toLocaleDateString('fr-CA')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(project.spent)} / {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(project.budget)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/dashboard/projets/${project.id}`}>
                <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-lg ${project.color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                      {project.client.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{project.client}</p>
                        </div>
                        <Badge className={`${statusConfig[project.status as keyof typeof statusConfig].color} border`}>
                          {statusConfig[project.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{project.team}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(project.dueDate).toLocaleDateString('fr-CA')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Target className="w-4 h-4" />
                          <span>{project.progress}% complété</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(project.spent)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${project.color}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
