/**
 * Service Worker Registration
 * Registers and manages service worker for offline support and caching
 */

const isProduction = process.env.NODE_ENV === 'production';
const SW_PATH = '/sw.js';

/**
 * Register service worker
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  // Only register in production or when explicitly enabled
  if (!isProduction && process.env.NEXT_PUBLIC_ENABLE_SW !== 'true') {
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(SW_PATH, {
          scope: '/',
        })
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[SW] New service worker available');
                  // Optionally show update notification to user
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    });

    // Handle service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service Worker controller changed');
      // Optionally reload page to use new service worker
      // window.location.reload();
    });
  }
}

/**
 * Unregister service worker
 */
export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister().then((success) => {
      if (success) {
        console.log('[SW] Service Worker unregistered');
      }
    });
  });
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

