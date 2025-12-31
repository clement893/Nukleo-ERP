'use client';

/**
 * Widget : Pipeline des Opportunités
 */

import { BarChart3, ExternalLink } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';

export function OpportunitiesPipelineWidget({ globalFilters }: WidgetProps) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [stages, setStages] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await opportunitiesAPI.list(0, 100, {
          company_id: globalFilters?.company_id,
        });
        setOpportunities(data || []);
        
        // Group by stage
        const grouped: Record<string, any[]> = {};
        data.forEach((opp: any) => {
          const stageId = opp.stage_id || 'no-stage';
          if (!grouped[stageId]) {
            grouped[stageId] = [];
          }
          grouped[stageId].push(opp);
        });
        setStages(grouped);
      } catch (error) {
        console.error('Error loading opportunities:', error);
        setOpportunities([]);
        setStages({});
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [globalFilters?.company_id]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const totalOpportunities = opportunities.length;
  const totalAmount = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

  if (totalOpportunities === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Aucune opportunité"
        description="Créez votre première opportunité pour voir le pipeline."
        variant="compact"
      />
    );
  }

  const stageNames = Object.keys(stages);
  const maxCount = Math.max(...Object.values(stages).map(s => s.length), 1);

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOpportunities}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Valeur totale</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(totalAmount)}
          </p>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-3">
          {stageNames.map((stageId) => {
            const stageOpps = stages[stageId];
            if (!stageOpps || stageOpps.length === 0) return null;
            const stageName = stageOpps[0]?.stage_name || 'Sans étape';
            const count = stageOpps.length;
            const percentage = (count / maxCount) * 100;

            return (
              <div key={stageId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{stageName}</span>
                  <span className="text-gray-500 dark:text-gray-400">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent opportunities */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Récentes</p>
          <div className="space-y-2">
            {opportunities.slice(0, 3).map((opp: any) => (
              <Link
                key={opp.id}
                href={`/dashboard/commercial/opportunites/${opp.id}`}
                className="block p-2 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
                    {opp.name || 'Sans nom'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                </div>
                {opp.amount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(opp.amount)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
