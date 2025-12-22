'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Since this page uses useSearchParams (which requires dynamic rendering),
// and it's a Client Component, it will be rendered dynamically automatically.

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken) {
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      }

      // Fetch user info
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      fetch(`${apiUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((user) => {
          login(user, accessToken);
          router.push('/dashboard');
        })
        .catch(() => {
          router.push('/auth/login?error=Failed to get user info');
        });
    } else {
      router.push('/auth/login?error=No access token provided');
    }
  }, [searchParams, router, login]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}