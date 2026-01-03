'use client';

/**
 * Dashboard Management Page - Customizable Dashboard with Drag & Drop Widgets
 * 
 * This is the management dashboard page with widgets specific to the management module.
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
import { useManagementDashboard } from '@/hooks/useManagementDashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import QuickActions from '@/components/ui/QuickActions';
import type { DashboardConfig } from '@/lib/dashboard/types';
import { logger } from '@/lib/logger';
import { DashboardContextProviderComponent } from '@/contexts/DashboardContext';

function ManagementDashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer, getConfigById } = useManagementDashboard();
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
        logger.error('Error loading management dashboard from server', error);
        // Continue even if server load fails - localStorage data will be used
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default management configuration if none exists
  useEffect(() => {
    if (!isLoading) {
      // Check if there's already a management dashboard config
      const managementConfig = configs.find(c => c.id === 'management-default');
      
      if (!managementConfig && configs.length === 0) {
        try {
          const defaultConfig: DashboardConfig = {
            id: 'management-default',
            name: 'Dashboard Management',
            is_default: true,
            layouts: [
              {
                id: 'widget-1',
                widget_type: 'employees-count',
                x: 0,
                y: 0,
                w: 3,
                h: 2,
                config: { 
                  title: 'Employés',
                  period: 'month' 
                },
              },
              {
                id: 'widget-2',
                widget_type: 'workload-chart',
                x: 3,
                y: 0,
                w: 6,
                h: 3,
                config: { 
                  title: 'Charge de Travail',
                  period: 'month' 
                },
              },
              {
                id: 'widget-3',
                widget_type: 'notifications',
                x: 9,
                y: 0,
                w: 3,
                h: 2,
                config: { 
                  title: 'Notifications',
                  period: 'month' 
                },
              },
              {
                id: 'widget-4',
                widget_type: 'growth-chart',
                x: 0,
                y: 2,
                w: 6,
                h: 3,
                config: { 
                  title: 'Évolution',
                  period: 'month' 
                },
              },
              {
                id: 'widget-5',
                widget_type: 'kpi-custom',
                x: 6,
                y: 2,
                w: 6,
                h: 3,
                config: { 
                  title: 'KPIs Management',
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
          logger.error('Error initializing default management dashboard config', error);
        }
      } else if (managementConfig) {
        // Use existing management config
        setActiveConfig(managementConfig.id);
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
    <DashboardContextProviderComponent context="management">
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
          module="team"
        />

        {/* Quick Actions FAB */}
        <QuickActions />
      </div>
    </DashboardContextProviderComponent>
  );
}

export default function ManagementDashboardPage() {
  return (
    <ErrorBoundary>
      <ManagementDashboardContent />
    </ErrorBoundary>
  );
}
