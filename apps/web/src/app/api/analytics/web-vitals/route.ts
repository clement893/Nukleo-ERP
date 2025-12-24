/**
 * Web Vitals Analytics Endpoint
 * Receives and stores Web Vitals metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, type LogContext } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, delta, id, navigationType } = body;

    // Validate Web Vitals data
    if (!name || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid Web Vitals data' },
        { status: 400 }
      );
    }

    // Log Web Vitals (in production, send to analytics service)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to analytics service (e.g., Google Analytics, Sentry, custom)
      const webVitalsContext: LogContext = {
        name,
        value,
        rating,
        delta,
        id,
        navigationType,
        timestamp: new Date().toISOString(),
      };
      logger.performance('Web Vitals', webVitalsContext);
    }

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Web Vitals API Error', error, {});
    return NextResponse.json(
      { error: 'Failed to process Web Vitals' },
      { status: 500 }
    );
  }
}

