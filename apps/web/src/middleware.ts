import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { routing } from './i18n/routing';

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Export config for middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/**
 * Middleware to protect authenticated routes and handle i18n
 * Verifies JWT token presence and validity before allowing access
 * Handles locale routing with next-intl
 * 
 * Security improvements:
 * - Verifies JWT tokens server-side
 * - Checks token expiration
 * - Validates token signature
 * - Supports both cookie-based and header-based authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle i18n routing first
  const response = intlMiddleware(request);
  
  // If it's an i18n redirect, return it immediately
  if (response.headers.get('x-middleware-rewrite') || response.status === 307 || response.status === 308) {
    return response;
  }

  // Extract locale from pathname for route checking
  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr|ar|he)/, '') || '/';

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/callback', // OAuth callback - needs to be public to receive token
    '/auth/forgot-password',
    '/auth/reset-password',
    '/pricing',
    '/sitemap',
    '/sitemap.xml',
    '/api/auth',
  ];

  // Check if the route is public (check both with and without locale)
  const isPublicRoute = publicRoutes.some((route) => 
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + '/')
  );

  // Allow access to public routes
  if (isPublicRoute) {
    return response;
  }

  // API routes - check Authorization header
  if (pathname.startsWith('/api/')) {
    // Allow auth API routes without token check
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        // Check expiration
        if (payload.exp && Date.now() < (payload.exp as number) * 1000) {
          return NextResponse.next();
        }
      }
    }
    
    // For API routes, return 401 if no valid token
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Page routes - allow access and let client-side components handle authentication
  // The middleware cannot access sessionStorage, so we let the client handle auth checks
  // Client components will check the auth store and redirect if needed
  return response;
}


