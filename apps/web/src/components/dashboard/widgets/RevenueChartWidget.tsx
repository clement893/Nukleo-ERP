'use client';

/**
 * Widget : Graphique des Revenus
 * Version améliorée avec glassmorphism et animations
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import EmptyState from '@/components/ui/EmptyState';
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

// Custom Tooltip avec glassmorphism
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 animate-scale-in">
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

export function RevenueChartWidget({ config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'revenue-chart',
    config,
    globalFilters,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin-custom rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle error state - show empty state instead of error message
  // The hook now returns fallback empty data instead of throwing errors
  if (error) {
    console.warn('RevenueChartWidget error:', error);
  }

  const chartData = data?.data || [];
  const total = data?.total || 0;
  const growth = data?.growth || 0;
  const isPositive = growth >= 0;

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée de revenus"
        description="Les données de revenus apparaîtront ici une fois que vous aurez enregistré vos premières transactions."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      {/* Header stats avec glassmorphism */}
      <div className="flex items-center justify-between mb-6">
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
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
        
        {/* Growth badge avec glassmorphism */}
        <div 
          className="glass-badge px-4 py-2 rounded-full flex items-center gap-2 hover-lift animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
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

      {/* Chart avec gradient et animations */}
      <div className="flex-1 min-h-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {/* Gradient pour l'area */}
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
            
            {/* Area avec gradient */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#colorRevenue)"
              animationDuration={1000}
              animationEasing="ease-out"
            />
            
            {/* Line pour plus de contraste */}
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
                className: 'hover-scale'
              }}
              activeDot={{ 
                r: 7,
                strokeWidth: 3,
                stroke: '#fff',
                fill: '#2563eb'
              }}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
