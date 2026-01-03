/**
 * Admin Widgets and Collections Management Page
 * 
 * Page for managing dashboard widgets and collections in the admin panel.
 */

'use client';

import { PageHeader, PageContainer } from '@/components/layout';
import { WidgetsCollectionsManager } from '@/components/admin/WidgetsCollectionsManager';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

export default function AdminWidgetsManagementPage() {
  return (
    <ProtectedRoute requireAdmin>
      <ErrorBoundary>
        <PageContainer>
          <PageHeader
            title="Gestion des Widgets et Collections"
            description="Gérez les widgets et collections du dashboard"
            breadcrumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Admin', href: '/admin' },
              { label: 'Widgets & Collections' },
            ]}
          />

          <div className="mt-8">
            <WidgetsCollectionsManager />
          </div>
        </PageContainer>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
