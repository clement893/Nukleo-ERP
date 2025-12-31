'use client';

/**
 * Conteneur pour un widget individuel
 */

import { useState } from 'react';
import { Settings, RefreshCw, X, GripVertical, AlertCircle } from 'lucide-react';
import { useDashboardStore } from '@/lib/dashboard/store';
import { getWidget } from '@/lib/dashboard/widgetRegistry';
import type { WidgetLayout } from '@/lib/dashboard/types';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

interface WidgetContainerProps {
  widgetLayout: WidgetLayout;
  isEditMode: boolean;
}

// Widget Error Fallback Component
function WidgetErrorFallback({ error, widgetType }: { error: Error; widgetType: string }) {
  // Log error for debugging
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

export function WidgetContainer({ widgetLayout, isEditMode }: WidgetContainerProps) {
  const { removeWidget, updateWidget, globalFilters } = useDashboardStore();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const widgetDef = getWidget(widgetLayout.widget_type);
  
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
    // TODO: Implémenter le refresh
    console.log('Refresh widget:', widgetLayout.id);
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
        ${isEditMode ? 'hover:shadow-lg hover:border-blue-400/50 dark:hover:border-blue-500/50' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditMode && (
            <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {widgetLayout.config.title || widgetDef.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isEditMode && (
            <button
              onClick={handleRefresh}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 rounded transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {widgetDef.configurable && (
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 rounded transition-colors"
              title="Configurer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          {isEditMode && (
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {WidgetComponent ? (
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error(`Widget error for ${widgetLayout.widget_type}:`, error, errorInfo);
            }}
            showDetails={process.env.NODE_ENV === 'development'}
            fallback={(error) => (
              <WidgetErrorFallback 
                error={error || new Error('Widget rendering error')} 
                widgetType={widgetLayout.widget_type}
              />
            )}
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
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {widgetDef.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Widget en cours de développement
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Config Panel (si ouvert) */}
      {isConfigOpen && (
        <div className="absolute inset-0 glass-modal z-50 rounded-lg p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Configuration
            </h4>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre du widget
              </label>
              <input
                type="text"
                value={widgetLayout.config.title || ''}
                onChange={(e) => handleConfigChange({ ...widgetLayout.config, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={widgetDef.name}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Période
              </label>
              <select
                value={widgetLayout.config.period || 'month'}
                onChange={(e) => handleConfigChange({ ...widgetLayout.config, period: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Année</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
