'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { AlertCircle, Clock, Plus, Search, Briefcase, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

type Priority = 'high' | 'medium' | 'low';
type Status = 'upcoming' | 'today' | 'overdue' | 'completed';

const mockDeadlines = [
  {
    id: 1,
    title: 'Livraison Module Paiement',
    project: 'Refonte E-commerce',
    date: '2026-01-14',
    priority: 'high' as Priority,
    status: 'overdue' as Status,
    assignee: 'Pierre Durand',
    description: 'Finaliser l\'intégration Stripe et tests'
  },
  {
    id: 2,
    title: 'Rapport mensuel Q1',
    project: 'Gestion Interne',
    date: '2026-01-15',
    priority: 'high' as Priority,
    status: 'today' as Status,
    assignee: 'Marie Dubois',
    description: 'Compilation des KPIs et analyses'
  },
  {
    id: 3,
    title: 'Design UI Dashboard',
    project: 'App Mobile',
    date: '2026-01-18',
    priority: 'medium' as Priority,
    status: 'upcoming' as Status,
    assignee: 'Sophie Laurent',
    description: 'Maquettes Figma pour validation client'
  },
  {
    id: 4,
    title: 'Tests d\'intégration API',
    project: 'Backend Services',
    date: '2026-01-20',
    priority: 'high' as Priority,
    status: 'upcoming' as Status,
    assignee: 'Luc Bernard',
    description: 'Tests end-to-end de tous les endpoints'
  },
  {
    id: 5,
    title: 'Documentation technique',
    project: 'Refonte E-commerce',
    date: '2026-01-22',
    priority: 'low' as Priority,
    status: 'upcoming' as Status,
    assignee: 'Claire Petit',
    description: 'Mise à jour de la documentation API'
  },
  {
    id: 6,
    title: 'Déploiement Production',
    project: 'App Mobile',
    date: '2026-01-25',
    priority: 'high' as Priority,
    status: 'upcoming' as Status,
    assignee: 'Jean Martin',
    description: 'Release v2.0 sur App Store et Play Store'
  },
  {
    id: 7,
    title: 'Formation utilisateurs',
    project: 'Gestion Interne',
    date: '2026-01-12',
    priority: 'medium' as Priority,
    status: 'completed' as Status,
    assignee: 'Marie Dubois',
    description: 'Session de formation sur le nouveau système'
  }
];

const priorityConfig = {
  high: { label: 'Haute', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  medium: { label: 'Moyenne', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  low: { label: 'Basse', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' }
};

const statusConfig = {
  overdue: { label: 'En retard', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle },
  today: { label: 'Aujourd\'hui', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: AlertTriangle },
  upcoming: { label: 'À venir', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Clock },
  completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 }
};

export default function DeadlinesDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  const filteredDeadlines = mockDeadlines.filter(deadline => {
    const matchesSearch = !searchQuery || 
      deadline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deadline.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deadline.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockDeadlines.filter(d => d.status !== 'completed').length,
    overdue: mockDeadlines.filter(d => d.status === 'overdue').length,
    today: mockDeadlines.filter(d => d.status === 'today').length,
    upcoming: mockDeadlines.filter(d => d.status === 'upcoming').length
  };

  const getDaysUntil = (date: string) => {
    const today = new Date('2026-01-15');
    const deadline = new Date(date);
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} jour${Math.abs(diff) > 1 ? 's' : ''} de retard`;
    if (diff === 0) return 'Aujourd\'hui';
    return `Dans ${diff} jour${diff > 1 ? 's' : ''}`;
  };

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Échéances Projets
                  </h1>
                  <p className="text-white/80 text-sm">Suivez les deadlines de vos projets</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle échéance
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En cours</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.overdue}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En retard</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.today}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Aujourd'hui</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.upcoming}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">À venir</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une échéance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant={statusFilter === 'all' ? 'primary' : 'outline'} onClick={() => setStatusFilter('all')}>
                Tous
              </Button>
              <Button size="sm" variant={statusFilter === 'overdue' ? 'primary' : 'outline'} onClick={() => setStatusFilter('overdue')}>
                En retard
              </Button>
              <Button size="sm" variant={statusFilter === 'today' ? 'primary' : 'outline'} onClick={() => setStatusFilter('today')}>
                Aujourd'hui
              </Button>
              <Button size="sm" variant={statusFilter === 'upcoming' ? 'primary' : 'outline'} onClick={() => setStatusFilter('upcoming')}>
                À venir
              </Button>
            </div>
          </div>
        </Card>

        {/* Deadlines List */}
        <div className="space-y-3">
          {filteredDeadlines.map((deadline) => {
            const StatusIcon = statusConfig[deadline.status].icon;
            return (
              <Card key={deadline.id} className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig[deadline.status].color.replace('/10', '/20')}`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{deadline.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{deadline.description}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge className={`${statusConfig[deadline.status].color} border`}>
                          {statusConfig[deadline.status].label}
                        </Badge>
                        <Badge className={`${priorityConfig[deadline.priority].color} border`}>
                          {priorityConfig[deadline.priority].label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        <span>{deadline.project}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(deadline.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span className={deadline.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                          {getDaysUntil(deadline.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Assigné à: <strong>{deadline.assignee}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
