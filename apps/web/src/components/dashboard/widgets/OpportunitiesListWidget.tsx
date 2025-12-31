'use client';

/**
 * Widget : Liste des Opportunités
 */

import { TrendingUp, ExternalLink } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';

export function OpportunitiesListWidget({ config }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'opportunities-list',
    config,
    globalFilters,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-600 dark:text-red-400">
          Erreur de chargement
        </p>
      </div>
    );
  }

  const opportunities = data?.opportunities || [];

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune opportunité
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-3">
        {opportunities.map((opp: any) => (
          <Link
            key={opp.id}
            href={`/dashboard/commercial/opportunites/${opp.id}`}
            className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {opp.name}
                  </h4>
                  <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {opp.company}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(opp.amount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {opp.probability}% prob.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {opp.stage}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(opp.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {data?.total > opportunities.length && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/commercial/opportunites"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Voir toutes les opportunités ({data.total})
          </Link>
        </div>
      )}
    </div>
  );
}
