'use client';

/**
 * Dashboard Page - Customizable Dashboard with Drag & Drop Widgets
 * 
 * This is the main dashboard page that replaces the old static dashboard.
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
import type { DashboardConfig } from '@/lib/dashboard/types';

function DashboardContent() {
  const { configs, addConfig, setActiveConfig, loadFromServer } = useDashboardStore();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard configs from server on mount
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Attendre un peu pour que Zustand persist charge d'abord depuis localStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadFromServer();
      } catch (error) {
        console.error('Error loading dashboard from server:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer]);

  // Initialize with default configuration if none exists
  useEffect(() => {
    if (!isLoading && configs.length === 0) {
      const defaultConfig: DashboardConfig = {
        id: 'default',
        name: 'My Dashboard',
        is_default: true,
        layouts: [
          {
            id: 'widget-1',
            widget_type: 'opportunities-list',
            x: 0,
            y: 0,
            w: 4,
            h: 2,
            config: { 
              title: 'Recent Opportunities',
              period: 'month' 
            },
          },
          {
            id: 'widget-2',
            widget_type: 'clients-count',
            x: 4,
            y: 0,
            w: 2,
            h: 1,
            config: { 
              title: 'Total Clients',
              period: 'month' 
            },
          },
          {
            id: 'widget-3',
            widget_type: 'projects-active',
            x: 6,
            y: 0,
            w: 4,
            h: 2,
            config: { 
              title: 'Active Projects',
              period: 'month' 
            },
          },
          {
            id: 'widget-4',
            widget_type: 'revenue-chart',
            x: 0,
            y: 2,
            w: 6,
            h: 2,
            config: { 
              title: 'Revenue Trend',
              period: 'month' 
            },
          },
          {
            id: 'widget-5',
            widget_type: 'kpi-custom',
            x: 6,
            y: 2,
            w: 2,
            h: 1,
            config: { 
              title: 'Monthly Growth',
              period: 'month',
              kpi_name: 'Growth',
              target: 100000,
            },
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addConfig(defaultConfig);
      setActiveConfig(defaultConfig.id);
    }
  }, [configs.length, addConfig, setActiveConfig, isLoading]);

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
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
