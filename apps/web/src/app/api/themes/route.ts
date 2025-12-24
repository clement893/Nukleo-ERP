/**
 * Next.js API route for theme management (server-side proxy).
 * This allows server-side rendering and better security.
 */
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type { ThemeConfigResponse } from '@modele/types';

/**
 * Get API URL with production fallback
 * Uses Railway production URL in production, localhost in development
 */
const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultUrl = isProduction 
    ? 'https://modelebackend-production-0590.up.railway.app'
    : 'http://localhost:8000';
  
  let url = (process.env.NEXT_PUBLIC_API_URL || defaultUrl).trim();
  
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  return url.replace(/\/$/, ''); // Remove trailing slash
};

const API_URL = getApiUrl();

/**
 * Default theme configuration used when backend is unavailable
 */
const DEFAULT_THEME_CONFIG: ThemeConfigResponse = {
  id: 0,
  name: 'default',
  display_name: 'Default Theme',
  config: {
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    danger_color: '#EF4444',
    warning_color: '#F59E0B',
    info_color: '#06B6D4',
    success_color: '#10B981',
    font_family: 'Inter',
    border_radius: '0.5rem',
  },
};

/**
 * GET /api/themes/active
 * Proxy to backend to get active theme.
 * Public endpoint - no authentication required.
 * Falls back to default theme if backend is unavailable.
 */
export async function GET() {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_URL}/api/v1/themes/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If backend returns an error, use default theme
      logger.warn(`Backend returned ${response.status}. Using default theme.`);
      return NextResponse.json(DEFAULT_THEME_CONFIG);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Handle network errors, timeouts, and connection refused
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.warn('Theme fetch timeout. Using default theme.');
      } else {
        logger.warn('Backend not available. Using default theme.', { message: error.message });
      }
    } else {
      logger.error('Error fetching active theme', error instanceof Error ? error : new Error(String(error)));
    }
    // Return default theme instead of error
    return NextResponse.json(DEFAULT_THEME_CONFIG);
  }
}
