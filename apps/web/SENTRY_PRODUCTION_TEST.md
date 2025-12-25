# Sentry Production Testing Guide

Test Sentry error tracking on your production environment.

## 🚀 Production URLs

- **Frontend**: https://modele-nextjs-fullstack-production-1e92.up.railway.app
- **Backend**: https://modelebackend-production-0590.up.railway.app

## 🧪 Testing Methods

### Method 1: Use the Test Page (Easiest)

1. **Visit the test page:**
   ```
   https://modele-nextjs-fullstack-production-1e92.up.railway.app/test-sentry
   ```

2. **Click the test buttons:**
   - "Test Error Exception" - Sends a handled error
   - "Test Message" - Sends a message
   - "Test Async Error" - Tests async errors
   - "Test Unhandled Error" - Triggers error boundary

3. **Check Sentry Dashboard:**
   - Go to https://sentry.io
   - Click "Issues"
   - Errors should appear within 5-10 seconds

### Method 2: Browser Console Test

1. **Open your production site:**
   ```
   https://modele-nextjs-fullstack-production-1e92.up.railway.app
   ```

2. **Open Developer Tools** (F12)

3. **Go to Console tab**

4. **Type and press Enter:**
   ```javascript
   throw new Error('Production Sentry Test - ' + new Date().toISOString())
   ```

5. **Check Sentry Dashboard** - Error should appear

### Method 3: Visit Non-Existent Page

1. **Visit a page that doesn't exist:**
   ```
   https://modele-nextjs-fullstack-production-1e92.up.railway.app/test-error-12345
   ```

2. **Check Sentry** for 404/error events

### Method 4: Check Monitoring Dashboards

1. **Error Dashboard:**
   ```
   https://modele-nextjs-fullstack-production-1e92.up.railway.app/monitoring/errors
   ```

2. **Performance Dashboard:**
   ```
   https://modele-nextjs-fullstack-production-1e92.up.railway.app/monitoring/performance
   ```

## ✅ Verification Checklist

- [ ] Test page loads correctly
- [ ] Test buttons work
- [ ] Errors appear in Sentry dashboard
- [ ] Errors show production environment tag
- [ ] Stack traces are readable
- [ ] Performance metrics appear

## 🔍 What to Check in Sentry

1. **Environment Tag:**
   - Should show "production" (not "development")

2. **Error Details:**
   - Stack trace
   - Browser/OS info
   - Production URL
   - User agent

3. **Performance:**
   - Web Vitals metrics
   - Page load times
   - API response times

4. **Release Version:**
   - Should show "1.0.0" (or whatever you set)

## 🐛 Troubleshooting

### Errors Not Appearing

1. **Verify Environment Variables:**
   - Check Railway dashboard → Variables
   - Ensure all Sentry variables are set
   - Verify DSN is correct

2. **Check Sentry Dashboard:**
   - Go to Settings → Projects → Your Project
   - Verify project is active
   - Check if there are any filters blocking errors

3. **Verify Deployment:**
   - Make sure you redeployed after adding variables
   - Check Railway deployment logs for errors

4. **Check Browser Console:**
   - Open DevTools → Console
   - Look for Sentry initialization errors
   - Check Network tab for Sentry requests

### Performance Metrics Not Showing

1. **Wait a few minutes** - Metrics take time to collect
2. **Check Sentry Performance tab** - Not just Issues
3. **Verify sampling rate** - Should be 10% in production

## 📊 Production Monitoring

Once set up, you can:

1. **Monitor Real Errors:**
   - Check Sentry Issues daily
   - Set up alerts for critical errors
   - Track error trends

2. **Monitor Performance:**
   - Track Core Web Vitals
   - Identify slow pages
   - Optimize based on data

3. **Track Releases:**
   - Update SENTRY_RELEASE with each deployment
   - See which version has errors
   - Rollback if needed

## 🔔 Setting Up Alerts (Optional)

1. **Go to Sentry Dashboard**
2. **Click "Alerts"** in left sidebar
3. **Create Alert Rule:**
   - Trigger: When an issue is created
   - Conditions: Error level = error
   - Actions: Send email/Slack notification

## 🎯 Quick Test Commands

### Test Error (Browser Console)
```javascript
throw new Error('Production Test - ' + new Date().toISOString())
```

### Test with Fetch Error
```javascript
fetch('/api/non-existent-endpoint').catch(err => {
  console.error('Test error:', err);
  throw err;
});
```

### Test Performance
```javascript
// This will be automatically tracked
performance.mark('test-start');
setTimeout(() => {
  performance.mark('test-end');
  performance.measure('test', 'test-start', 'test-end');
}, 1000);
```

