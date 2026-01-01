'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Target, Plus, Search, DollarSign, Calendar, User, Building2, TrendingUp } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

type Stage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

interface Opportunity {
  id: number;
  title: string;
  company: string;
  contact: string;
  value: number;
  probability: number;
  stage: Stage;
  closeDate: string;
  description: string;
}

const mockOpportunities: Opportunity[] = [
  {
    id: 1,
    title: 'Refonte Site Web',
    company: 'ABC Corp',
    contact: 'Marie Dubois',
    value: 45000,
    probability: 20,
    stage: 'lead',
    closeDate: '2026-03-15',
    description: 'Refonte complète du site corporate'
  },
  {
    id: 2,
    title: 'App Mobile E-commerce',
    company: 'XYZ Ltd',
    contact: 'Jean Martin',
    value: 85000,
    probability: 40,
    stage: 'qualified',
    closeDate: '2026-02-28',
    description: 'Développement app iOS et Android'
  },
  {
    id: 3,
    title: 'Système CRM Custom',
    company: 'Tech Solutions',
    contact: 'Sophie Laurent',
    value: 120000,
    probability: 60,
    stage: 'proposal',
    closeDate: '2026-02-20',
    description: 'CRM sur mesure avec intégrations'
  },
  {
    id: 4,
    title: 'Migration Cloud',
    company: 'Global Inc',
    contact: 'Pierre Durand',
    value: 65000,
    probability: 75,
    stage: 'negotiation',
    closeDate: '2026-02-10',
    description: 'Migration infrastructure vers AWS'
  },
  {
    id: 5,
    title: 'Plateforme SaaS',
    company: 'Startup Co',
    contact: 'Claire Petit',
    value: 95000,
    probability: 90,
    stage: 'negotiation',
    closeDate: '2026-02-05',
    description: 'Développement plateforme SaaS B2B'
  },
  {
    id: 6,
    title: 'Audit Sécurité',
    company: 'Finance Pro',
    contact: 'Luc Bernard',
    value: 35000,
    probability: 100,
    stage: 'closed_won',
    closeDate: '2026-01-20',
    description: 'Audit complet de sécurité IT'
  },
  {
    id: 7,
    title: 'Dashboard Analytics',
    company: 'Data Corp',
    contact: 'Emma Rousseau',
    value: 55000,
    probability: 30,
    stage: 'qualified',
    closeDate: '2026-03-01',
    description: 'Dashboard BI temps réel'
  },
  {
    id: 8,
    title: 'API Gateway',
    company: 'API Services',
    contact: 'Thomas Blanc',
    value: 75000,
    probability: 50,
    stage: 'proposal',
    closeDate: '2026-02-25',
    description: 'Gateway API avec authentification'
  }
];

const stageConfig = {
  lead: { label: 'Lead', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', bgColor: 'bg-gray-50 dark:bg-gray-800/30' },
  qualified: { label: 'Qualifié', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  proposal: { label: 'Proposition', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  negotiation: { label: 'Négociation', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  closed_won: { label: 'Gagné', color: 'bg-green-500/10 text-green-600 border-green-500/30', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  closed_lost: { label: 'Perdu', color: 'bg-red-500/10 text-red-600 border-red-500/30', bgColor: 'bg-red-50 dark:bg-red-900/20' }
};

const stages: Stage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export default function PipelineDemo() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOpportunities = mockOpportunities.filter(opp => 
    !searchQuery || 
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOpportunitiesByStage = (stage: Stage) => {
    return filteredOpportunities.filter(opp => opp.stage === stage);
  };

  const getTotalValueByStage = (stage: Stage) => {
    return getOpportunitiesByStage(stage).reduce((sum, opp) => sum + opp.value, 0);
  };

  const getWeightedValueByStage = (stage: Stage) => {
    return getOpportunitiesByStage(stage).reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
  };

  const totalPipelineValue = mockOpportunities.reduce((sum, opp) => sum + opp.value, 0);
  const weightedPipelineValue = mockOpportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);

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
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Pipeline de Vente
                  </h1>
                  <p className="text-white/80 text-sm">Vue Kanban de vos opportunités commerciales</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle opportunité
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {mockOpportunities.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Opportunités</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(totalPipelineValue)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Valeur totale</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(weightedPipelineValue)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Valeur pondérée</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {Math.round(mockOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / mockOpportunities.length)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Probabilité moy.</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher une opportunité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const opportunities = getOpportunitiesByStage(stage);
            const totalValue = getTotalValueByStage(stage);
            const weightedValue = getWeightedValueByStage(stage);
            
            return (
              <div key={stage} className="flex-shrink-0 w-80">
                <Card className={`glass-card rounded-xl border border-[#A7A2CF]/20 ${stageConfig[stage].bgColor} overflow-hidden`}>
                  {/* Stage Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${stageConfig[stage].color} border`}>
                        {stageConfig[stage].label}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {opportunities.length}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <div>Total: <strong>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(totalValue)}</strong></div>
                      <div>Pondéré: <strong>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(weightedValue)}</strong></div>
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                    {opportunities.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-500">
                        Aucune opportunité
                      </div>
                    ) : (
                      opportunities.map((opp) => (
                        <Card 
                          key={opp.id}
                          className="glass-card p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/40 transition-all cursor-pointer bg-white dark:bg-gray-800"
                        >
                          <h3 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">
                            {opp.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {opp.description}
                          </p>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate">{opp.company}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              <span className="truncate">{opp.contact}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(opp.closeDate).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(opp.value)}
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border text-xs px-2 py-0.5">
                              {opp.probability}%
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
