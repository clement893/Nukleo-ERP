/**
 * Shared Dashboard Layout Component
 * 
 * Best Practice: Use a shared layout component to ensure consistency
 * across all internal pages (dashboard, settings, profile, etc.)
 * 
 * Benefits:
 * - Single source of truth for navigation
 * - Consistent UI/UX across pages
 * - Easier maintenance (one place to update)
 * - Prevents layout drift between pages
 */

'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import QuickActions from '@/components/ui/QuickActions';
import { ProgressBar } from '@/components/navigation/ProgressBar';
import { PageTransition } from '@/components/navigation/PageTransition';
import { usePrefetchRoutes } from '@/hooks/usePrefetchRoutes';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoize the sidebar component to prevent re-renders during navigation
const MemoizedSidebar = memo(Sidebar);

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Prefetch frequently visited routes
  usePrefetchRoutes();

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Progress Bar */}
      <ProgressBar />
      
      {/* Sidebar - handles mobile/desktop internally and its own overlay */}
      <MemoizedSidebar
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content */}
      <div className={clsx(
        "flex h-screen pt-0 md:pt-0 transition-all duration-300",
        sidebarCollapsed ? "md:ml-0" : "md:ml-64"
      )}>
        {/* Mobile Header with Menu Button */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 glass-navbar">
          <div className="px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Desktop Header with Toggle Button (when collapsed) */}
        {sidebarCollapsed && (
          <header className="hidden md:block fixed top-0 left-0 right-0 z-30 glass-navbar h-16">
            <div className="px-4 py-3 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSidebar}
                aria-label="Développer le menu"
                className="mr-4"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </header>
        )}

        {/* Quick Actions FAB */}
        <QuickActions />

        {/* Page Content */}
        <main 
          key={pathname} 
          className={clsx(
            "flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-4 sm:py-6 md:py-8 2xl:py-10 bg-background transition-all duration-300",
            sidebarCollapsed ? "md:mt-16" : "mt-14 md:mt-0"
          )}
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Next.js App Router keeps layouts persistent by default
  // The layout component stays mounted, only {children} changes during navigation
  // This ensures the sidebar stays in place while only the content area updates
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProtectedRoute>
  );
}
