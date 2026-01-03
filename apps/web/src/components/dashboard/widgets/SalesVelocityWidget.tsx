'use client';

/**
 * Widget : Vélocité de Vente
 * Temps moyen pour convertir une opportunité (du création au closing)
 */

import { Zap, Clock } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface VelocityData {
  period: string;
  averageDays: number;
  count: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.period}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value?.toFixed(1) || 0} jours
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.count} opportunité{data.payload.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function SalesVelocityWidget({ }: WidgetProps) {
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVelocity, setCurrentVelocity] = useState(0);
  const targetVelocity = 30; // Target: 30 days

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const opportunities = await opportunitiesAPI.list();
        
        // Filter won opportunities with both created_at and closed_at
        const wonOpportunities = opportunities.filter((opp: any) => 
          (opp.status === 'won' || opp.closed_at) && opp.created_at && opp.closed_at
        );
        
        // Calculate days to close for each opportunity
        const opportunitiesWithVelocity = wonOpportunities.map((opp: any) => {
          const created = new Date(opp.created_at);
          const closed = new Date(opp.closed_at);
          const daysDiff = Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return {
            ...opp,
            daysToClose: daysDiff,
            closedMonth: `${closed.getFullYear()}-${String(closed.getMonth() + 1).padStart(2, '0')}`,
          };
        });
        
        // Group by month (last 6 months)
        const grouped: Record<string, { totalDays: number; count: number }> = {};
        opportunitiesWithVelocity.forEach((opp: any) => {
          if (!grouped[opp.closedMonth]) {
            grouped[opp.closedMonth] = { totalDays: 0, count: 0 };
          }
          grouped[opp.closedMonth].totalDays += opp.daysToClose;
          grouped[opp.closedMonth].count += 1;
        });
        
        // Convert to array and calculate averages
        const data: VelocityData[] = Object.entries(grouped)
          .map(([period, stats]) => ({
            period,
            averageDays: stats.count > 0 ? stats.totalDays / stats.count : 0,
            count: stats.count,
          }))
          .sort((a, b) => a.period.localeCompare(b.period))
          .slice(-6); // Last 6 months

        // Format period labels
        const formattedData = data.map(item => ({
          ...item,
          period: formatMonthLabel(item.period),
        }));

        setVelocityData(formattedData);
        
        // Set current velocity
        if (formattedData.length > 0) {
          const last = formattedData[formattedData.length - 1];
          if (last) {
            setCurrentVelocity(last.averageDays);
          }
        }
      } catch (error) {
        console.error('Error loading sales velocity:', error);
        setVelocityData([]);
        setCurrentVelocity(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatMonthLabel = (monthKey: string): string => {
    if (!monthKey) return 'N/A';
    const parts = monthKey.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const month = parts[1];
      if (year && month) {
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }
    }
    return monthKey;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (velocityData.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="Aucune donnée"
        description="Les données de vélocité apparaîtront ici."
        variant="compact"
      />
    );
  }

  const isOnTarget = currentVelocity <= targetVelocity;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vélocité moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentVelocity.toFixed(1)} jours
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cible: {targetVelocity}j</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              isOnTarget
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              <Clock className="w-5 h-5" />
              {isOnTarget ? '✓' : '!'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={velocityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              label={{ value: 'Jours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="averageDays" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Jours moyen" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
