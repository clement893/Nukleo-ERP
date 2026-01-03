'use client';

/**
 * Widget : Opportunités nécessitant une action
 */

import { AlertCircle, ExternalLink, Clock, FileText, Target } from 'lucide-react';
import { useInfiniteOpportunities } from '@/lib/query/opportunities';
import { useInfiniteSubmissions } from '@/lib/query/commercial';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Badge, Button } from '@/components/ui';
import { useMemo } from 'react';

export function OpportunitiesNeedingActionWidget({ config, globalFilters }: WidgetProps) {
  const { data: opportunitiesData, isLoading: loadingOpps } = useInfiniteOpportunities(1000);
  const { data: submissionsData, isLoading: loadingSubs } = useInfiniteSubmissions(1000);

  const isLoading = loadingOpps || loadingSubs;

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const opportunities = useMemo(() => opportunitiesData?.pages.flat() || [], [opportunitiesData]);
  const submissions = useMemo(() => submissionsData?.pages.flat() || [], [submissionsData]);

  // Helper function to check if opportunity has submission
  const hasSubmission = (opportunity: any) => {
    if (!opportunity.company_id) return false;
    return submissions.some((s: any) => s.company_id === opportunity.company_id);
  };

  // Helper function to get days until deadline
  const getDaysUntilDeadline = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper function to get action needed type
  const getActionNeeded = (opp: any): { type: 'submission' | 'followup' | 'deadline'; priority: 'high' | 'medium' | 'low'; label: string } => {
    const daysUntilDeadline = getDaysUntilDeadline(opp.expected_close_date);
    const hasDeadline = daysUntilDeadline !== null;
    const isDeadlineNear = hasDeadline && daysUntilDeadline <= 30 && daysUntilDeadline >= 0;
    const isDeadlineUrgent = hasDeadline && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
    const isSubmissionToDoStage = opp.stage_name?.includes('05 - Soumission à faire') || 
                                   opp.stage_name?.includes('05 - Proposal to do');
    const hasHighProbability = opp.probability && opp.probability > 50;

    if (isDeadlineUrgent && !hasSubmission(opp)) {
      return { type: 'deadline', priority: 'high', label: 'Deadline urgente - Soumission nécessaire' };
    }
    if (isDeadlineNear && !hasSubmission(opp)) {
      return { type: 'deadline', priority: 'medium', label: 'Deadline approchante - Soumission nécessaire' };
    }
    if (isSubmissionToDoStage && !hasSubmission(opp)) {
      return { type: 'submission', priority: 'high', label: 'Soumission nécessaire' };
    }
    if (hasHighProbability && !hasSubmission(opp)) {
      return { type: 'submission', priority: 'medium', label: 'Soumission recommandée' };
    }
    return { type: 'followup', priority: 'low', label: 'Suivi recommandé' };
  };

  // Opportunities needing action - Only show opportunities in "05 - Soumission à faire" stage
  const opportunitiesNeedingAction = useMemo(() => {
    return opportunities
      .filter((opp: any) => {
        // Exclude closed opportunities
        const status = opp.status?.toLowerCase() || '';
        if (['won', 'lost', 'cancelled'].includes(status)) return false;

        // Only include opportunities in "05 - Soumission à faire" stage
        const isSubmissionToDoStage = opp.stage_name?.includes('05 - Soumission à faire') || 
                                      opp.stage_name?.includes('05 - Proposal to do');
        
        // Must be in the correct stage and not have a submission yet
        return isSubmissionToDoStage && !hasSubmission(opp);
      })
      .map((opp: any) => ({
        ...opp,
        actionNeeded: getActionNeeded(opp),
        daysUntilDeadline: getDaysUntilDeadline(opp.expected_close_date),
      }))
      .sort((a: any, b: any) => {
        // Sort by priority (high > medium > low)
        const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.actionNeeded.priority as 'high' | 'medium' | 'low'];
        const bPriority = priorityOrder[b.actionNeeded.priority as 'high' | 'medium' | 'low'];
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        // Then by deadline (sooner first)
        if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
          return a.daysUntilDeadline - b.daysUntilDeadline;
        }
        if (a.daysUntilDeadline !== null) return -1;
        if (b.daysUntilDeadline !== null) return 1;
        // Then by probability (higher first)
        if (a.probability !== b.probability) {
          return (b.probability || 0) - (a.probability || 0);
        }
        // Finally by amount (higher first)
        return (b.amount || 0) - (a.amount || 0);
      })
      .slice(0, config?.filters?.limit || 5);
  }, [opportunities, submissions, config]);

  if (opportunitiesNeedingAction.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Aucune action requise"
        description="Toutes vos opportunités sont à jour"
        variant="compact"
      />
    );
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const priorityColors = {
    high: 'bg-danger-500/10 text-danger-500 border-danger-500/30',
    medium: 'bg-warning-500/10 text-warning-500 border-warning-500/30',
    low: 'bg-primary-500/10 text-primary-500 border-primary-500/30',
  };

  const deadlineColors = {
    urgent: 'bg-danger-500/10 text-danger-500',
    warning: 'bg-warning-500/10 text-warning-500',
    normal: 'bg-gray-500/10 text-gray-500',
  };

  const getDeadlineColor = (days: number | null) => {
    if (days === null) return deadlineColors.normal;
    if (days <= 7) return deadlineColors.urgent;
    if (days <= 30) return deadlineColors.warning;
    return deadlineColors.normal;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-3">
        {opportunitiesNeedingAction.map((opp: any) => (
          <div
            key={opp.id}
            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <Link href={`/dashboard/commercial/opportunites/${opp.id}`}>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors">
                      {opp.name}
                    </h4>
                  </Link>
                  <Badge className={`${priorityColors[opp.actionNeeded.priority as 'high' | 'medium' | 'low']} border text-xs`}>
                    {opp.actionNeeded.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {opp.company_name || 'Entreprise non définie'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {opp.stage_name && (
                    <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30 text-xs">
                      {opp.stage_name}
                    </Badge>
                  )}
                  {opp.daysUntilDeadline !== null && (
                    <Badge className={`${getDeadlineColor(opp.daysUntilDeadline)} border text-xs flex items-center gap-1`}>
                      <Clock className="w-3 h-3" />
                      {opp.daysUntilDeadline === 0 && "Aujourd'hui"}
                      {opp.daysUntilDeadline === 1 && 'Demain'}
                      {opp.daysUntilDeadline > 1 && `${opp.daysUntilDeadline} jours`}
                      {opp.daysUntilDeadline < 0 && 'Dépassé'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-sm font-bold text-success-500">
                  {formatCurrency(opp.amount || 0)}
                </div>
                {opp.probability && (
                  <div className="text-xs text-gray-500">{opp.probability}% prob.</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link href={`/dashboard/commercial/opportunites/${opp.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Voir détails
                </Button>
              </Link>
              {opp.actionNeeded.type === 'submission' && opp.company_id && (
                <Link href={`/dashboard/commercial/soumissions?company_id=${opp.company_id}&opportunity_id=${opp.id}`}>
                  <Button size="sm" className="text-xs bg-primary-500 hover:bg-primary-600">
                    <FileText className="w-3 h-3 mr-1" />
                    Créer soumission
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {opportunities.length > opportunitiesNeedingAction.length && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/commercial/opportunites"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Voir toutes les opportunités ({opportunities.length})
          </Link>
        </div>
      )}
    </div>
  );
}
