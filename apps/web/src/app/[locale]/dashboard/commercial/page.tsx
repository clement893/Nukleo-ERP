'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingUp, 
  Target, 
  FileText,
  Building2,
  UserPlus,
  Briefcase
} from 'lucide-react';
import { Badge, Button, Card, Loading } from '@/components/ui';
import Link from 'next/link';
import { useInfiniteOpportunities } from '@/lib/query/opportunities';
import { useInfiniteQuotes, useInfiniteSubmissions } from '@/lib/query/commercial';

export default function CommercialPage() {
  // Fetch real data
  const { data: opportunitiesData, isLoading: loadingOpps } = useInfiniteOpportunities(100);
  const { data: quotesData, isLoading: loadingQuotes } = useInfiniteQuotes(100);
  const { data: submissionsData, isLoading: loadingSubmissions } = useInfiniteSubmissions(100);

  // Flatten data
  const opportunities = useMemo(() => opportunitiesData?.pages.flat() || [], [opportunitiesData]);
  const quotes = useMemo(() => quotesData?.pages.flat() || [], [quotesData]);
  const submissions = useMemo(() => submissionsData?.pages.flat() || [], [submissionsData]);

  const loading = loadingOpps || loadingQuotes || loadingSubmissions;

  // Calculate stats
  const stats = useMemo(() => {
    const totalOpportunities = opportunities.length;
    const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (opp.amount || 0), 0);
    // Pipelines are managed through opportunities, so we count unique pipeline_ids
    const uniquePipelines = new Set(opportunities.map((opp: any) => opp.pipeline_id).filter(Boolean));
    const totalPipelines = uniquePipelines.size;
    const activePipelines = totalPipelines; // Assume all are active for now
    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter((q: any) => q.status === 'sent' || q.status === 'pending').length;
    const totalSubmissions = submissions.length;
    const wonSubmissions = submissions.filter((s: any) => s.status === 'won' || s.status === 'accepted').length;

    return {
      opportunities: {
        total: totalOpportunities,
        value: totalValue,
      },
      pipelines: {
        total: totalPipelines,
        active: activePipelines,
      },
      quotes: {
        total: totalQuotes,
        pending: pendingQuotes,
      },
      submissions: {
        total: totalSubmissions,
        won: wonSubmissions,
      },
    };
  }, [opportunities, quotes, submissions]);

  // Top opportunities (by amount)
  const topOpportunities = useMemo(() => {
    return [...opportunities]
      .sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 3);
  }, [opportunities]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
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
                  <Button className="bg-white text-primary-500 hover:bg-white/90">
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
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Target className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.opportunities.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Opportunités</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Valeur: {formatCurrency(stats.opportunities.value)}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pipelines.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pipelines</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.pipelines.active} actifs
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <FileText className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.quotes.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Devis</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.quotes.pending} en attente
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Briefcase className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.submissions.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Soumissions</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.submissions.won} gagnées
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Top Opportunities */}
          <div className="lg:col-span-2">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Opportunités prioritaires</h3>
                <Badge className="bg-primary-500/10 text-primary-500">{topOpportunities.length}</Badge>
              </div>
              <div className="space-y-3">
                {topOpportunities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucune opportunité pour le moment
                  </div>
                ) : (
                  topOpportunities.map((opp) => (
                    <Link key={opp.id} href={`/dashboard/commercial/opportunites/${opp.id}`}>
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{opp.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{opp.company_name || 'Entreprise non définie'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#10B981]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {formatCurrency(opp.amount || 0)}
                            </div>
                            {opp.probability && (
                              <div className="text-xs text-gray-500">{opp.probability}% prob.</div>
                            )}
                          </div>
                        </div>
                        {opp.stage_name && (
                          <Badge className="bg-primary-500/10 text-primary-500">{opp.stage_name}</Badge>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
              <div className="space-y-3">
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
                    <UserPlus className="w-4 h-4 mr-2" />
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
