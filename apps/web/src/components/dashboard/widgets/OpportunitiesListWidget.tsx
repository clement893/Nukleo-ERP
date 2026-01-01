'use client';

/**
 * Widget : Liste des Opportunités
 */

import { TrendingUp, ExternalLink } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

export function OpportunitiesListWidget({ config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'opportunities-list',
    config,
    globalFilters,
  });

  if (isLoading) {
    return <SkeletonWidget />;
  }

  // Handle error state - show empty state instead of error message
  // The hook now returns fallback empty data instead of throwing errors
  if (error) {
    console.warn('OpportunitiesListWidget error:', error);
  }

  const opportunities = data?.opportunities || [];

  if (opportunities.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Aucune opportunité"
        description="Commencez par créer votre première opportunité pour suivre vos prospects."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-3">
        {opportunities.map((opp: any) => {
          // Safely handle missing or invalid data
          const amount = opp.amount ?? 0;
          const probability = opp.probability ?? 0;
          const created_at = opp.created_at ? new Date(opp.created_at).toLocaleDateString('fr-FR') : 'N/A';
          const stage = opp.stage || 'Non défini';
          const company = opp.company || 'N/A';
          const name = opp.name || 'Sans nom';
          
          return (
            <Link
              key={opp.id || Math.random()}
              href={`/dashboard/commercial/opportunites/${opp.id}`}
              className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {name}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {company}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {probability}% prob.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                  {stage}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {created_at}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {data?.total > opportunities.length && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/commercial/opportunites"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Voir toutes les opportunités ({data.total})
          </Link>
        </div>
      )}
    </div>
  );
}
