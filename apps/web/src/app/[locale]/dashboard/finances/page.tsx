'use client';

/**
 * Dashboard Finances Page - Customizable Dashboard with Drag & Drop Widgets
 * 
 * This is the finances dashboard page with widgets specific to the finances module.
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
import { useFinancesDashboard } from '@/hooks/useFinancesDashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import QuickActions from '@/components/ui/QuickActions';
import type { DashboardConfig } from '@/lib/dashboard/types';
import { logger } from '@/lib/logger';
import { DashboardContextProviderComponent } from '@/contexts/DashboardContext';

function FinancesDashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer, getConfigById } = useFinancesDashboard();
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
        logger.error('Error loading finances dashboard from server', error);
        // Continue even if server load fails - localStorage data will be used
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default finances configuration if none exists
  useEffect(() => {
    if (!isLoading) {
      // Check if there's already a finances dashboard config
      const financesConfig = configs.find(c => c.id === 'finances-default');
      
      if (!financesConfig && configs.length === 0) {
        try {
          const defaultConfig: DashboardConfig = {
            id: 'finances-default',
            name: 'Dashboard Finances',
            is_default: true,
            layouts: [
              {
                id: 'widget-1',
                widget_type: 'revenue-chart',
                x: 0,
                y: 0,
                w: 6,
                h: 3,
                config: { 
                  title: 'Revenus',
                  period: 'month' 
                },
              },
              {
                id: 'widget-2',
                widget_type: 'expenses-chart',
                x: 6,
                y: 0,
                w: 6,
                h: 3,
                config: { 
                  title: 'Dépenses',
                  period: 'month' 
                },
              },
              {
                id: 'widget-3',
                widget_type: 'cash-flow',
                x: 0,
                y: 3,
                w: 6,
                h: 3,
                config: { 
                  title: 'Trésorerie',
                  period: 'month' 
                },
              },
              {
                id: 'widget-4',
                widget_type: 'kpi-custom',
                x: 6,
                y: 3,
                w: 3,
                h: 2,
                config: { 
                  title: 'Profit',
                  period: 'month' 
                },
              },
              {
                id: 'widget-5',
                widget_type: 'growth-chart',
                x: 9,
                y: 3,
                w: 3,
                h: 2,
                config: { 
                  title: 'Croissance',
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
          logger.error('Error initializing default finances dashboard config', error);
        }
      } else if (financesConfig) {
        // Use existing finances config
        setActiveConfig(financesConfig.id);
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
    <DashboardContextProviderComponent context="finances">
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
          module="finances"
        />

        {/* Quick Actions FAB */}
        <QuickActions />
      </div>
    </DashboardContextProviderComponent>
  );
}

export default function FinancesDashboardPage() {
  return (
    <ErrorBoundary>
      <FinancesDashboardContent />
    </ErrorBoundary>
  );
}
