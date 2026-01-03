'use client';

/**
 * Widget : Tendance du Taux de Réussite
 * Évolution du taux de réussite (won vs lost) dans le temps
 */

import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { useEffect, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from 'recharts';

interface WinRateDataPoint {
  month: string;
  won: number;
  lost: number;
  total: number;
  winRate: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const winRateEntry = payload.find((p: any) => p.dataKey === 'winRate');
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'winRate') return null;
            return (
              <p key={index} className="text-sm">
                <span style={{ color: entry.color }}>●</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
                <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
              </p>
            );
          })}
          {winRateEntry && (
            <p className="text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Taux de réussite: </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {winRateEntry.value?.toFixed(1) || 0}%
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function WinRateTrendWidget({ }: WidgetProps) {
  const [winRateData, setWinRateData] = useState<WinRateDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageWinRate, setAverageWinRate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const opportunities = await opportunitiesAPI.list();
        
        // Group by month and status
        const grouped: Record<string, { won: number; lost: number; total: number }> = {};
        
        opportunities.forEach((opp: any) => {
          const status = opp.status?.toLowerCase() || '';
          if (status.includes('won') || status === 'won') {
            const monthKey = getMonthKey(opp.closed_at || opp.updated_at || opp.created_at);
            if (!grouped[monthKey]) {
              grouped[monthKey] = { won: 0, lost: 0, total: 0 };
            }
            grouped[monthKey].won++;
            grouped[monthKey].total++;
          } else if (status.includes('lost') || status === 'lost') {
            const monthKey = getMonthKey(opp.closed_at || opp.updated_at || opp.created_at);
            if (!grouped[monthKey]) {
              grouped[monthKey] = { won: 0, lost: 0, total: 0 };
            }
            grouped[monthKey].lost++;
            grouped[monthKey].total++;
          }
        });

        // Convert to array and calculate win rates
        const data: WinRateDataPoint[] = Object.entries(grouped)
          .map(([month, stats]) => ({
            month,
            won: stats.won,
            lost: stats.lost,
            total: stats.total,
            winRate: stats.total > 0 ? (stats.won / stats.total) * 100 : 0,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12); // Last 12 months

        // Format month labels
        const formattedData = data.map(item => ({
          ...item,
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        }));

        setWinRateData(formattedData);
        
        // Calculate average win rate
        if (formattedData.length > 0) {
          const avgRate = formattedData.reduce((sum, d) => sum + d.winRate, 0) / formattedData.length;
          setAverageWinRate(avgRate);
        }
      } catch (error) {
        console.error('Error loading win rate trend:', error);
        setWinRateData([]);
        setAverageWinRate(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getMonthKey = (dateString: string | null | undefined): string => {
    if (!dateString) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (winRateData.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Aucune donnée"
        description="Créez et fermez des opportunités pour voir le taux de réussite."
        variant="compact"
      />
    );
  }

  const lastWinRate = winRateData[winRateData.length - 1]?.winRate || 0;
  const isPositive = lastWinRate >= averageWinRate;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taux de réussite moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageWinRate.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Dernier mois</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {lastWinRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={winRateData}>
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
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="won" fill="#10b981" name="Gagnées" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="lost" fill="#ef4444" name="Perdues" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="winRate"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Taux de réussite"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
