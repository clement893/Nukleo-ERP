/**
 * Next.js Middleware
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
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

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
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

  return NextResponse.next();
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

