'use client';

/**
 * Widget : Pipeline des Opportunités
 * Optimisé avec glassmorphism et animations pour un look premium
 */

import { BarChart3, ExternalLink, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import Link from 'next/link';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';

// Stage colors mapping
const STAGE_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  'lead': { bg: 'bg-gray-500', text: 'text-gray-500', gradient: 'from-gray-500/30 to-gray-500/0' },
  'qualified': { bg: 'bg-blue-500', text: 'text-blue-500', gradient: 'from-blue-500/30 to-blue-500/0' },
  'proposal': { bg: 'bg-purple-500', text: 'text-purple-500', gradient: 'from-purple-500/30 to-purple-500/0' },
  'negotiation': { bg: 'bg-amber-500', text: 'text-amber-500', gradient: 'from-amber-500/30 to-amber-500/0' },
  'won': { bg: 'bg-green-500', text: 'text-green-500', gradient: 'from-green-500/30 to-green-500/0' },
  'lost': { bg: 'bg-red-500', text: 'text-red-500', gradient: 'from-red-500/30 to-red-500/0' },
  'default': { bg: 'bg-gray-500', text: 'text-gray-500', gradient: 'from-gray-500/30 to-gray-500/0' },
};

const getStageColor = (stageName: string) => {
  const normalized = stageName.toLowerCase();
  for (const [key, colors] of Object.entries(STAGE_COLORS)) {
    if (normalized.includes(key)) return colors;
  }
  return STAGE_COLORS.default;
};

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
      {/* Summary avec glassmorphism */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="glass-badge px-3 py-2 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {totalOpportunities}
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </p>
        </div>
        <div className="glass-badge px-3 py-2 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valeur totale</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(totalAmount)}
          </p>
        </div>
      </div>

      {/* Pipeline visualization avec gradients */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-3">
          {stageNames.map((stageId, index) => {
            const stageOpps = stages[stageId];
            if (!stageOpps || stageOpps.length === 0) return null;
            const stageName = stageOpps[0]?.stage_name || 'Sans étape';
            const count = stageOpps.length;
            const percentage = (count / maxCount) * 100;
            const stageAmount = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
            const colors = getStageColor(stageName);
            
            if (!colors) return null;

            return (
              <div 
                key={stageId} 
                className="space-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                    {stageName}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">{count}</span>
                </div>
                <div className="relative w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                  <div
                    className={`${colors.bg} h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} animate-pulse`} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(stageAmount)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {((count / totalOpportunities) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent opportunities avec glassmorphism */}
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full" />
            Récentes
          </p>
          <div className="space-y-2">
            {opportunities.slice(0, 3).map((opp: any, index: number) => (
              <Link
                key={opp.id}
                href={`/dashboard/commercial/opportunites/${opp.id}`}
                className="block glass-card-hover p-3 rounded-lg transition-all group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
                    {opp.name || 'Sans nom'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                </div>
                {opp.amount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(opp.amount)}
                  </p>
                )}
                {opp.stage_name && (() => {
                  const stageColors = getStageColor(opp.stage_name);
                  return stageColors ? (
                    <p className={`text-xs ${stageColors.text} mt-1`}>
                      {opp.stage_name}
                    </p>
                  ) : null;
                })()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
