'use client';

import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ForecastDataPoint {
  date: string;
  optimistic: number;
  realistic: number;
  pessimistic: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  currentBalance: number;
  className?: string;
}

export default function ForecastChart({ data, currentBalance, className }: ForecastChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  // Calculer les valeurs min/max pour l'échelle
  const allValues = data.flatMap(d => [d.optimistic, d.realistic, d.pessimistic]);
  const minValue = Math.min(...allValues, currentBalance);
  const maxValue = Math.max(...allValues, currentBalance);
  const range = maxValue - minValue || 1;

  return (
    <Card className={`glass-card p-6 rounded-xl border border-[#A7A2CF]/20 ${className || ''}`}>
      <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Projection du Cashflow
      </h3>
      
      <div className="space-y-6">
        {data.map((point, index) => {
          const optimisticHeight = ((point.optimistic - minValue) / range) * 100;
          const realisticHeight = ((point.realistic - minValue) / range) * 100;
          const pessimisticHeight = ((point.pessimistic - minValue) / range) * 100;
          const currentHeight = ((currentBalance - minValue) / range) * 100;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{formatDate(point.date)}</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">Optimiste</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">Réaliste</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-gray-600 dark:text-gray-400">Pessimiste</span>
                  </div>
                </div>
              </div>

              <div className="relative h-40 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {/* Ligne de référence (solde actuel) */}
                {index === 0 && (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600 z-10"
                    style={{ top: `${100 - currentHeight}%` }}
                  >
                    <span className="absolute right-2 -top-3 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-1">
                      Actuel: {formatCurrency(currentBalance)}
                    </span>
                  </div>
                )}

                {/* Zone de confiance (bande entre pessimiste et optimiste) */}
                <div 
                  className="absolute left-0 right-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-green-500/20 transition-all duration-500"
                  style={{ 
                    top: `${100 - optimisticHeight}%`,
                    height: `${optimisticHeight - pessimisticHeight}%`
                  }}
                />

                {/* Ligne réaliste */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-blue-500 z-20 transition-all duration-500"
                  style={{ top: `${100 - realisticHeight}%` }}
                >
                  <div className="absolute left-2 -top-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                    {formatCurrency(point.realistic)}
                  </div>
                </div>

                {/* Points de scénarios */}
                <div className="absolute inset-0 flex items-end justify-center px-4 pb-2">
                  <div className="flex items-end gap-8 w-full justify-center">
                    {/* Pessimiste */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 z-30 transition-all duration-500"
                        style={{ marginBottom: `${pessimisticHeight - 8}%` }}
                        title={`Pessimiste: ${formatCurrency(point.pessimistic)}`}
                      />
                      <span className="text-[10px] text-red-600 font-medium mt-1">
                        {formatCurrency(point.pessimistic)}
                      </span>
                    </div>

                    {/* Réaliste */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 z-30 transition-all duration-500"
                        style={{ marginBottom: `${realisticHeight - 10}%` }}
                        title={`Réaliste: ${formatCurrency(point.realistic)}`}
                      />
                      <span className="text-[10px] text-blue-600 font-bold mt-1">
                        {formatCurrency(point.realistic)}
                      </span>
                    </div>

                    {/* Optimiste */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 z-30 transition-all duration-500"
                        style={{ marginBottom: `${optimisticHeight - 8}%` }}
                        title={`Optimiste: ${formatCurrency(point.optimistic)}`}
                      />
                      <span className="text-[10px] text-green-600 font-medium mt-1">
                        {formatCurrency(point.optimistic)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Écart entre scénarios */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Écart: {formatCurrency(point.optimistic - point.pessimistic)}</span>
                <span className="flex items-center gap-1">
                  {point.realistic >= currentBalance ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  {point.realistic >= currentBalance ? 'En hausse' : 'En baisse'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/50" />
            <span>Optimiste (+15%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/50" />
            <span>Réaliste (basé sur historique)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30" />
            <span>Pessimiste (-15%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
