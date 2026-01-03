'use client';

/**
 * Widget : Liste des Soumissions
 */

import { Briefcase, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useInfiniteSubmissions } from '@/lib/query/commercial';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui';
import { useMemo } from 'react';

export function SubmissionsWidget({ config, globalFilters }: WidgetProps) {
  const { data: submissionsData, isLoading, error } = useInfiniteSubmissions(1000);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (error) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Erreur de chargement"
        description="Impossible de charger les soumissions"
        variant="compact"
      />
    );
  }

  const submissions = useMemo(() => submissionsData?.pages.flat() || [], [submissionsData]);

  // Filtrer selon les filtres globaux
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    
    if (globalFilters?.company_id) {
      filtered = filtered.filter((s: any) => s.company_id === globalFilters.company_id);
    }
    
    // Limiter le nombre affiché
    const limit = config?.filters?.limit || 5;
    return filtered.slice(0, limit);
  }, [submissions, globalFilters, config]);

  if (filteredSubmissions.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Aucune soumission"
        description="Commencez par créer votre première soumission."
        variant="compact"
      />
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      draft: { color: 'bg-gray-500', icon: Clock, label: 'Brouillon' },
      submitted: { color: 'bg-blue-500', icon: Clock, label: 'Soumis' },
      under_review: { color: 'bg-yellow-500', icon: Clock, label: 'En révision' },
      won: { color: 'bg-green-500', icon: CheckCircle2, label: 'Gagné' },
      lost: { color: 'bg-red-500', icon: XCircle, label: 'Perdu' },
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
        {filteredSubmissions.map((submission: any) => {
          const created_at = submission.created_at 
            ? new Date(submission.created_at).toLocaleDateString('fr-FR')
            : 'N/A';
          const company = submission.company_name || 'N/A';
          const title = submission.title || submission.name || 'Sans titre';
          
          return (
            <Link
              key={submission.id}
              href={`/dashboard/commercial/soumissions/submissions/${submission.id}`}
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
                  {getStatusBadge(submission.status || 'draft')}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(submission.amount)}
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

      {submissions.length > filteredSubmissions.length && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/commercial/soumissions"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Voir toutes les soumissions ({submissions.length})
          </Link>
        </div>
      )}
    </div>
  );
}
