/**
 * Next.js API route for theme management (server-side proxy).
 * This allows server-side rendering and better security.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getActiveTheme } from '@/lib/api/theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * GET /api/themes/active
 * Proxy to backend to get active theme.
 * Public endpoint - no authentication required.
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/api/v1/themes/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch active theme' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching active theme:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

