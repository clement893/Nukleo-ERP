# Sentry Testing Guide

Quick guide to test your Sentry error tracking and performance monitoring.

## 🧪 Test Methods

### Method 1: Browser Console (Easiest)

1. **Open your app** (local or production)
2. **Open Developer Tools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Type this and press Enter:**
   ```javascript
   throw new Error('Sentry Test Error - ' + new Date().toISOString())
   ```
5. **Check Sentry Dashboard** - Error should appear within 5-10 seconds

### Method 2: Test Error Page

1. **Visit a non-existent page:**
   - Local: `http://localhost:3000/test-error-page-12345`
   - Production: `https://your-domain.com/test-error-page-12345`
2. **Check Sentry Dashboard** for the 404/error

### Method 3: Use the Error Dashboard

1. **Visit the error dashboard:**
   - Local: `http://localhost:3000/monitoring/errors`
   - Production: `https://your-domain.com/monitoring/errors`
2. **View error statistics**

### Method 4: Programmatic Test

Add this to any page temporarily:

```typescript
// In a component or page
import { captureException } from '@/lib/monitoring/sentry';

// Test error
captureException(new Error('Test error from code'), {
  tags: { test: true },
  extra: { timestamp: new Date().toISOString() },
});
```

### Method 5: Performance Test

1. **Visit performance dashboard:**
   - Local: `http://localhost:3000/monitoring/performance`
   - Production: `https://your-domain.com/monitoring/performance`
2. **Wait a few seconds** for metrics to populate
3. **Check Sentry Dashboard → Performance** tab

## ✅ Verification Checklist

- [ ] Error appears in Sentry dashboard
- [ ] Error shows correct stack trace
- [ ] Error shows browser/environment info
- [ ] Performance metrics appear in Sentry
- [ ] Error dashboard shows statistics
- [ ] Performance dashboard shows Web Vitals

## 🔍 What to Check in Sentry

1. **Error Details:**
   - Stack trace is readable
   - Browser/OS information
   - URL where error occurred
   - User agent

2. **Performance:**
   - Web Vitals metrics
   - Page load times
   - API response times

3. **Context:**
   - Environment (development/production)
   - Release version
   - User information (if set)

