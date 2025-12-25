/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 * 
 * Use this to initialize monitoring, validate environment variables, etc.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side only
    const { validateAndLogEnvironmentVariables } = await import('@/lib/utils/envValidation');
    
    // Initialize Sentry server-side
    // Note: Sentry is automatically initialized via sentry.server.config.ts
    // This is just a placeholder for any additional server-side initialization
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry will be initialized automatically by @sentry/nextjs
      // No manual initialization needed here
    }
    
    // Validate environment variables on server startup
    validateAndLogEnvironmentVariables();
  }
}

