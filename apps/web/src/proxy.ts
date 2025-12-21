/**
 * Next.js Proxy (formerly Middleware)
 * Handles authentication, route protection, and performance optimizations
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signout',
    '/auth/error',
    '/api/auth',
    '/api/public',
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Protected routes - require authentication (skip for public routes)
  if (!isPublicRoute) {
    const session = await auth();

    if (!session) {
      // Redirect to sign in if not authenticated
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check for role-based access control
    const protectedRoutes: Record<string, string[]> = {
      '/admin': ['admin'],
      '/dashboard': ['admin', 'user'],
    };

    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        const userRole = session.user?.role ?? 'user';
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }
  }

  const response = NextResponse.next();

  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Cache static assets
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache images
  if (
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Prefetch DNS for external domains
  if (request.nextUrl.pathname === '/') {
    const linkHeader = [
      '<https://fonts.googleapis.com>; rel=dns-prefetch',
      '<https://fonts.gstatic.com>; rel=dns-prefetch',
    ].join(', ');
    response.headers.set('Link', linkHeader);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};