/**
 * Protected API Route Example
 * Demonstrates how to use authentication middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';

async function handler(request: NextRequest, { user }: { user: { userId: string; email: string } }) {
  return NextResponse.json({
    success: true,
    message: 'This is a protected route',
    user: {
      id: user.userId,
      email: user.email,
    },
  });
}

export const GET = withAuth(handler);

