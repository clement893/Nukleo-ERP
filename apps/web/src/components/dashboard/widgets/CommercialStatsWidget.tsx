'use client';

/**
 * Widget : Statistiques Commerciales
 */

import { Target, TrendingUp, FileText, Briefcase, AlertCircle } from 'lucide-react';
import { useInfiniteOpportunities, useInfiniteQuotes, useInfiniteSubmissions } from '@/lib/query/commercial';
import type { WidgetProps } from '@/lib/dashboard/types';
import { useMemo } from 'react';
import { SkeletonWidget } from '@/components/ui/Skeleton';

export function CommercialStatsWidget({ config }: WidgetProps) {
  const { data: opportunitiesData, isLoading: loadingOpps } = useInfiniteOpportunities(1000);
  const { data: quotesData, isLoading: loadingQuotes } = useInfiniteQuotes(1000);
  const { data: submissionsData, isLoading: loadingSubs } = useInfiniteSubmissions(1000);

  const isLoading = loadingOpps || loadingQuotes || loadingSubs;

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const opportunities = useMemo(() => opportunitiesData?.pages.flat() || [], [opportunitiesData]);
  const quotes = useMemo(() => quotesData?.pages.flat() || [], [quotesData]);
  const submissions = useMemo(() => submissionsData?.pages.flat() || [], [submissionsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalOpportunities = opportunities.length;
    const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (opp.amount || 0), 0);
    const uniquePipelines = new Set(opportunities.map((opp: any) => opp.pipeline_id).filter(Boolean));
    const totalPipelines = uniquePipelines.size;
    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter((q: any) => q.status === 'sent' || q.status === 'pending').length;
    const totalSubmissions = submissions.length;
    const wonSubmissions = submissions.filter((s: any) => s.status === 'won' || s.status === 'accepted').length;

    // Calculate opportunities needing action
    const hasSubmission = (opportunity: any) => {
      if (!opportunity.company_id) return false;
      return submissions.some((s: any) => s.company_id === opportunity.company_id);
    };

    const needingAction = opportunities.filter((opp: any) => {
      const status = opp.status?.toLowerCase() || '';
      if (['won', 'lost', 'cancelled'].includes(status)) return false;
      const isSubmissionToDoStage = opp.stage_name?.includes('05 - Soumission à faire') || 
                                     opp.stage_name?.includes('05 - Proposal to do');
      return isSubmissionToDoStage && !hasSubmission(opp);
    }).length;

    return {
      opportunities: {
        total: totalOpportunities,
        value: totalValue,
        needingAction,
      },
      pipelines: {
        total: totalPipelines,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statsItems = [
    {
      label: 'Opportunités',
      value: stats.opportunities.total,
      subValue: formatCurrency(stats.opportunities.value),
      icon: Target,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'Nécessitent action',
      value: stats.opportunities.needingAction,
      subValue: 'Soumissions requises',
      icon: AlertCircle,
      color: 'text-danger-500',
      bgColor: 'bg-danger-500/10',
    },
    {
      label: 'Pipelines',
      value: stats.pipelines.total,
      subValue: 'Actifs',
      icon: TrendingUp,
      color: 'text-success-500',
      bgColor: 'bg-success-500/10',
    },
    {
      label: 'Devis',
      value: stats.quotes.total,
      subValue: `${stats.quotes.pending} en attente`,
      icon: FileText,
      color: 'text-warning-500',
      bgColor: 'bg-warning-500/10',
    },
    {
      label: 'Soumissions',
      value: stats.submissions.total,
      subValue: `${stats.submissions.won} gagnées`,
      icon: Briefcase,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-2 gap-3 flex-1">
        {statsItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stat.subValue}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
