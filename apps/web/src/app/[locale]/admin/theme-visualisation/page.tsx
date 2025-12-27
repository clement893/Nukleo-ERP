'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';
import Container from '@/components/ui/Container';
import { ThemeVisualisationContent } from './ThemeVisualisationContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ThemeVisualisationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get('themeId');

  useEffect(() => {
    // Redirect to themeId=32 if no themeId is provided
    if (!themeId) {
      const currentPath = window.location.pathname;
      router.replace(`${currentPath}?themeId=32`);
    }
  }, [themeId, router]);

  // Show loading state during redirect
  if (!themeId) {
    return (
      <ProtectedSuperAdminRoute>
        <Container className="py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">Redirection...</p>
            </div>
          </div>
        </Container>
      </ProtectedSuperAdminRoute>
    );
  }

  return (
    <ProtectedSuperAdminRoute>
      <Container className="py-8">
        <ThemeVisualisationContent />
      </Container>
    </ProtectedSuperAdminRoute>
  );
}

