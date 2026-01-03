'use client';

/**
 * Dashboard Commercial Page - Customizable Dashboard with Drag & Drop Widgets
 * 
 * This is the commercial dashboard page with widgets specific to the commercial module.
 * Features:
 * - Drag & drop widgets
 * - Customizable layouts
 * - Global filters
 * - Multiple configurations
 * - Real-time data from APIs
 * 
 * @page
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import QuickActions from '@/components/ui/QuickActions';
import type { DashboardConfig } from '@/lib/dashboard/types';
import { logger } from '@/lib/logger';

function CommercialDashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer, getConfigById } = useDashboardStore();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard configs from server on mount
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Attendre un peu pour que Zustand persist charge d'abord depuis localStorage
        await new Promise(resolve => setTimeout(resolve, 200));
        await loadFromServer();
      } catch (error) {
        logger.error('Error loading commercial dashboard from server', error);
        // Continue even if server load fails - localStorage data will be used
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default commercial configuration if none exists
  useEffect(() => {
    if (!isLoading) {
      // Check if there's already a commercial dashboard config
      const commercialConfig = configs.find(c => c.id === 'commercial-default');
      
      if (!commercialConfig && configs.length === 0) {
        try {
          const defaultConfig: DashboardConfig = {
            id: 'commercial-default',
            name: 'Dashboard Commercial',
            is_default: true,
            layouts: [
              {
                id: 'widget-1',
                widget_type: 'commercial-stats',
                x: 0,
                y: 0,
                w: 6,
                h: 2,
                config: { 
                  title: 'Statistiques Commerciales',
                  period: 'month' 
                },
              },
              {
                id: 'widget-2',
                widget_type: 'opportunities-needing-action',
                x: 6,
                y: 0,
                w: 6,
                h: 3,
                config: { 
                  title: 'Opportunités nécessitant une action',
                  period: 'month',
                  filters: { limit: 5 }
                },
              },
              {
                id: 'widget-3',
                widget_type: 'opportunities-list',
                x: 0,
                y: 2,
                w: 4,
                h: 2,
                config: { 
                  title: 'Opportunités récentes',
                  period: 'month' 
                },
              },
              {
                id: 'widget-4',
                widget_type: 'quotes-list',
                x: 4,
                y: 2,
                w: 4,
                h: 2,
                config: { 
                  title: 'Devis récents',
                  period: 'month',
                  filters: { limit: 5 }
                },
              },
              {
                id: 'widget-5',
                widget_type: 'submissions-list',
                x: 8,
                y: 2,
                w: 4,
                h: 2,
                config: { 
                  title: 'Soumissions récentes',
                  period: 'month',
                  filters: { limit: 5 }
                },
              },
              {
                id: 'widget-6',
                widget_type: 'opportunities-pipeline',
                x: 0,
                y: 4,
                w: 6,
                h: 3,
                config: { 
                  title: 'Pipeline des Opportunités',
                  period: 'month' 
                },
              },
              {
                id: 'widget-7',
                widget_type: 'clients-count',
                x: 6,
                y: 4,
                w: 2,
                h: 1,
                config: { 
                  title: 'Total Clients',
                  period: 'month' 
                },
              },
              {
                id: 'widget-8',
                widget_type: 'clients-growth',
                x: 8,
                y: 4,
                w: 4,
                h: 2,
                config: { 
                  title: 'Croissance Clients',
                  period: 'month' 
                },
              },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          addConfig(defaultConfig);
          setActiveConfig(defaultConfig.id);
        } catch (error) {
          logger.error('Error initializing default commercial dashboard config', error);
        }
      } else if (commercialConfig) {
        // Use existing commercial config
        setActiveConfig(commercialConfig.id);
      } else if (configs.length > 0 && configs[0]) {
        // Use first available config
        setActiveConfig(configs[0].id);
      }
    }
  }, [configs.length, addConfig, setActiveConfig, isLoading, getConfigById]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-bg-subtle">
      {/* Toolbar */}
      <DashboardToolbar onAddWidget={() => setIsLibraryOpen(true)} />

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6 spacing-generous">
        <DashboardGrid />
      </div>

      {/* Widget Library Modal */}
      <WidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      {/* Quick Actions FAB */}
      <QuickActions />
    </div>
  );
}

export default function CommercialDashboardPage() {
  return (
    <ErrorBoundary>
      <CommercialDashboardContent />
    </ErrorBoundary>
  );
}
