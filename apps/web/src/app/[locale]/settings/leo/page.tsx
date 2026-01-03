/**
 * Leo Settings Page
 * 
 * Page for managing Leo AI assistant settings
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useRouter } from 'next/navigation';
import { PageHeader, PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import LeoSettings from '@/components/settings/LeoSettings';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

export default function LeoSettingsPage() {
  const router = useRouter();

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
          actions={
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/leo')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au chat
            </Button>
          }
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
