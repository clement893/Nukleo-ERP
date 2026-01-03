'use client';

/**
 * Widget : Évolution du CA/Revenus Commercial dans le temps
 * Graphique d'évolution des revenus commerciaux avec périodes et comparaisons
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { useEffect, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface RevenueDataPoint {
  month: string;
  value: number;
  date?: string;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {label}
        </p>
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueCommercialChartWidget({ config }: WidgetProps) {
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const period = (config?.period as 'month' | 'quarter' | 'year') || 'month';
        const result = await fetchDashboardRevenue({ period, months: 6 });
        
        setChartData(result.data || []);
        setTotal(result.total || 0);
        setGrowth(result.growth || 0);
      } catch (error) {
        console.error('Error loading commercial revenue:', error);
        setChartData([]);
        setTotal(0);
        setGrowth(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [config]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée de revenus commerciaux"
        description="Les données de revenus apparaîtront ici une fois que vous aurez enregistré vos premières transactions commerciales."
        variant="compact"
      />
    );
  }

  const isPositive = growth >= 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(total)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Revenus commerciaux totaux
          </p>
        </div>
        
        {/* Growth badge */}
        <div className="px-4 py-2 rounded-full flex items-center gap-2 bg-gray-100 dark:bg-gray-800">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-lg font-bold ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{growth.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenueCommercial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="currentColor" 
              className="text-gray-200 dark:text-gray-700"
              opacity={0.5}
            />
            
            <XAxis
              dataKey="month"
              tick={{ 
                fill: 'currentColor',
                fontSize: 12,
                className: 'text-gray-600 dark:text-gray-400'
              }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              axisLine={{ strokeWidth: 1 }}
            />
            
            <YAxis
              tick={{ 
                fill: 'currentColor',
                fontSize: 12,
                className: 'text-gray-600 dark:text-gray-400'
              }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              axisLine={{ strokeWidth: 1 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#colorRevenueCommercial)"
              animationDuration={1000}
            />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ 
                fill: '#2563eb', 
                r: 5,
                strokeWidth: 2,
                stroke: '#fff',
              }}
              activeDot={{ 
                r: 7,
                strokeWidth: 3,
                stroke: '#fff',
                fill: '#2563eb'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
