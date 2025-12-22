/**
 * Sentry Client Configuration
 * Error tracking and monitoring
 * Sentry is optional - functions will no-op if @sentry/nextjs is not installed
 */

let Sentry: typeof import('@sentry/nextjs') | null = null;

// Try to load Sentry, but don't fail if it's not installed
try {
  // @ts-expect-error - Sentry is optional
  Sentry = require('@sentry/nextjs');
} catch {
  // Sentry not installed, continue without it
}

export function initSentry() {
  if (!Sentry || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (typeof window === 'undefined') {
    // Server-side initialization
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });
  } else {
    // Client-side initialization
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/.*\.sentry\.io\/api/,
            process.env.NEXT_PUBLIC_API_URL || '',
          ],
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!Sentry) return;
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info') {
  if (!Sentry) return;
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (!Sentry) return;
  Sentry.setUser(user);
}

export function clearUser() {
  if (!Sentry) return;
  Sentry.setUser(null);
}

