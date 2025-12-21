/**
 * JWT Token Management
 * Utilities for creating, verifying, and managing JWT tokens
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'default-secret-change-in-production');

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Create a JWT access token
 */
export async function createAccessToken(payload: TokenPayload): Promise<string> {
  const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES ?? '15m';
  const expirationTime = parseExpiration(expiresIn);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setIssuer(process.env.JWT_ISSUER ?? 'modele-app')
    .setAudience(process.env.JWT_AUDIENCE ?? 'modele-users')
    .sign(secret);
}

/**
 * Create a JWT refresh token
 */
export async function createRefreshToken(payload: TokenPayload): Promise<string> {
  const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRES ?? '30d';
  const expirationTime = parseExpiration(expiresIn);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setIssuer(process.env.JWT_ISSUER ?? 'modele-app')
    .setAudience(process.env.JWT_AUDIENCE ?? 'modele-users')
    .sign(secret);
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: process.env.JWT_ISSUER ?? 'modele-app',
      audience: process.env.JWT_AUDIENCE ?? 'modele-users',
    });

    return payload as TokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a JWT token without verification (use with caution)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1] ?? '', 'base64').toString('utf-8')
    ) as TokenPayload;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
}

/**
 * Parse expiration string to seconds
 */
function parseExpiration(expiration: string): string {
  // Support formats like "15m", "1h", "7d", "30d"
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return '15m'; // Default to 15 minutes
  }

  const value = Number.parseInt(match[1] ?? '15', 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const seconds = value * (multipliers[unit] ?? 60);
  return `${seconds}s`;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] ?? null;
}

