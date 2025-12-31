/**
 * Employee Portal Layout
 * 
 * Layout wrapper for employee portal pages.
 * Provides full-width layout without container constraints.
 * 
 * @module EmployeePortalLayout
 */

'use client';

import { ErrorBoundary } from '@/components/errors';

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full bg-background">
        {children}
      </div>
    </ErrorBoundary>
  );
}
