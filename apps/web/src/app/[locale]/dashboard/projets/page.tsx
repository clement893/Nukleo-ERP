'use client';

/**
 * Dashboard Projets Page - Customizable Dashboard with Drag & Drop Widgets
 * 
 * This is the projects dashboard page with widgets specific to the projects module.
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
import { useProjectsDashboard } from '@/hooks/useProjectsDashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import QuickActions from '@/components/ui/QuickActions';
import type { DashboardConfig } from '@/lib/dashboard/types';
import { logger } from '@/lib/logger';
import { DashboardContextProviderComponent } from '@/contexts/DashboardContext';

function ProjectsDashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer, getConfigById } = useProjectsDashboard();
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
        logger.error('Error loading projects dashboard from server', error);
        // Continue even if server load fails - localStorage data will be used
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default projects configuration if none exists
  useEffect(() => {
    if (!isLoading) {
      // Check if there's already a projects dashboard config
      const projectsConfig = configs.find(c => c.id === 'projects-default');
      
      if (!projectsConfig && configs.length === 0) {
        try {
          const defaultConfig: DashboardConfig = {
            id: 'projects-default',
            name: 'Dashboard Projets',
            is_default: true,
            layouts: [
              {
                id: 'widget-1',
                widget_type: 'projects-active',
                x: 0,
                y: 0,
                w: 4,
                h: 2,
                config: { 
                  title: 'Projets Actifs',
                  period: 'month' 
                },
              },
              {
                id: 'widget-2',
                widget_type: 'projects-status',
                x: 4,
                y: 0,
                w: 4,
                h: 2,
                config: { 
                  title: 'Statut des Projets',
                  period: 'month' 
                },
              },
              {
                id: 'widget-3',
                widget_type: 'tasks-kanban',
                x: 8,
                y: 0,
                w: 4,
                h: 3,
                config: { 
                  title: 'Tâches',
                  period: 'month' 
                },
              },
              {
                id: 'widget-4',
                widget_type: 'tasks-list',
                x: 0,
                y: 2,
                w: 6,
                h: 3,
                config: { 
                  title: 'Liste des Tâches',
                  period: 'month',
                  filters: { limit: 10 }
                },
              },
              {
                id: 'widget-5',
                widget_type: 'growth-chart',
                x: 6,
                y: 2,
                w: 6,
                h: 3,
                config: { 
                  title: 'Évolution des Projets',
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
          logger.error('Error initializing default projects dashboard config', error);
        }
      } else if (projectsConfig) {
        // Use existing projects config
        setActiveConfig(projectsConfig.id);
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
    <DashboardContextProviderComponent context="projects">
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
          module="projects"
        />

        {/* Quick Actions FAB */}
        <QuickActions />
      </div>
    </DashboardContextProviderComponent>
  );
}

export default function ProjectsDashboardPage() {
  return (
    <ErrorBoundary>
      <ProjectsDashboardContent />
    </ErrorBoundary>
  );
}
