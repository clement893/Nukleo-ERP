'use client';

import { Briefcase, Users, Calendar, DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

export default function MesProjetsPage() {
  const projects = [
    {
      id: 1,
      name: 'Projet Alpha - Refonte ERP',
      client: 'TechCorp Inc.',
      status: 'active',
      progress: 65,
      budget: 150000,
      spent: 97500,
      startDate: '2025-11-01',
      endDate: '2026-02-28',
      team: ['Ricardo W.', 'Marie D.', 'Jean M.', 'Sophie T.'],
      myRole: 'Lead Developer',
      myHours: 156,
      totalHours: 450,
      tasks: { total: 24, completed: 16, inProgress: 5, todo: 3 },
      priority: 'high',
      description: 'Refonte complète du système ERP avec nouvelles fonctionnalités'
    },
    {
      id: 2,
      name: 'Projet Beta - Application Mobile',
      client: 'StartupXYZ',
      status: 'active',
      progress: 40,
      budget: 80000,
      spent: 32000,
      startDate: '2025-12-15',
      endDate: '2026-03-15',
      team: ['Ricardo W.', 'Omar K.', 'Hind B.'],
      myRole: 'Senior Developer',
      myHours: 89,
      totalHours: 280,
      tasks: { total: 18, completed: 7, inProgress: 6, todo: 5 },
      priority: 'medium',
      description: 'Développement application mobile iOS/Android avec React Native'
    },
    {
      id: 3,
      name: 'Projet Gamma - Site E-commerce',
      client: 'Fashion Store',
      status: 'active',
      progress: 85,
      budget: 60000,
      spent: 51000,
      startDate: '2025-10-01',
      endDate: '2026-01-15',
      team: ['Ricardo W.', 'Sarah L.', 'Alexei P.'],
      myRole: 'Full Stack Developer',
      myHours: 124,
      totalHours: 380,
      tasks: { total: 20, completed: 17, inProgress: 2, todo: 1 },
      priority: 'high',
      description: 'Plateforme e-commerce complète avec paiement intégré'
    },
    {
      id: 4,
      name: 'Projet Delta - Dashboard Analytics',
      client: 'DataViz Corp',
      status: 'planning',
      progress: 10,
      budget: 45000,
      spent: 4500,
      startDate: '2026-01-20',
      endDate: '2026-04-30',
      team: ['Ricardo W.', 'Timothé R.'],
      myRole: 'Tech Lead',
      myHours: 12,
      totalHours: 200,
      tasks: { total: 15, completed: 1, inProgress: 2, todo: 12 },
      priority: 'low',
      description: 'Dashboard analytics avec visualisations temps réel'
    },
    {
      id: 5,
      name: 'Projet Epsilon - API Gateway',
      client: 'MicroServices Ltd',
      status: 'completed',
      progress: 100,
      budget: 95000,
      spent: 92000,
      startDate: '2025-08-01',
      endDate: '2025-12-20',
      team: ['Ricardo W.', 'Jean-François L.', 'Marie-Claire B.'],
      myRole: 'Backend Lead',
      myHours: 198,
      totalHours: 520,
      tasks: { total: 28, completed: 28, inProgress: 0, todo: 0 },
      priority: 'high',
      description: 'Gateway API avec authentification et rate limiting'
    },
  ];

  const stats = {
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalHours: projects.reduce((sum, p) => sum + p.myHours, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Actif</Badge>;
      case 'planning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Planification</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Terminé</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30">Inconnu</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Basse</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Projets
          </h1>
          <p className="text-white/80 text-lg">Suivez vos projets et votre contribution</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Projets actifs</span>
          </div>
          <div className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.active}</div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">En planification</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.planning}</div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Terminés</span>
          </div>
          <div className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.completed}</div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Mes heures</span>
          </div>
          <div className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.totalHours}h</div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {project.name}
                  </h3>
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{project.description}</p>
                <p className="text-sm text-gray-500">Client: {project.client}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progression</span>
                <span className="font-bold text-[#523DC9]">{project.progress}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#523DC9] to-[#5F2B75] transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm font-semibold">{formatCurrency(project.budget)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-500">Dépensé</p>
                  <p className="text-sm font-semibold">{formatCurrency(project.spent)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Mes heures</p>
                  <p className="text-sm font-semibold">{project.myHours}h / {project.totalHours}h</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Équipe</p>
                  <p className="text-sm font-semibold">{project.team.length} membres</p>
                </div>
              </div>
            </div>

            {/* Tasks Summary */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">{project.tasks.completed} terminées</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm">{project.tasks.inProgress} en cours</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <span className="text-sm">{project.tasks.todo} à faire</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500">Mon rôle</p>
                <p className="text-sm font-semibold text-[#523DC9]">{project.myRole}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Période</p>
                <p className="text-sm font-semibold">
                  {new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
