# Sentry Setup - Step by Step Guide

Follow these steps to set up Sentry error tracking and performance monitoring for your application.

## Step 1: Create a Sentry Account

1. **Go to Sentry.io**
   - Open your browser and navigate to: https://sentry.io

2. **Sign Up**
   - Click the **"Sign Up"** button (top right)
   - Choose one of the sign-up options:
     - Sign up with GitHub (recommended)
     - Sign up with Google
     - Sign up with email

3. **Complete Registration**
   - Fill in your details if using email
   - Verify your email if required
   - You'll be redirected to the Sentry dashboard

## Step 2: Create a New Project

1. **Start Project Creation**
   - In the Sentry dashboard, click **"Create Project"** or **"Start Setup"**
   - If you see a welcome screen, click **"Create Project"**

2. **Select Platform**
   - Choose **"Next.js"** from the list of platforms
   - If Next.js is not visible, search for it in the search bar

3. **Configure Project**
   - **Project Name**: Enter a name (e.g., "MODELE-NEXTJS-FULLSTACK" or "My App")
   - **Team**: Select your team (or create one if needed)
   - Click **"Create Project"**

4. **Skip SDK Installation**
   - You'll see installation instructions - **SKIP THIS** (we've already installed it)
   - Click **"Skip this step"** or close the modal

## Step 3: Get Your DSN (Data Source Name)

1. **Navigate to Project Settings**
   - In your Sentry dashboard, go to **Settings** (gear icon in the left sidebar)
   - Click **"Projects"** in the settings menu
   - Click on your project name

2. **Find Client Keys (DSN)**
   - In the project settings, look for **"Client Keys (DSN)"** in the left sidebar
   - Click on it

3. **Copy Your DSN**
   - You'll see a DSN that looks like:
     ```
     https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxx
     ```
   - Click the **"Copy"** button next to the DSN
   - **Save this DSN** - you'll need it in the next step

## Step 4: Configure Environment Variables

1. **Navigate to Your Project**
   ```bash
   cd C:\Users\cleme\MODELE-NEXTJS-FULLSTACK\apps\web
   ```

2. **Create or Edit `.env.local`**
   - Check if `.env.local` exists:
     ```bash
     ls .env.local
     ```
   - If it doesn't exist, create it:
     ```bash
     copy .env.example .env.local
     ```
   - Or create it manually

3. **Add Sentry Configuration**
   Open `.env.local` in your editor and add these lines (replace `YOUR_DSN_HERE` with the DSN you copied):

   ```env
   # Sentry Error Tracking & Performance Monitoring
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxx
   SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxx
   SENTRY_ENVIRONMENT=development
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
   
   # Optional: Set to 'true' to enable Sentry in development mode
   SENTRY_ENABLE_DEV=false
   NEXT_PUBLIC_SENTRY_ENABLE_DEV=false
   
   # Optional: Set to 'true' for verbose Sentry logging
   SENTRY_DEBUG=false
   ```

4. **Save the File**
   - Make sure to save `.env.local` with your actual DSN

## Step 5: Verify Configuration Files

The Sentry configuration files are already created. Let's verify they exist:

1. **Check Configuration Files**
   ```bash
   ls sentry.*.config.ts
   ```
   
   You should see:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`

2. **Verify They're Correct**
   - These files are already configured correctly
   - They will automatically use your DSN from environment variables

## Step 6: Test the Setup

1. **Start Development Server**
   ```bash
   cd C:\Users\cleme\MODELE-NEXTJS-FULLSTACK
   pnpm dev
   ```

2. **Enable Sentry in Development (Optional)**
   - To test error tracking in development, edit `.env.local`:
     ```env
     SENTRY_ENABLE_DEV=true
     NEXT_PUBLIC_SENTRY_ENABLE_DEV=true
     ```
   - Restart your dev server

3. **Test Error Tracking**
   - Open your browser and go to: http://localhost:3000
   - Navigate to `/monitoring/errors` to see the error dashboard
   - To trigger a test error, you can:
     - Use the browser console: `throw new Error('Test error')`
     - Or visit a non-existent page to trigger a 404

4. **Check Sentry Dashboard**
   - Go back to your Sentry dashboard
   - Click on **"Issues"** in the left sidebar
   - You should see your test error appear within a few seconds

## Step 7: Test Performance Monitoring

1. **View Performance Dashboard**
   - Navigate to: http://localhost:3000/monitoring/performance
   - You should see Web Vitals metrics being tracked

2. **Check Performance in Sentry**
   - In Sentry dashboard, go to **"Performance"** in the left sidebar
   - You should see performance transactions being recorded

## Step 8: Configure Production Settings

When deploying to production:

1. **Set Production Environment Variables**
   ```env
   SENTRY_ENVIRONMENT=production
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
   SENTRY_RELEASE=1.0.0  # Your app version
   NEXT_PUBLIC_SENTRY_RELEASE=1.0.0
   ```

2. **Disable Development Mode**
   ```env
   SENTRY_ENABLE_DEV=false
   NEXT_PUBLIC_SENTRY_ENABLE_DEV=false
   ```

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN is Correct**
   - Verify your DSN in `.env.local` matches the one from Sentry
   - Make sure there are no extra spaces or quotes

2. **Check Development Mode**
   - If testing in development, set `SENTRY_ENABLE_DEV=true`
   - Restart your dev server after changing env variables

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Look for any Sentry-related errors
   - Check Network tab for requests to `sentry.io`

4. **Verify Environment Variables are Loaded**
   - Add a temporary log in your code:
     ```typescript
     console.log('Sentry DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN);
     ```
   - Check if it's undefined (should show your DSN)

### Performance Metrics Not Showing

1. **Wait a Few Minutes**
   - Web Vitals take time to collect
   - Refresh the performance dashboard

2. **Check Sentry Performance Tab**
   - Go to Sentry → Performance
   - Look for transactions

3. **Verify Sampling Rate**
   - Check `sentry.client.config.ts`
   - `tracesSampleRate` should be > 0

## Next Steps

1. **Set Up Alerts** (Optional)
   - In Sentry dashboard, go to **Alerts**
   - Create alerts for critical errors
   - Set up email/Slack notifications

2. **Configure Release Tracking**
   - Set `SENTRY_RELEASE` to your app version
   - This helps track which version has errors

3. **Set User Context** (When Users Log In)
   ```typescript
   import { setUserContext } from '@/lib/monitoring/sentry';
   
   setUserContext({
     id: user.id,
     email: user.email,
     username: user.username,
   });
   ```

4. **Explore Sentry Features**
   - Session Replay (already configured)
   - Performance monitoring
   - Error grouping and deduplication
   - Source maps (for better error details)

## Quick Reference

### Dashboard URLs
- **Error Tracking**: http://localhost:3000/monitoring/errors
- **Performance**: http://localhost:3000/monitoring/performance

### Sentry Dashboard
- **Issues**: https://sentry.io/organizations/[your-org]/issues/
- **Performance**: https://sentry.io/organizations/[your-org]/performance/
- **Settings**: https://sentry.io/settings/[your-org]/projects/[your-project]/

### Environment Variables Checklist
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Your Sentry DSN
- [ ] `SENTRY_DSN` - Your Sentry DSN (server-side)
- [ ] `SENTRY_ENVIRONMENT` - development/production
- [ ] `SENTRY_ENABLE_DEV` - true/false (for dev testing)

## Need Help?

- **Sentry Documentation**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Sentry Support**: https://sentry.io/support/
- **Check Configuration**: Review `SENTRY_SETUP.md` for detailed configuration options

---

**You're all set!** Your application now has comprehensive error tracking and performance monitoring. 🎉

