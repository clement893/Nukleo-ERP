/**
 * Next.js Instrumentation
 * Pour Sentry et autres outils de monitoring
 */

export async function register() {
  // Check if Sentry is installed before trying to import configs
  let sentryInstalled = false;
  try {
    await import('@sentry/nextjs');
    sentryInstalled = true;
  } catch {
    // Sentry not installed, skip initialization
    return;
  }

  // Only import Sentry configs if Sentry is installed
  if (!sentryInstalled) {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await import('../sentry.server.config');
    } catch {
      // Config file not found, skip silently
      // This is expected when Sentry config files don't exist
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    try {
      await import('../sentry.edge.config');
    } catch {
      // Config file not found, skip silently
      // This is expected when Sentry config files don't exist
    }
  }
}

