/**
 * ERP Portal Dashboard Page
 * 
 * Main dashboard page for ERP portal with customizable widgets.
 * Widgets are filtered based on employee portal permissions.
 * 
 * @module ERPDashboardPage
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useERPDashboard } from '@/hooks/useERPDashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import type { DashboardConfig } from '@/lib/dashboard/types';

function ERPDashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer } = useERPDashboard();
  const { hasModuleAccess, loading: permissionsLoading } = useEmployeePortalPermissions();
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
        console.error('Error loading dashboard from server:', error);
        // Continue even if server load fails - localStorage data will be used
        if (process.env.NODE_ENV === 'development') {
          console.error('Dashboard load error details:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default configuration if none exists
  useEffect(() => {
    if (!isLoading && !permissionsLoading && configs.length === 0) {
      try {
        const defaultConfig: DashboardConfig = {
          id: 'erp-default',
          name: 'Mon Tableau de Bord',
          is_default: true,
          layouts: [
            {
              id: 'widget-1',
              widget_type: 'tasks-list',
              x: 0,
              y: 0,
              w: 4,
              h: 2,
              config: { 
                title: 'Mes Tâches',
                period: 'month' 
              },
            },
            {
              id: 'widget-2',
              widget_type: 'employees-count',
              x: 4,
              y: 0,
              w: 2,
              h: 1,
              config: { 
                title: 'Équipe',
                period: 'month' 
              },
            },
            {
              id: 'widget-3',
              widget_type: 'notifications',
              x: 6,
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
              widget_type: 'user-profile',
              x: 9,
              y: 0,
              w: 2,
              h: 2,
              config: {},
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        addConfig(defaultConfig);
        setActiveConfig(defaultConfig.id);
      } catch (error) {
        console.error('Error initializing default dashboard config:', error);
      }
    }
  }, [configs.length, addConfig, setActiveConfig, isLoading, permissionsLoading]);

  if (isLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-bg-subtle">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Tableau de Bord
        </h1>
        <p className="text-muted-foreground">
          Personnalisez votre tableau de bord avec les widgets qui vous intéressent.
        </p>
      </div>

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
        hasModuleAccess={hasModuleAccess}
      />
    </div>
  );
}

export default function ERPDashboardPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <ERPDashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
