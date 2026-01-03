'use client';

/**
 * Dashboard Réseau Page - Customizable Dashboard with Drag & Drop Widgets
 * 
 * This is the network dashboard page with widgets specific to the network module.
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
import { useReseauDashboard } from '@/hooks/useReseauDashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import QuickActions from '@/components/ui/QuickActions';
import type { DashboardConfig } from '@/lib/dashboard/types';
import { logger } from '@/lib/logger';
import { DashboardContextProviderComponent } from '@/contexts/DashboardContext';

function ReseauDashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer, getConfigById } = useReseauDashboard();
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
        logger.error('Error loading reseau dashboard from server', error);
        // Continue even if server load fails - localStorage data will be used
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default reseau configuration if none exists
  useEffect(() => {
    if (!isLoading) {
      // Check if there's already a reseau dashboard config
      const reseauConfig = configs.find(c => c.id === 'reseau-default');
      
      if (!reseauConfig && configs.length === 0) {
        try {
          const defaultConfig: DashboardConfig = {
            id: 'reseau-default',
            name: 'Dashboard Réseau',
            is_default: true,
            layouts: [
              {
                id: 'widget-1',
                widget_type: 'clients-count',
                x: 0,
                y: 0,
                w: 3,
                h: 2,
                config: { 
                  title: 'Total Contacts',
                  period: 'month' 
                },
              },
              {
                id: 'widget-2',
                widget_type: 'clients-growth',
                x: 3,
                y: 0,
                w: 3,
                h: 2,
                config: { 
                  title: 'Croissance du Réseau',
                  period: 'month' 
                },
              },
              {
                id: 'widget-3',
                widget_type: 'testimonials-carousel',
                x: 6,
                y: 0,
                w: 6,
                h: 3,
                config: { 
                  title: 'Témoignages Réseau',
                  period: 'month',
                  filters: { limit: 5 }
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
                  title: 'Évolution du Réseau',
                  period: 'month' 
                },
              },
              {
                id: 'widget-5',
                widget_type: 'notifications',
                x: 6,
                y: 3,
                w: 6,
                h: 2,
                config: { 
                  title: 'Notifications Réseau',
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
          logger.error('Error initializing default reseau dashboard config', error);
        }
      } else if (reseauConfig) {
        // Use existing reseau config
        setActiveConfig(reseauConfig.id);
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
    <DashboardContextProviderComponent context="reseau">
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
          module="reseau"
        />

        {/* Quick Actions FAB */}
        <QuickActions />
      </div>
    </DashboardContextProviderComponent>
  );
}

export default function ReseauDashboardPage() {
  return (
    <ErrorBoundary>
      <ReseauDashboardContent />
    </ErrorBoundary>
  );
}
