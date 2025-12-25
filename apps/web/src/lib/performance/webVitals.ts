/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and other performance metrics
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

export interface WebVitalsReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Send Web Vitals to analytics endpoint and Sentry
 */
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Send to Sentry for performance monitoring
  if (typeof window !== 'undefined') {
    // Use dynamic import to avoid bundling issues
    import('@sentry/nextjs')
      .then((Sentry) => {
        // Track performance metric in Sentry
        // Note: MetricOptions only supports 'unit', not 'tags'
        Sentry.metrics.distribution(`web_vital.${metric.name.toLowerCase()}`, metric.value, {
          unit: 'millisecond',
        });

        // If metric is poor, capture as an issue
        if (metric.rating === 'poor') {
          Sentry.captureMessage(`Poor ${metric.name} performance`, {
            level: 'warning',
            tags: {
              metric: metric.name,
              rating: metric.rating,
              value: metric.value.toString(),
            },
            extra: {
              delta: metric.delta,
              id: metric.id,
              navigationType: metric.navigationType,
            },
          });
        }
      })
      .catch(() => {
        // Sentry not available or not configured - silently fail
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Web Vitals] Sentry not configured');
        }
      });
  }

  // Send to analytics endpoint (defaults to internal endpoint)
  const analyticsEndpoint = 
    process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || 
    '/api/analytics/web-vitals';

  if (typeof window !== 'undefined') {
    fetch(analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true, // Keep request alive even after page unload
    }).catch((error) => {
      // Silently fail - don't break the app if analytics fails
      if (process.env.NODE_ENV === 'development') {
        console.error('[Web Vitals] Failed to send:', error);
      }
    });
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') {
    return;
  }

  // Core Web Vitals
  onCLS(sendToAnalytics); // Cumulative Layout Shift
  onFID(sendToAnalytics); // First Input Delay (deprecated, use INP)
  onFCP(sendToAnalytics); // First Contentful Paint
  onLCP(sendToAnalytics); // Largest Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
  onINP(sendToAnalytics); // Interaction to Next Paint (replaces FID)
}

/**
 * Get performance metrics summary
 */
export function getPerformanceSummary(): Promise<{
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;
}> {
  return new Promise((resolve) => {
    const metrics: Record<string, number> = {};

    const handleMetric = (metric: Metric) => {
      metrics[metric.name.toLowerCase()] = metric.value;
      
      // Resolve when we have all core metrics
      if (metrics.lcp && metrics.fcp && metrics.ttfb) {
        resolve({
          lcp: metrics.lcp || null,
          fid: metrics.fid || null,
          cls: metrics.cls || null,
          fcp: metrics.fcp || null,
          ttfb: metrics.ttfb || null,
          inp: metrics.inp || null,
        });
      }
    };

    // Set timeout to resolve even if not all metrics are available
    setTimeout(() => {
      resolve({
        lcp: metrics.lcp || null,
        fid: metrics.fid || null,
        cls: metrics.cls || null,
        fcp: metrics.fcp || null,
        ttfb: metrics.ttfb || null,
        inp: metrics.inp || null,
      });
    }, 10000); // 10 second timeout

    onCLS(handleMetric);
    onFID(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  });
}
