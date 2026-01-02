'use client';

/**
 * Dashboard Page - Portail Employé avec Widgets Personnalisables
 * 
 * Dashboard personnalisable pour le portail employé avec:
 * - Drag & drop widgets
 * - Customizable layouts
 * - Sauvegarde sur serveur
 * - Widgets spécifiques employé (tâches, heures, projets, vacances)
 * 
 * @page
 */

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';
import { EmployeePortalDashboardGrid } from '@/components/dashboard/EmployeePortalDashboardGrid';
import { EmployeePortalDashboardToolbar } from '@/components/dashboard/EmployeePortalDashboardToolbar';
import { EmployeePortalWidgetLibrary } from '@/components/dashboard/EmployeePortalWidgetLibrary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { Loader2 } from 'lucide-react';
import type { DashboardConfig } from '@/lib/dashboard/types';
import { logger } from '@/lib/logger';

function EmployeePortalDashboardContent() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const { 
    configs, 
    addConfig, 
    setActiveConfig, 
    loadFromServer,
    setEmployeeId,
    setGlobalFilters,
  } = useEmployeePortalDashboardStore();
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Set employee ID in store and global filters
  useEffect(() => {
    if (employeeId) {
      setEmployeeId(employeeId);
      setGlobalFilters({ employee_id: employeeId });
    }
  }, [employeeId, setEmployeeId, setGlobalFilters]);

  // Load dashboard configs from server on mount
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Load employee data
        if (employeeId) {
          const empData = await employeesAPI.get(employeeId);
          setEmployee(empData);
        }
        
        // Attendre un peu pour que Zustand persist charge d'abord depuis localStorage
        await new Promise(resolve => setTimeout(resolve, 200));
        await loadFromServer();
      } catch (error) {
        logger.error('Error loading dashboard from server', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [loadFromServer, employeeId]);

  // Initialize with default configuration if none exists
  useEffect(() => {
    if (!isLoading && configs.length === 0) {
      try {
        const defaultConfig: DashboardConfig = {
          id: 'default',
          name: 'Mon Dashboard',
          is_default: true,
          layouts: [
            {
              id: 'widget-1',
              widget_type: 'employee-tasks' as any,
              x: 0,
              y: 0,
              w: 4,
              h: 3,
              config: { 
                title: 'Mes Tâches',
                period: 'month' 
              },
            },
            {
              id: 'widget-2',
              widget_type: 'employee-hours' as any,
              x: 4,
              y: 0,
              w: 3,
              h: 2,
              config: { 
                title: 'Mes Heures',
                period: 'week' 
              },
            },
            {
              id: 'widget-3',
              widget_type: 'employee-projects' as any,
              x: 7,
              y: 0,
              w: 3,
              h: 2,
              config: { 
                title: 'Mes Projets',
                period: 'month' 
              },
            },
            {
              id: 'widget-4',
              widget_type: 'employee-vacations' as any,
              x: 10,
              y: 0,
              w: 2,
              h: 2,
              config: { 
                title: 'Mes Vacances',
                period: 'month' 
              },
            },
            {
              id: 'widget-5',
              widget_type: 'tasks-list' as any,
              x: 0,
              y: 3,
              w: 6,
              h: 3,
              config: { 
                title: 'Liste des Tâches',
                period: 'month' 
              },
            },
            {
              id: 'widget-6',
              widget_type: 'kpi-custom' as any,
              x: 6,
              y: 3,
              w: 2,
              h: 1,
              config: { 
                title: 'Productivité',
                period: 'month',
                kpi_name: 'Productivité',
                target: 100,
              },
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        addConfig(defaultConfig);
        setActiveConfig(defaultConfig.id);
      } catch (error) {
        logger.error('Error initializing default dashboard config', error);
      }
    }
  }, [configs.length, addConfig, setActiveConfig, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-bg-subtle">
      {/* Hero Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Bonjour, {employee?.first_name || 'Employé'} !
              </h1>
              <p className="text-white/80 text-sm">Votre tableau de bord personnalisé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <EmployeePortalDashboardToolbar onAddWidget={() => setIsLibraryOpen(true)} />

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6 spacing-generous">
        <EmployeePortalDashboardGrid />
      </div>

      {/* Widget Library Modal */}
      <EmployeePortalWidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </div>
  );
}

export default function EmployeePortalDashboardPage() {
  return (
    <ErrorBoundary>
      <EmployeePortalDashboardContent />
    </ErrorBoundary>
  );
}
