/**
 * Web Vitals Reporting
 * 
 * Reports Core Web Vitals metrics for performance monitoring
 */

export interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  label: string;
  delta?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report Web Vitals metric
 * 
 * Can be extended to send to analytics services (Google Analytics, Vercel Analytics, etc.)
 */
export function reportWebVitals(metric: WebVitalMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.label);
  }

  // Send to analytics service (e.g., Vercel Analytics, Google Analytics)
  if (typeof window !== 'undefined') {
    // Example: Send to Vercel Analytics
    // if (window.va) {
    //   window.va('track', metric.name, metric.value);
    // }

    // Example: Send to Google Analytics
    // if (window.gtag) {
    //   window.gtag('event', metric.name, {
    //     value: Math.round(metric.value),
    //     metric_id: metric.id,
    //     metric_value: metric.value,
    //     metric_delta: metric.delta,
    //   });
    // }

    // Send to custom analytics endpoint
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(() => {
    //   // Ignore errors
    // });
  }
}

