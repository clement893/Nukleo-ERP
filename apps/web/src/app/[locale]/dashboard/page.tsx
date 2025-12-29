'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, Badge, ServiceTestCard, Button, LoadingSkeleton, Grid, Stack } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Link } from '@/i18n/routing';
import dynamicImport from 'next/dynamic';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  User, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Activity,
  Database,
  Shield,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';

// Lazy load TemplateAIChat to avoid circular dependency issues during build
const TemplateAIChat = dynamicImport(
  () => import('@/components/ai/TemplateAIChat').then(mod => ({ default: mod.TemplateAIChat })),
  { ssr: false }
);

function DashboardContent() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2xl">
        <div>
          <LoadingSkeleton variant="custom" className="h-10 w-64 mb-2" />
          <LoadingSkeleton variant="custom" className="h-6 w-96" />
        </div>
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="normal">
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
        </Grid>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      {/* Welcome Header */}
      <MotionDiv variant="fade" delay={100}>
        <PageHeader
          title={`Welcome back, ${user?.name || 'User'}!`}
          description="Here's what's happening with your account today"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Dashboard' },
          ]}
        />
      </MotionDiv>

      {/* Quick Stats Grid */}
      <MotionDiv variant="slideUp" delay={200}>
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="normal">
          <Card className="border-l-4 border-l-primary-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Resources</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-secondary-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Files</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-info-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Activities</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-info-600 dark:text-info-400" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-success-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Growth</p>
                <p className="text-3xl font-bold text-foreground">+12%</p>
              </div>
              <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </Card>
        </Grid>
      </MotionDiv>

      <MotionDiv variant="slideUp" delay={300}>
        <Grid columns={{ mobile: 1, tablet: 2 }} gap="loose">
          {/* User Profile Card */}
          <Card className="hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Your Profile</h3>
                <p className="text-sm text-muted-foreground">Account information</p>
              </div>
            </div>
            <Stack gap="normal">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {user?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {user?.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {user?.is_active ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                    <Badge variant={user?.is_active ? 'success' : 'default'} className="mt-0.5">
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {user?.is_verified ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Verified</p>
                    <Badge variant={user?.is_verified ? 'success' : 'default'} className="mt-0.5">
                      {user?.is_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Stack>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/60 dark:to-primary-900/60 border-primary-200 dark:border-primary-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary-600 dark:bg-primary-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Access frequently used features</p>
              </div>
            </div>
            <Stack gap="normal">
              <Link href="/admin">
                <Button variant="primary" className="w-full justify-start gap-3 h-auto py-3 hover:scale-[1.02] transition-transform">
                  <Settings className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Espace Admin</div>
                    <div className="text-xs opacity-90">Manage system settings</div>
                  </div>
                </Button>
              </Link>
            </Stack>
          </Card>
        </Grid>
      </MotionDiv>

      {/* API Status */}
      <MotionDiv variant="slideUp" delay={400}>
        <Card className="hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">System Status</h3>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <Grid columns={{ mobile: 1, tablet: 3 }} gap="normal">
            <div className="p-4 bg-success-50 dark:bg-success-950/50 border-2 border-success-200 dark:border-success-800 rounded-lg hover:border-success-400 dark:hover:border-success-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="font-semibold text-success-900 dark:text-success-100">Backend Connected</p>
              </div>
              <p className="text-sm text-success-800 dark:text-success-200 ml-8">API is running</p>
            </div>
            <div className="p-4 bg-success-50 dark:bg-success-950/50 border-2 border-success-200 dark:border-success-800 rounded-lg hover:border-success-400 dark:hover:border-success-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="font-semibold text-success-900 dark:text-success-100">Database Connected</p>
              </div>
              <p className="text-sm text-success-800 dark:text-success-200 ml-8">PostgreSQL is running</p>
            </div>
            <div className="p-4 bg-success-50 dark:bg-success-950/50 border-2 border-success-200 dark:border-success-800 rounded-lg hover:border-success-400 dark:hover:border-success-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="font-semibold text-success-900 dark:text-success-100">Authentication</p>
              </div>
              <p className="text-sm text-success-800 dark:text-success-200 ml-8">JWT is working</p>
            </div>
          </Grid>
        </Card>
      </MotionDiv>

      {/* Service Tests */}
      <MotionDiv variant="slideUp" delay={500}>
        <Card className="hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Service Tests</h3>
              <p className="text-sm text-muted-foreground">Test and verify the configuration of integrated services</p>
            </div>
          </div>
          <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="normal">
          <ServiceTestCard
            href="/ai/testing"
            title="AI Test"
            description="Test OpenAI integration with chat completions and text generation"
            color="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/email/testing"
            title="Email Test"
            description="Test SendGrid email service with test, welcome, and custom emails"
            color="secondary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/stripe/testing"
            title="Stripe Test"
            description="Test Stripe integration for subscriptions and payment processing"
            color="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/auth/google/testing"
            title="Google Auth Test"
            description="Test Google OAuth integration for authentication"
            color="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/sentry/testing"
            title="Sentry Test"
            description="Test Sentry error tracking and monitoring integration"
            color="error"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/upload"
            title="S3 Upload"
            description="Test AWS S3 file upload and management functionality"
            color="primary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/client/dashboard"
            title="Client Portal"
            description="Test Client Portal - View orders, invoices, projects, and support tickets"
            color="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/erp/dashboard"
            title="ERP Portal"
            description="Test ERP Portal - Manage orders, invoices, clients, inventory, and reports"
            color="primary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <ServiceTestCard
            href="/test/api-connections"
            title="API Connections Test"
            description="Test and verify API connections between frontend pages and backend endpoints"
            color="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            }
          />
        </Grid>
        </Card>
      </MotionDiv>

      {/* AI Chat Assistant */}
      <MotionDiv variant="slideUp" delay={600}>
        <Card className="hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">Get help with your questions</p>
          </div>
        </div>
        <TemplateAIChat />
      </Card>
      </MotionDiv>
    </MotionDiv>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
