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

import { useState, useMemo, memo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoize the sidebar component to prevent re-renders during navigation
const MemoizedSidebar = memo(Sidebar);

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is admin or superadmin
  const isAdmin = user?.is_admin ?? false;

  // Memoize callbacks to prevent re-renders
  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleHomeClick = useCallback(() => {
    router.push('/');
    setMobileMenuOpen(false);
  }, [router]);

  const handleLogoutClick = useCallback(() => {
    logout();
    setMobileMenuOpen(false);
  }, [logout]);

  const handleDesktopHomeClick = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleDesktopLogoutClick = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
          onClick={handleMobileMenuClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - handles mobile/desktop internally */}
      <MemoizedSidebar
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      {/* Main Content */}
      <div className="flex h-screen pt-0 md:pt-0 md:ml-64">
        {/* Mobile Header with Menu Button */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background shadow border-b border-border">
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

        {/* Page Content */}
        <main 
          key={pathname} 
          className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 xl:px-8 2xl:px-10 py-4 sm:py-6 md:py-8 2xl:py-8 bg-background mt-14 md:mt-0"
          style={{
            animation: 'fadeInSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
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
