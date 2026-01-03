'use client';

/**
 * Widget : Taille Moyenne des Deals
 * Calcul de la taille moyenne des deals/opportunités gagnées
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';

interface DealSizeData {
  period: string;
  average: number;
  count: number;
  total: number;
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
          {data.value?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.count} deal{data.payload.count !== 1 ? 's' : ''} • Total: {data.payload.total?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
        </p>
      </div>
    );
  }
  return null;
};

export function AverageDealSizeWidget({ }: WidgetProps) {
  const [dealSizeData, setDealSizeData] = useState<DealSizeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAverage, setCurrentAverage] = useState(0);
  const [previousAverage, setPreviousAverage] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const opportunities = await opportunitiesAPI.list();
        
        // Filter won opportunities (status 'won' or closed_at exists)
        const wonOpportunities = opportunities.filter((opp: any) => 
          opp.status === 'won' || (opp.closed_at && opp.amount)
        ).filter((opp: any) => opp.amount && opp.amount > 0);
        
        // Group by month (last 6 months)
        const grouped: Record<string, { total: number; count: number }> = {};
        
        wonOpportunities.forEach((opp: any) => {
          if (!opp.closed_at) return;
          const closedDate = new Date(opp.closed_at);
          const monthKey = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, '0')}`;
          if (!grouped[monthKey]) {
            grouped[monthKey] = { total: 0, count: 0 };
          }
          grouped[monthKey].total += opp.amount || 0;
          grouped[monthKey].count += 1;
        });
        
        // Convert to array and calculate averages
        const data: DealSizeData[] = Object.entries(grouped)
          .map(([period, stats]) => ({
            period,
            average: stats.count > 0 ? stats.total / stats.count : 0,
            count: stats.count,
            total: stats.total,
          }))
          .sort((a, b) => a.period.localeCompare(b.period))
          .slice(-6); // Last 6 months

        // Format period labels
        const formattedData = data.map(item => ({
          ...item,
          period: formatMonthLabel(item.period),
        }));

        setDealSizeData(formattedData);
        
        // Calculate current and previous averages
        if (formattedData.length > 0) {
          const last = formattedData[formattedData.length - 1];
          const previous = formattedData.length > 1 ? formattedData[formattedData.length - 2] : formattedData[0];
          if (last) {
            setCurrentAverage(last.average);
          }
          if (previous) {
            setPreviousAverage(previous.average);
          }
        }
      } catch (error) {
        console.error('Error loading average deal size:', error);
        setDealSizeData([]);
        setCurrentAverage(0);
        setPreviousAverage(0);
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

  if (dealSizeData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée"
        description="Les données de taille moyenne des deals apparaîtront ici."
        variant="compact"
      />
    );
  }

  const growth = previousAverage > 0
    ? ((currentAverage - previousAverage) / previousAverage) * 100
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taille moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentAverage.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Évolution</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              growth >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {growth >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dealSizeData}>
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Taille moyenne"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
