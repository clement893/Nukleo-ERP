/**
 * Sentry Client Configuration
 * This file configures Sentry for the browser/client-side
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    
    // Enable debug mode in development to see what's happening
    debug: SENTRY_ENVIRONMENT === 'development' && process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',
    
    // Performance Monitoring
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Replay (optional - can be expensive)
    replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always record sessions with errors
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (SENTRY_ENVIRONMENT === 'development' && process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV !== 'true') {
        return null;
      }
    
    // Filter out known non-critical errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore network errors that are likely user-related (offline, etc.)
      if (
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed')
      ) {
        return null;
      }
      
      // Ignore ResizeObserver errors (common browser quirk)
      if (error.message.includes('ResizeObserver loop')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Ignore specific URLs
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    'conduitPage',
    
    // Network errors
    'NetworkError',
    'Failed to fetch',
    
    // ResizeObserver
    'ResizeObserver loop',
  ],
  
  // Set user context
  initialScope: {
    tags: {
      component: 'client',
    },
  },
});
