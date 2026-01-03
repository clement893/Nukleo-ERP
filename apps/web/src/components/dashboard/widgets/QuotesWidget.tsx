'use client';

/**
 * Widget : Liste des Devis
 */

import { FileText, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useInfiniteQuotes } from '@/lib/query/commercial';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui';
import { useMemo } from 'react';

export function QuotesWidget({ config, globalFilters }: WidgetProps) {
  const { data: quotesData, isLoading, error } = useInfiniteQuotes(1000);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Erreur de chargement"
        description="Impossible de charger les devis"
        variant="compact"
      />
    );
  }

  const quotes = useMemo(() => quotesData?.pages.flat() || [], [quotesData]);

  // Filtrer selon les filtres globaux
  const filteredQuotes = useMemo(() => {
    let filtered = quotes;
    
    if (globalFilters?.company_id) {
      filtered = filtered.filter((q: any) => q.company_id === globalFilters.company_id);
    }
    
    // Limiter le nombre affiché
    const limit = config?.filters?.limit || 5;
    return filtered.slice(0, limit);
  }, [quotes, globalFilters, config]);

  if (filteredQuotes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun devis"
        description="Commencez par créer votre premier devis."
        variant="compact"
      />
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      draft: { color: 'bg-gray-500', icon: FileText, label: 'Brouillon' },
      sent: { color: 'bg-blue-500', icon: Clock, label: 'Envoyé' },
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'En attente' },
      accepted: { color: 'bg-green-500', icon: CheckCircle2, label: 'Accepté' },
      rejected: { color: 'bg-red-500', icon: XCircle, label: 'Refusé' },
    };
    
    const statusInfo = statusMap[status] ?? statusMap.draft;
    const Icon = statusInfo.icon;
    
    return (
      <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-3">
        {filteredQuotes.map((quote: any) => {
          const created_at = quote.created_at 
            ? new Date(quote.created_at).toLocaleDateString('fr-FR')
            : 'N/A';
          const company = quote.company_name || 'N/A';
          const title = quote.title || 'Sans titre';
          
          return (
            <Link
              key={quote.id}
              href={`/dashboard/commercial/soumissions?quote_id=${quote.id}`}
              className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {title}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {company}
                  </p>
                  {getStatusBadge(quote.status || 'draft')}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(quote.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {created_at}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {quotes.length > filteredQuotes.length && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/commercial/soumissions"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Voir tous les devis ({quotes.length})
          </Link>
        </div>
      )}
    </div>
  );
}
