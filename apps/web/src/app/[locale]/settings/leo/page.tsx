/**
 * Leo Settings Page
 * 
 * Page for managing Leo AI assistant settings
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader, PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import LeoSettings from '@/components/settings/LeoSettings';

export default function LeoSettingsPage() {
  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title="Paramètres Leo"
          description="Personnalisez le comportement et le style de votre assistant IA Leo"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Paramètres', href: '/settings' },
            { label: 'Leo' },
          ]}
        />

        <div className="mt-8">
          <ErrorBoundary>
            <LeoSettings />
          </ErrorBoundary>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
