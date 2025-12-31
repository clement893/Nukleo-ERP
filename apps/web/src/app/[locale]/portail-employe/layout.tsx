/**
 * Employee Portal Layout
 * 
 * Layout wrapper for employee portal pages.
 * Provides full-width layout with sidebar navigation.
 * 
 * @module EmployeePortalLayout
 */

'use client';

import { ErrorBoundary } from '@/components/errors';
import { ERPNavigation } from '@/components/erp';

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-muted">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-background border-r border-border p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Portail Employé
            </h2>
            <p className="text-sm text-muted-foreground">
              Accès aux outils et informations
            </p>
          </div>
          <ErrorBoundary>
            <ERPNavigation />
          </ErrorBoundary>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
