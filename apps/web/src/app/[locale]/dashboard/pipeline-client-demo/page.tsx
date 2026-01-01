'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Search, Users, TrendingUp, DollarSign, Target, User, Calendar, ArrowRight, Star } from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';

// Mock data
const mockClients = [
  {
    id: 'c7b4d752-0705-4618-8519-14a756d0fd0f',
    name: 'TechCorp Inc.',
    contact: 'Marie Dubois',
    email: 'marie@techcorp.com',
    phone: '+1 514 555-0123',
    stage: 'Prospect qualifié',
    score: 85,
    value: 125000,
    opportunities: 3,
    last_interaction: '2024-01-15',
    created_at: '2023-12-01',
    tags: ['Tech', 'B2B', 'Enterprise'],
  },
  {
    id: '2',
    name: 'Innovation Labs',
    contact: 'Jean Martin',
    email: 'jean@innolabs.com',
    phone: '+1 514 555-0124',
    stage: 'Client actif',
    score: 95,
    value: 250000,
    opportunities: 5,
    last_interaction: '2024-01-18',
    created_at: '2023-10-15',
    tags: ['Innovation', 'B2B', 'Partenaire'],
  },
  {
    id: '3',
    name: 'Groupe Innovant',
    contact: 'Sophie Tremblay',
    email: 'sophie@groupe-innovant.ca',
    phone: '+1 514 555-0125',
    stage: 'Négociation',
    score: 75,
    value: 180000,
    opportunities: 2,
    last_interaction: '2024-01-20',
    created_at: '2024-01-05',
    tags: ['Consulting', 'B2B'],
  },
  {
    id: '4',
    name: 'SecureNet SA',
    contact: 'Pierre Lefebvre',
    email: 'pierre@securenet.com',
    phone: '+1 514 555-0126',
    stage: 'Lead',
    score: 45,
    value: 50000,
    opportunities: 1,
    last_interaction: '2024-01-10',
    created_at: '2024-01-08',
    tags: ['Sécurité', 'B2B'],
  },
  {
    id: '5',
    name: 'DevSchool Pro',
    contact: 'Lucie Bernard',
    email: 'lucie@devschool.pro',
    phone: '+1 514 555-0127',
    stage: 'Prospect qualifié',
    score: 70,
    value: 95000,
    opportunities: 2,
    last_interaction: '2024-01-12',
    created_at: '2023-11-20',
    tags: ['Formation', 'B2B'],
  },
  {
    id: '6',
    name: 'CloudFirst Inc.',
    contact: 'Thomas Dubois',
    email: 'thomas@cloudfirst.io',
    phone: '+1 514 555-0128',
    stage: 'Client actif',
    score: 90,
    value: 320000,
    opportunities: 6,
    last_interaction: '2024-01-19',
    created_at: '2023-09-10',
    tags: ['Cloud', 'B2B', 'Enterprise'],
  },
];

type FilterStage = 'all' | 'Lead' | 'Prospect qualifié' | 'Négociation' | 'Client actif';

export default function PipelineClientDemoPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<FilterStage>('all');

  const filteredClients = useMemo(() => {
    return mockClients.filter(client => {
      // Filtre stage
      if (filterStage !== 'all' && client.stage !== filterStage) return false;
      
      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          client.name.toLowerCase().includes(query) ||
          client.contact.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [searchQuery, filterStage]);

  const stats = useMemo(() => {
    const totalValue = mockClients.reduce((sum, client) => sum + client.value, 0);
    const avgScore = mockClients.reduce((sum, client) => sum + client.score, 0) / mockClients.length;
    const totalOpportunities = mockClients.reduce((sum, client) => sum + client.opportunities, 0);
    const activeClients = mockClients.filter(c => c.stage === 'Client actif').length;
    
    return {
      total: mockClients.length,
      totalValue,
      avgScore: avgScore.toFixed(0),
      totalOpportunities,
      activeClients,
    };
  }, []);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'Prospect qualifié': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Négociation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Client actif': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
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
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Pipeline Clients
              </h1>
              <p className="text-white/80 text-lg">Gérez votre relation client</p>
            </div>
            <Button className="bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients totaux</div>
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
              {stats.avgScore}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Score moyen</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalOpportunities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant={filterStage === 'all' ? undefined : 'outline'} onClick={() => setFilterStage('all')}>Tous</Button>
              <Button variant={filterStage === 'Lead' ? undefined : 'outline'} onClick={() => setFilterStage('Lead')}>Leads</Button>
              <Button variant={filterStage === 'Prospect qualifié' ? undefined : 'outline'} onClick={() => setFilterStage('Prospect qualifié')}>Prospects</Button>
              <Button variant={filterStage === 'Négociation' ? undefined : 'outline'} onClick={() => setFilterStage('Négociation')}>Négociation</Button>
              <Button variant={filterStage === 'Client actif' ? undefined : 'outline'} onClick={() => setFilterStage('Client actif')}>Actifs</Button>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucun client trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterStage !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre premier client'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un client
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/dashboard/pipeline-client-demo/${client.id}`)}
                className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {client.name}
                    </h3>
                    <Badge className={getStageColor(client.stage)}>
                      {client.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className={`text-sm font-bold ${getScoreColor(client.score)}`}>
                      {client.score}
                    </span>
                  </div>
                </div>

                {/* Value & Opportunities */}
                <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(client.value)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Valeur</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {client.opportunities}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Opportunités</div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{client.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Dernière interaction: {new Date(client.last_interaction).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {client.tags.map((tag, index) => (
                    <span key={index} className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Voir le détail</span>
                  <ArrowRight className="w-4 h-4 text-[#523DC9] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
