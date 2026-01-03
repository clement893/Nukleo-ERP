'use client';

/**
 * Widget : Timeline des Opportunités
 * Évolution du nombre d'opportunités créées dans le temps
 */

import { TrendingUp, Calendar } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface TimelineDataPoint {
  month: string;
  count: number;
  amount: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>●</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {entry.dataKey === 'amount'
                  ? new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(entry.value as number)
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function OpportunitiesTimelineWidget({ }: WidgetProps) {
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalOpportunities, setTotalOpportunities] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const opportunities = await opportunitiesAPI.list();
        
        setTotalOpportunities(opportunities.length);
        
        // Group by month
        const grouped: Record<string, { count: number; amount: number }> = {};
        
        opportunities.forEach((opp: any) => {
          if (opp.created_at) {
            const createdDate = new Date(opp.created_at);
            const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[monthKey]) {
              grouped[monthKey] = { count: 0, amount: 0 };
            }
            
            grouped[monthKey].count++;
            grouped[monthKey].amount += opp.amount || 0;
          }
        });

        // Convert to array and sort (last 12 months)
        const data: TimelineDataPoint[] = Object.entries(grouped)
          .map(([month, stats]) => ({
            month,
            count: stats.count,
            amount: stats.amount,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12);

        // Format month labels
        const formattedData = data.map(item => ({
          ...item,
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        }));

        setTimelineData(formattedData);
      } catch (error) {
        console.error('Error loading opportunities timeline:', error);
        setTimelineData([]);
        setTotalOpportunities(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (timelineData.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Aucune donnée"
        description="Créez des opportunités pour voir la timeline."
        variant="compact"
      />
    );
  }

  const lastMonth = timelineData[timelineData.length - 1];
  const previousMonth = timelineData.length > 1 ? timelineData[timelineData.length - 2] : null;
  const growth = previousMonth && lastMonth && previousMonth.count > 0
    ? ((lastMonth.count - previousMonth.count) / previousMonth.count) * 100
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total opportunités</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOpportunities}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Évolution mensuelle</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              growth >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {growth >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5 rotate-180" />
              )}
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#timelineGradient)"
              name="Nombre"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
