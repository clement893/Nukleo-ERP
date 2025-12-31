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

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-muted">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-background border-r border-border p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Mon Portail Employé
            </h2>
            <p className="text-sm text-muted-foreground">
              Accès aux outils et informations
            </p>
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
