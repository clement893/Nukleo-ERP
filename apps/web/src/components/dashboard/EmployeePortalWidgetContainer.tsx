'use client';

/**
 * Conteneur pour un widget individuel dans le portail employé
 */

import { useState } from 'react';
import { RefreshCw, X, GripVertical, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';
import { getEmployeePortalWidget } from '@/lib/dashboard/employeePortalWidgetRegistry';
import type { WidgetLayout } from '@/lib/dashboard/types';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

interface EmployeePortalWidgetContainerProps {
  widgetLayout: WidgetLayout;
  isEditMode: boolean;
}

// Widget Error Fallback Component
function WidgetErrorFallback({ error, widgetType }: { error: Error; widgetType: string }) {
  console.error(`Widget error for ${widgetType}:`, error);
  
  return (
    <div className="h-full w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
        <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-1">
          Widget temporairement indisponible
        </p>
        <p className="text-yellow-500 dark:text-yellow-500 text-xs mb-2">
          {widgetType}
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mt-2">
            <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer mb-1">
              Détails de l'erreur
            </summary>
            <pre className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded mt-1 overflow-auto max-h-32">
              {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function EmployeePortalWidgetContainer({ widgetLayout, isEditMode }: EmployeePortalWidgetContainerProps) {
  const { removeWidget, updateWidget, globalFilters } = useEmployeePortalDashboardStore();
  const queryClient = useQueryClient();
  
  const widgetDef = getEmployeePortalWidget(widgetLayout.widget_type);
  
  if (!widgetDef) {
    return (
      <div className="h-full w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Widget type "{widgetLayout.widget_type}" not found
        </p>
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;
  const Icon = widgetDef.icon;

  const handleRemove = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
      removeWidget(widgetLayout.id);
    }
  };

  const handleRefresh = () => {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['widget', widgetLayout.id] });
    }
  };

  const handleConfigChange = (newConfig: any) => {
    updateWidget(widgetLayout.id, { config: newConfig });
    setIsConfigOpen(false);
  };

  return (
    <div 
      className={`
        h-full w-full glass-card
        rounded-lg
        flex flex-col
        transition-all duration-200
        ${isEditMode ? 'ring-2 ring-blue-500/30' : ''}
      `}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          )}
          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {widgetLayout.config.title || widgetDef.name}
          </h3>
        </div>
        
        {isEditMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-hidden p-4">
        <ErrorBoundary
          fallback={(error: Error | null) => error ? <WidgetErrorFallback error={error} widgetType={widgetLayout.widget_type} /> : null}
        >
          <WidgetComponent
            id={widgetLayout.id}
            config={widgetLayout.config}
            globalFilters={globalFilters}
            onConfigChange={handleConfigChange}
            onRemove={handleRemove}
            onRefresh={handleRefresh}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
