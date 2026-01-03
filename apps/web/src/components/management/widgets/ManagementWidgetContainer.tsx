'use client';

/**
 * Conteneur pour un widget management individuel
 * Similaire à WidgetContainer mais adapté pour les widgets management
 */

import { RefreshCw, X, GripVertical, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useManagementDashboardStore } from '@/lib/management/store';
import type { ManagementWidgetConfig } from '@/lib/management/types';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { ManagementWidgetRenderer } from './ManagementWidgetRenderer';

interface ManagementWidgetContainerProps {
  widget: ManagementWidgetConfig;
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

export function ManagementWidgetContainer({ widget, isEditMode }: ManagementWidgetContainerProps) {
  const { removeWidget } = useManagementDashboardStore();
  const queryClient = useQueryClient();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const handleRemove = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
      removeWidget(widget.id);
    }
  };

  const handleRefresh = () => {
    // Refresh widget data by invalidating React Query cache
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['management-widget', widget.id] });
    }
  };

  // Get widget title from config or default
  const widgetTitle = widget.config?.title || (() => {
    const titles: Record<string, string> = {
      'employees-stats': 'Statistiques Employés',
      'time-tracking-summary': 'Suivi du Temps',
      'vacation-overview': 'Vue d\'ensemble Vacances',
      'pending-requests': 'Demandes en attente',
      'upcoming-vacations': 'Vacances à venir',
    };
    return titles[widget.widget_type] || 'Widget';
  })();

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
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditMode && (
            <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {widgetTitle}
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
      <div className="flex-1 p-4 overflow-auto min-h-0">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error(`Widget error for ${widget.widget_type}:`, error, errorInfo);
          }}
          showDetails={process.env.NODE_ENV === 'development'}
          fallback={(error) => (
            <WidgetErrorFallback 
              error={error || new Error('Widget rendering error')} 
              widgetType={widget.widget_type}
            />
          )}
        >
          <ManagementWidgetRenderer widget={widget} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
