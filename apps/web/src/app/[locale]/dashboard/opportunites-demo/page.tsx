'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Search, TrendingUp, DollarSign, Target, Clock, Building2, User, Calendar, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';

// Mock data
const mockOpportunities = [
  {
    id: 1,
    title: 'Refonte site web e-commerce',
    company: 'TechCorp Inc.',
    contact: 'Marie Dubois',
    value: 45000,
    probability: 75,
    stage: 'Proposition',
    status: 'active',
    created_at: '2024-01-15',
    expected_close: '2024-03-01',
    pipeline: 'Ventes B2B',
  },
  {
    id: 2,
    title: 'Application mobile iOS/Android',
    company: 'Innovation Labs',
    contact: 'Jean Martin',
    value: 85000,
    probability: 60,
    stage: 'Négociation',
    status: 'active',
    created_at: '2024-01-10',
    expected_close: '2024-02-28',
    pipeline: 'Ventes B2B',
  },
  {
    id: 3,
    title: 'Système CRM personnalisé',
    company: 'Groupe Innovant',
    contact: 'Sophie Tremblay',
    value: 120000,
    probability: 90,
    stage: 'Closing',
    status: 'active',
    created_at: '2024-01-05',
    expected_close: '2024-02-15',
    pipeline: 'Ventes B2B',
  },
  {
    id: 4,
    title: 'Audit sécurité informatique',
    company: 'SecureNet SA',
    contact: 'Pierre Lefebvre',
    value: 25000,
    probability: 40,
    stage: 'Qualification',
    status: 'active',
    created_at: '2024-01-20',
    expected_close: '2024-03-15',
    pipeline: 'Ventes B2B',
  },
  {
    id: 5,
    title: 'Formation équipe développement',
    company: 'DevSchool Pro',
    contact: 'Lucie Bernard',
    value: 15000,
    probability: 85,
    stage: 'Proposition',
    status: 'active',
    created_at: '2024-01-12',
    expected_close: '2024-02-20',
    pipeline: 'Ventes B2B',
  },
  {
    id: 6,
    title: 'Migration cloud AWS',
    company: 'CloudFirst Inc.',
    contact: 'Thomas Dubois',
    value: 95000,
    probability: 50,
    stage: 'Découverte',
    status: 'active',
    created_at: '2024-01-18',
    expected_close: '2024-04-01',
    pipeline: 'Ventes B2B',
  },
];

type FilterStage = 'all' | 'Découverte' | 'Qualification' | 'Proposition' | 'Négociation' | 'Closing';

export default function OpportunitiesDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<FilterStage>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter(opp => {
      // Filtre stage
      if (filterStage !== 'all' && opp.stage !== filterStage) return false;
      
      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          opp.title.toLowerCase().includes(query) ||
          opp.company.toLowerCase().includes(query) ||
          opp.contact.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [searchQuery, filterStage]);

  const stats = useMemo(() => {
    const totalValue = mockOpportunities.reduce((sum, opp) => sum + opp.value, 0);
    const weightedValue = mockOpportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
    const avgProbability = mockOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / mockOpportunities.length;
    
    return {
      total: mockOpportunities.length,
      totalValue,
      weightedValue,
      avgProbability: avgProbability.toFixed(0),
    };
  }, []);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Découverte': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400';
      case 'Qualification': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Proposition': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Négociation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Closing': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600 dark:text-green-400';
    if (probability >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
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
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Opportunités
              </h1>
              <p className="text-white/80 text-lg">Gérez votre pipeline de ventes</p>
            </div>
            <Button className="bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle opportunité
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Target className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités actives</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.totalValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.weightedValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur pondérée</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgProbability}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Probabilité moyenne</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher une opportunité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant={filterStage === 'all' ? undefined : 'outline'} onClick={() => setFilterStage('all')}>Toutes</Button>
              <Button variant={filterStage === 'Découverte' ? undefined : 'outline'} onClick={() => setFilterStage('Découverte')}>Découverte</Button>
              <Button variant={filterStage === 'Qualification' ? undefined : 'outline'} onClick={() => setFilterStage('Qualification')}>Qualification</Button>
              <Button variant={filterStage === 'Proposition' ? undefined : 'outline'} onClick={() => setFilterStage('Proposition')}>Proposition</Button>
              <Button variant={filterStage === 'Négociation' ? undefined : 'outline'} onClick={() => setFilterStage('Négociation')}>Négociation</Button>
              <Button variant={filterStage === 'Closing' ? undefined : 'outline'} onClick={() => setFilterStage('Closing')}>Closing</Button>
            </div>

            <div className="flex gap-2">
              <Button variant={viewMode === 'grid' ? undefined : 'outline'} onClick={() => setViewMode('grid')}>Grille</Button>
              <Button variant={viewMode === 'list' ? undefined : 'outline'} onClick={() => setViewMode('list')}>Liste</Button>
            </div>
          </div>
        </div>

        {/* Opportunities Grid/List */}
        {filteredOpportunities.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucune opportunité trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterStage !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre première opportunité'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer une opportunité
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {opp.title}
                    </h3>
                    <Badge className={getStageColor(opp.stage)}>
                      {opp.stage}
                    </Badge>
                  </div>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Value */}
                <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatCurrency(opp.value)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Valeur</div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4" />
                    <span>{opp.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{opp.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Clôture prévue: {new Date(opp.expected_close).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="glass-card p-4 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Title & Stage */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {opp.title}
                    </h3>
                    <Badge className={getStageColor(opp.stage)}>
                      {opp.stage}
                    </Badge>
                  </div>

                  {/* Company & Contact */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{opp.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{opp.contact}</span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(opp.value)}
                    </div>
                  </div>

                  {/* Probability */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getProbabilityColor(opp.probability)}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {opp.probability}%
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(opp.expected_close).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
