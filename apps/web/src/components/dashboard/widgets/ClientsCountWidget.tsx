'use client';

/**
 * Widget : Compteur de Clients
 */

import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';

export function ClientsCountWidget({ id, config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'clients-count',
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

  const count = data?.count || 0;
  const growth = data?.growth || 0;
  const previousCount = data?.previous_count || 0;
  const isPositive = growth >= 0;

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Count */}
        <div className="mb-2">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {count.toLocaleString('fr-FR')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Clients actifs
          </p>
        </div>

        {/* Growth */}
        <div className="flex items-center justify-center gap-1">
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
            vs période précédente
          </span>
        </div>

        {/* Previous count */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Précédent : {previousCount.toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  );
}
