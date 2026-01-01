'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Star,
  Archive,
  Copy,
  Share2,
  ExternalLink,
  X,
  ChevronDown,
  BarChart3,
} from 'lucide-react';

type ViewMode = 'cards' | 'kanban' | 'table';
type ProjectStatus = 'active' | 'completed' | 'archived' | 'at_risk' | 'delayed';

interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  budgetTotal: number;
  team: number;
  deadline: string;
  tags: string[];
  isFavorite: boolean;
}

export default function ProjectsListDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Mock data - 12 projets
  const projects: Project[] = [
    {
      id: '1',
      name: 'Site Web E-commerce',
      client: 'TechCorp Inc.',
      status: 'active',
      progress: 65,
      budget: 45000,
      budgetTotal: 60000,
      team: 5,
      deadline: '2025-02-28',
      tags: ['Web', 'E-commerce', 'React'],
      isFavorite: true,
    },
    {
      id: '2',
      name: 'App Mobile Banking',
      client: 'FinanceHub',
      status: 'active',
      progress: 40,
      budget: 80000,
      budgetTotal: 120000,
      team: 8,
      deadline: '2025-03-15',
      tags: ['Mobile', 'Finance', 'React Native'],
      isFavorite: false,
    },
    {
      id: '3',
      name: 'Refonte Intranet',
      client: 'GlobalCorp',
      status: 'completed',
      progress: 100,
      budget: 35000,
      budgetTotal: 35000,
      team: 4,
      deadline: '2024-12-15',
      tags: ['Web', 'Intranet', 'Vue.js'],
      isFavorite: false,
    },
    {
      id: '4',
      name: 'Dashboard Analytics',
      client: 'DataViz Ltd',
      status: 'active',
      progress: 80,
      budget: 25000,
      budgetTotal: 30000,
      team: 3,
      deadline: '2025-01-31',
      tags: ['Web', 'Analytics', 'D3.js'],
      isFavorite: true,
    },
    {
      id: '5',
      name: 'API REST Microservices',
      client: 'CloudTech',
      status: 'delayed',
      progress: 55,
      budget: 50000,
      budgetTotal: 45000,
      team: 6,
      deadline: '2024-12-20',
      tags: ['Backend', 'API', 'Node.js'],
      isFavorite: false,
    },
    {
      id: '6',
      name: 'Site Vitrine Corporate',
      client: 'BrandCo',
      status: 'completed',
      progress: 100,
      budget: 15000,
      budgetTotal: 15000,
      team: 2,
      deadline: '2024-11-30',
      tags: ['Web', 'Vitrine', 'Next.js'],
      isFavorite: false,
    },
    {
      id: '7',
      name: 'CRM Custom',
      client: 'SalesPro',
      status: 'active',
      progress: 30,
      budget: 90000,
      budgetTotal: 150000,
      team: 10,
      deadline: '2025-04-30',
      tags: ['Web', 'CRM', 'React'],
      isFavorite: true,
    },
    {
      id: '8',
      name: 'Migration Cloud AWS',
      client: 'LegacyTech',
      status: 'at_risk',
      progress: 20,
      budget: 60000,
      budgetTotal: 80000,
      team: 5,
      deadline: '2025-02-15',
      tags: ['Cloud', 'AWS', 'DevOps'],
      isFavorite: false,
    },
    {
      id: '9',
      name: 'Marketplace B2B',
      client: 'TradeCo',
      status: 'active',
      progress: 50,
      budget: 100000,
      budgetTotal: 180000,
      team: 12,
      deadline: '2025-05-31',
      tags: ['Web', 'Marketplace', 'Next.js'],
      isFavorite: false,
    },
    {
      id: '10',
      name: 'App IoT Dashboard',
      client: 'SmartHome Inc',
      status: 'completed',
      progress: 100,
      budget: 40000,
      budgetTotal: 40000,
      team: 4,
      deadline: '2024-12-10',
      tags: ['IoT', 'Dashboard', 'React'],
      isFavorite: false,
    },
    {
      id: '11',
      name: 'Plateforme E-learning',
      client: 'EduTech',
      status: 'archived',
      progress: 0,
      budget: 0,
      budgetTotal: 120000,
      team: 0,
      deadline: '-',
      tags: ['Web', 'E-learning', 'Vue.js'],
      isFavorite: false,
    },
    {
      id: '12',
      name: 'Chatbot IA Support',
      client: 'SupportAI',
      status: 'active',
      progress: 70,
      budget: 35000,
      budgetTotal: 50000,
      team: 4,
      deadline: '2025-02-20',
      tags: ['IA', 'Chatbot', 'Python'],
      isFavorite: true,
    },
  ];

  // Filtrer les projets
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculer les KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const delayedProjects = projects.filter(p => p.status === 'delayed').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budgetTotal, 0);
  const upcomingDeadlines = projects.filter(p => {
    const deadline = new Date(p.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = diff / (1000 * 3600 * 24);
    return days > 0 && days <= 30 && p.status === 'active';
  }).length;

  // Status config
  const statusConfig = {
    active: { label: 'Actif', color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-600 dark:text-blue-400' },
    completed: { label: 'Terminé', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-600 dark:text-green-400' },
    archived: { label: 'Archivé', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-600 dark:text-gray-400' },
    at_risk: { label: 'À risque', color: 'orange', bgColor: 'bg-orange-500/10', textColor: 'text-orange-600 dark:text-orange-400' },
    delayed: { label: 'En retard', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-600 dark:text-red-400' },
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

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
            className="glass-button px-6 py-3 rounded-lg flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nouveau projet</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {/* Total */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-badge p-2 rounded-lg bg-gray-500/10">
              <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</p>
        </div>

        {/* Actifs */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-badge p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Actifs</p>
        </div>

        {/* Terminés */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-badge p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{completedProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Terminés</p>
        </div>

        {/* En retard */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-badge p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">{delayedProjects}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">En retard</p>
        </div>

        {/* Budget total */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-badge p-2 rounded-lg bg-purple-500/10">
              <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Budget total</p>
        </div>

        {/* Échéances proches */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-badge p-2 rounded-lg bg-orange-500/10">
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{upcomingDeadlines}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sous 30 jours</p>
        </div>
      </div>

      {/* Filters & Views */}
      <div className="glass-card p-4 rounded-xl mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet, client, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="completed">Terminés</option>
              <option value="delayed">En retard</option>
              <option value="at_risk">À risque</option>
              <option value="archived">Archivés</option>
            </select>

            {/* Analytics Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-500/10 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="glass-card p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progression moyenne */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Progression moyenne</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${projects.filter(p => p.status !== 'archived').reduce((sum, p) => sum + p.progress, 0) / projects.filter(p => p.status !== 'archived').length}%` }}
                  />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {Math.round(projects.filter(p => p.status !== 'archived').reduce((sum, p) => sum + p.progress, 0) / projects.filter(p => p.status !== 'archived').length)}%
                </span>
              </div>
            </div>

            {/* Budget utilisé */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Budget utilisé</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(projects.reduce((sum, p) => sum + p.budget, 0) / totalBudget) * 100}%` }}
                  />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {Math.round((projects.reduce((sum, p) => sum + p.budget, 0) / totalBudget) * 100)}%
                </span>
              </div>
            </div>

            {/* Taux de réussite */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taux de réussite</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(completedProjects / (totalProjects - projects.filter(p => p.status === 'archived').length)) * 100}%` }}
                  />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {Math.round((completedProjects / (totalProjects - projects.filter(p => p.status === 'archived').length)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid/Kanban/Table */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all duration-200 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{project.client}</p>
                </div>
                <button className={`p-1.5 rounded-lg transition-all ${project.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}>
                  <Star className={`w-5 h-5 ${project.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[project.status].bgColor} ${statusConfig[project.status].textColor}`}>
                  {project.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                  {project.status === 'delayed' && <AlertCircle className="w-3 h-3" />}
                  {project.status === 'at_risk' && <AlertCircle className="w-3 h-3" />}
                  {statusConfig[project.status].label}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progression</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      project.status === 'delayed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      project.status === 'at_risk' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="glass-badge p-2 rounded-lg bg-purple-500/10 mx-auto w-fit mb-1">
                    <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Budget</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(project.budget)}</p>
                </div>
                <div className="text-center">
                  <div className="glass-badge p-2 rounded-lg bg-blue-500/10 mx-auto w-fit mb-1">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Équipe</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{project.team}</p>
                </div>
                <div className="text-center">
                  <div className="glass-badge p-2 rounded-lg bg-orange-500/10 mx-auto w-fit mb-1">
                    <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Échéance</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{formatDate(project.deadline)}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="glass-badge px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="flex-1 glass-button px-3 py-2 rounded-lg text-sm font-medium text-center hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  Voir détails
                </Link>
                <button className="glass-button p-2 rounded-lg hover:bg-gray-500/10 transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="glass-button p-2 rounded-lg hover:bg-gray-500/10 transition-all">
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {(['active', 'at_risk', 'delayed', 'completed', 'archived'] as ProjectStatus[]).map((status) => {
            const statusProjects = filteredProjects.filter(p => p.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-80">
                <div className="glass-card p-4 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold ${statusConfig[status].textColor}`}>
                      {statusConfig[status].label}
                    </h3>
                    <span className="glass-badge px-2 py-1 rounded text-sm font-bold">
                      {statusProjects.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {statusProjects.map((project) => (
                    <div key={project.id} className="glass-card p-4 rounded-xl hover:scale-[1.02] hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{project.name}</h4>
                        <Star className={`w-4 h-4 ${project.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{project.client}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <Users className="w-3 h-3" />
                        <span>{project.team}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{formatDate(project.deadline)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Projet</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Progression</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Équipe</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Échéance</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${project.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        <span className="font-bold text-gray-900 dark:text-white">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{project.client}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[project.status].bgColor} ${statusConfig[project.status].textColor}`}>
                        {statusConfig[project.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(project.budget)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{project.team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{formatDate(project.deadline)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/projects/${project.id}`} className="p-1.5 rounded-lg hover:bg-gray-500/10 transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 rounded-lg hover:bg-gray-500/10 transition-all">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="glass-card p-12 rounded-xl text-center">
          <div className="glass-badge p-4 rounded-full bg-gray-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
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
            className="inline-flex items-center gap-2 glass-button px-6 py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nouveau projet</span>
          </Link>
        </div>
      )}
    </div>
  );
}
