'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  FileText,
  Users,
  Building2,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Link from 'next/link';

// Mock data
const mockStats = {
  opportunities: {
    total: 24,
    value: 1250000,
    change: 12.5,
    trend: 'up' as const,
  },
  pipelines: {
    total: 5,
    active: 3,
    change: 0,
    trend: 'stable' as const,
  },
  quotes: {
    total: 18,
    pending: 8,
    change: -5.2,
    trend: 'down' as const,
  },
  submissions: {
    total: 12,
    won: 4,
    change: 8.3,
    trend: 'up' as const,
  },
};

const mockRecentActivities = [
  {
    id: 1,
    type: 'opportunity',
    title: 'Nouvelle opportunité créée',
    description: 'Refonte site web e-commerce - TechCorp Inc.',
    time: 'Il y a 2 heures',
    icon: Target,
    color: 'purple',
  },
  {
    id: 2,
    type: 'quote',
    title: 'Devis accepté',
    description: 'DEV-2024-002 - InnoSoft Solutions - 60 000 $',
    time: 'Il y a 4 heures',
    icon: FileText,
    color: 'green',
  },
  {
    id: 3,
    type: 'call',
    title: 'Appel de suivi',
    description: 'Discussion avec Marie Dubois - TechCorp',
    time: 'Il y a 6 heures',
    icon: Phone,
    color: 'blue',
  },
  {
    id: 4,
    type: 'email',
    title: 'Proposition envoyée',
    description: 'Projet mobile - CloudNet Technologies',
    time: 'Hier',
    icon: Mail,
    color: 'orange',
  },
];

const mockUpcomingDeadlines = [
  {
    id: 1,
    title: 'Soumission Ville de Montréal',
    deadline: '2024-02-28',
    daysLeft: 15,
    priority: 'high',
  },
  {
    id: 2,
    title: 'Devis TechCorp - Validité',
    deadline: '2024-02-15',
    daysLeft: 2,
    priority: 'urgent',
  },
  {
    id: 3,
    title: 'Clôture opportunité InnoSoft',
    deadline: '2024-02-28',
    daysLeft: 15,
    priority: 'medium',
  },
  {
    id: 4,
    title: 'Soumission Gouvernement QC',
    deadline: '2024-03-15',
    daysLeft: 30,
    priority: 'medium',
  },
];

const mockTopOpportunities = [
  {
    id: 1,
    name: 'Migration infrastructure cloud',
    company: 'CloudNet Technologies',
    amount: 85000,
    probability: 75,
    stage: 'Négociation',
  },
  {
    id: 2,
    name: 'Application mobile iOS/Android',
    company: 'InnoSoft Solutions',
    amount: 60000,
    probability: 80,
    stage: 'Closing',
  },
  {
    id: 3,
    name: 'Refonte site web e-commerce',
    company: 'TechCorp Inc.',
    amount: 45000,
    probability: 70,
    stage: 'Proposition',
  },
];

export default function CommercialDemoPage() {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-[#523DC9]/10 border-[#523DC9]/30 text-[#523DC9]';
      case 'green':
        return 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]';
      case 'blue':
        return 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]';
      case 'orange':
        return 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Dashboard Commercial
                </h1>
                <p className="text-white/80 text-lg">
                  Vue d'ensemble de vos activités commerciales
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/commercial/opportunites">
                  <Button className="bg-white text-[#523DC9] hover:bg-white/90">
                    <Target className="w-4 h-4 mr-2" />
                    Opportunités
                  </Button>
                </Link>
                <Link href="/dashboard/commercial/pipeline-client">
                  <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Pipelines
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Target className="w-6 h-6 text-[#523DC9]" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                mockStats.opportunities.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {mockStats.opportunities.trend === 'up' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span>{Math.abs(mockStats.opportunities.change)}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockStats.opportunities.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Opportunités</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Valeur: {formatCurrency(mockStats.opportunities.value)}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                <span>—</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockStats.pipelines.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pipelines</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {mockStats.pipelines.active} actifs
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <FileText className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                mockStats.quotes.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowDown className="w-4 h-4" />
                <span>{Math.abs(mockStats.quotes.change)}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockStats.quotes.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Devis</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {mockStats.quotes.pending} en attente
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Building2 className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                mockStats.submissions.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowUp className="w-4 h-4" />
                <span>{Math.abs(mockStats.submissions.change)}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockStats.submissions.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Soumissions</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {mockStats.submissions.won} gagnées
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Opportunities */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Opportunités prioritaires
                </h2>
                <Link href="/dashboard/commercial/opportunites">
                  <Button size="sm" variant="outline">
                    Voir tout
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {mockTopOpportunities.map((opp) => (
                  <div key={opp.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{opp.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Building2 className="w-4 h-4" />
                          <span>{opp.company}</span>
                        </div>
                      </div>
                      <Badge className="bg-[#523DC9]/10 text-[#523DC9]">
                        {opp.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(opp.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {opp.probability}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activities */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Activités récentes
              </h2>
              <div className="space-y-4">
                {mockRecentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg border ${getActivityColor(activity.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#523DC9]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Échéances
                </h2>
              </div>
              <div className="space-y-3">
                {mockUpcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {deadline.title}
                      </h3>
                      <Badge className={getPriorityColor(deadline.priority)} size="sm">
                        {deadline.priority === 'urgent' && 'Urgent'}
                        {deadline.priority === 'high' && 'Haute'}
                        {deadline.priority === 'medium' && 'Moyenne'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(deadline.deadline)}</span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {deadline.daysLeft} jours restants
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Actions rapides
              </h2>
              <div className="space-y-2">
                <Link href="/dashboard/commercial/opportunites">
                  <Button className="w-full justify-start hover-nukleo" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Nouvelle opportunité
                  </Button>
                </Link>
                <Link href="/dashboard/commercial/soumissions">
                  <Button className="w-full justify-start hover-nukleo" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Nouveau devis
                  </Button>
                </Link>
                <Link href="/dashboard/reseau/contacts">
                  <Button className="w-full justify-start hover-nukleo" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Ajouter un contact
                  </Button>
                </Link>
                <Link href="/dashboard/reseau/entreprises">
                  <Button className="w-full justify-start hover-nukleo" variant="outline">
                    <Building2 className="w-4 h-4 mr-2" />
                    Ajouter une entreprise
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
