/**
 * Token Refresh API Route
 * Refreshes access tokens using refresh tokens
 */

import { NextResponse } from 'next/server';
import { createAccessToken, verifyToken, type TokenPayload } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    // Create new access token
    const accessToken = await createAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Return new tokens
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken, // Return same refresh token (or generate new one if needed)
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      },
      { status: 401 }
    );
  }
}

