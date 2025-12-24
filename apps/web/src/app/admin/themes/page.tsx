'use client';

import { ThemeManager } from '@/components/admin/themes/ThemeManager';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';
import Container from '@/components/ui/Container';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { useState, useEffect } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminThemesPage() {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Get token from storage
    const authToken = TokenStorage.getToken();
    if (authToken) {
      setToken(authToken);
    }
  }, []);

  return (
    <ProtectedSuperAdminRoute>
      <Container className="py-8">
        <ThemeManager authToken={token} />
      </Container>
    </ProtectedSuperAdminRoute>
  );
}

