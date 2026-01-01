/**
 * Employee Portal Layout
 * 
 * Layout wrapper for employee portal pages.
 * Provides full-width layout with sidebar navigation.
 * 
 * @module EmployeePortalLayout
 */

'use client';

import { useParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/errors';
import { EmployeePortalNavigation } from '@/components/employes/EmployeePortalNavigation';
import { useEffect, useState } from 'react';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import Loading from '@/components/ui/Loading';

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Charger l'employé (le hook useEmployeePortalPermissions gère le cache des permissions)
        const employeeData = await employeesAPI.get(employeeId);
        setEmployee(employeeData);
      } catch (err) {
        handleApiError(err);
        // En cas d'erreur, on continue quand même
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId]);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-muted">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-background border-r border-border p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Mon Portail Employé
            </h2>
            {loading ? (
              <div className="text-sm text-muted-foreground mt-1">
                <Loading size="sm" />
              </div>
            ) : employee ? (
              <p className="text-sm text-muted-foreground mt-1">
                {employee.first_name} {employee.last_name}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Accès aux outils et informations
              </p>
            )}
          </div>
          {employeeId && (
            <ErrorBoundary>
              <EmployeePortalNavigation employeeId={employeeId} />
            </ErrorBoundary>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
