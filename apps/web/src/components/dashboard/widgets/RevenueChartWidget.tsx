'use client';

/**
 * Widget : Graphique des Revenus
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function RevenueChartWidget({ config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'revenue-chart',
    config,
    globalFilters,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-600 dark:text-red-400">
          Erreur de chargement
        </p>
      </div>
    );
  }

  const chartData = data?.data || [];
  const total = data?.total || 0;
  const growth = data?.growth || 0;
  const isPositive = growth >= 0;

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune donnée de revenus
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(total)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Revenus totaux
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-lg font-semibold ${
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
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
              formatter={(value: any) =>
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(value)
              }
              labelStyle={{ color: '#374151', fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
