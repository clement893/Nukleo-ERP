/**
 * Authentication Middleware Utilities
 * Reusable middleware functions for API routes and server components
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './index';
import { verifyToken, extractTokenFromHeader } from './jwt';
import type { TokenPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: TokenPayload; response?: NextResponse }> {
  // Try to get session from NextAuth
  const session = await auth();

  if (session?.user) {
    // Session-based authentication
    return {
      user: {
        userId: session.user.id ?? '',
        email: session.user.email ?? '',
        role: (session.user as { role?: string }).role,
      },
    };
  }

  // Try JWT token from Authorization header
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const payload = await verifyToken(token);
    return { user: payload };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<{ user: TokenPayload; response?: NextResponse }> {
  const { user } = await requireAuth(request);

  if (!user.role || !roles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  return { user };
}

/**
 * Optional authentication middleware
 * Returns user if authenticated, null otherwise
 */
export async function optionalAuth(
  request: NextRequest
): Promise<{ user: TokenPayload | null }> {
  try {
    const { user } = await requireAuth(request);
    return { user };
  } catch {
    return { user: null };
  }
}

/**
 * Create authenticated API route handler wrapper
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: TokenPayload }) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const { user } = await requireAuth(request);
      return await handler(request, { user });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Create role-based API route handler wrapper
 */
export function withRole(
  roles: string[],
  handler: (request: NextRequest, context: { user: TokenPayload }) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const { user } = await requireRole(request, roles);
      return await handler(request, { user });
    } catch (error) {
      const status = error instanceof Error && error.message === 'Insufficient permissions' ? 403 : 401;
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Authorization failed',
        },
        { status }
      );
    }
  };
}

