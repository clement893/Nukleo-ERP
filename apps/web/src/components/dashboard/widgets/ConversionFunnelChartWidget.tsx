'use client';

/**
 * Widget : Entonnoir de Conversion
 * Visualisation du pipeline avec taux de conversion par étape
 */

import { TrendingUp, Filter } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';

interface FunnelStage {
  name: string;
  count: number;
  percentage: number; // Percentage from previous stage
  color: string;
}

export function ConversionFunnelChartWidget({ }: WidgetProps) {
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallConversion, setOverallConversion] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const opportunities = await opportunitiesAPI.list();
        
        // Define pipeline stages (from early to late)
        const stages = [
          { key: 'LEAD', label: 'Lead', color: '#93c5fd' }, // blue-300
          { key: 'QUALIFICATION', label: 'Qualification', color: '#60a5fa' }, // blue-400
          { key: 'PROPOSAL', label: 'Proposition', color: '#3b82f6' }, // blue-500
          { key: 'NEGOTIATION', label: 'Négociation', color: '#2563eb' }, // blue-600
          { key: 'WON', label: 'Gagnée', color: '#10b981' }, // green-500
        ];

        // Count opportunities by stage
        const counts: Record<string, number> = {};
        opportunities.forEach((opp: any) => {
          const status = opp.status || 'LEAD';
          counts[status] = (counts[status] || 0) + 1;
        });

        // Build funnel data
        const funnel: FunnelStage[] = [];
        let previousCount = 0;
        
        stages.forEach((stage, index) => {
          const count = counts[stage.key] || 0;
          const percentage = index === 0 
            ? 100 
            : previousCount > 0 
              ? (count / previousCount) * 100 
              : 0;
          
          funnel.push({
            name: stage.label,
            count,
            percentage,
            color: stage.color,
          });
          
          previousCount = count;
        });

        setFunnelData(funnel);

        // Calculate overall conversion (WON / LEAD)
        const leadCount = counts['LEAD'] || 0;
        const wonCount = counts['WON'] || 0;
        const overall = leadCount > 0 ? (wonCount / leadCount) * 100 : 0;
        setOverallConversion(overall);
      } catch (error) {
        console.error('Error loading conversion funnel:', error);
        setFunnelData([]);
        setOverallConversion(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (funnelData.length === 0 || !funnelData[0] || funnelData[0].count === 0) {
    return (
      <EmptyState
        icon={Filter}
        title="Aucune donnée"
        description="Créez des opportunités pour voir l'entonnoir de conversion."
        variant="compact"
      />
    );
  }

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className="h-full flex flex-col">
      {/* Header with overall conversion */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taux de conversion global</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {overallConversion.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Leads totaux</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{funnelData[0]?.count ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        {funnelData.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;
          const isLast = index === funnelData.length - 1;
          
          return (
            <div key={stage.name} className="w-full flex flex-col items-center gap-1">
              {/* Stage label and count */}
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {stage.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {stage.count}
                  </span>
                  {index > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Funnel bar */}
              <div className="w-full relative">
                <div
                  className="rounded-lg transition-all duration-500 hover:opacity-90"
                  style={{
                    width: `${Math.max(widthPercentage, 5)}%`, // Minimum 5% for visibility
                    backgroundColor: stage.color,
                    height: '32px',
                    margin: '0 auto',
                  }}
                >
                  <div className="h-full flex items-center justify-center">
                    {stage.count > 0 && (
                      <span className="text-xs font-semibold text-white">
                        {stage.count}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Conversion arrow (except for last stage) */}
                {!isLast && stage.count > 0 && (
                  <div className="flex items-center justify-center my-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      {stage.percentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {funnelData.map((stage) => (
            <div key={stage.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{stage.name}</span>
              <span className="ml-auto font-semibold text-gray-900 dark:text-white">
                {stage.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
