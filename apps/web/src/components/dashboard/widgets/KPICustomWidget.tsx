'use client';

/**
 * Widget : KPI Personnalisé
 */

import React from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';

export function KPICustomWidget({ id, config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'kpi-custom',
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

  const value = data?.value || 0;
  const unit = data?.unit || '';
  const label = data?.label || 'KPI';
  const growth = data?.growth || 0;
  const target = data?.target || 0;
  const progress = data?.progress || 0;
  const isPositive = growth >= 0;

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3">
          <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Value */}
        <div className="mb-3">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString('fr-FR', {
              maximumFractionDigits: 1,
            })}
            <span className="text-2xl text-gray-600 dark:text-gray-400 ml-1">
              {unit}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {label}
          </p>
        </div>

        {/* Growth */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{growth.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            vs mois dernier
          </span>
        </div>

        {/* Target progress */}
        {target > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Objectif : {target}{unit}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  progress >= 100
                    ? 'bg-green-600 dark:bg-green-500'
                    : progress >= 75
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : progress >= 50
                    ? 'bg-yellow-600 dark:bg-yellow-500'
                    : 'bg-red-600 dark:bg-red-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Sparkline placeholder */}
        <div className="mt-4 flex items-end justify-center gap-1 h-8">
          {[0.3, 0.5, 0.7, 0.6, 0.8, 0.9, 1, 0.95, 0.85, 0.75, 0.6, 0.8].map((height, i) => (
            <div
              key={i}
              className="w-2 bg-blue-200 dark:bg-blue-800 rounded-t"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Tendance 30 jours
        </p>
      </div>
    </div>
  );
}
