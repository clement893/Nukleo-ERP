/**
 * Employee Portal Layout
 * 
 * Layout wrapper for employee portal pages.
 * Uses the same structure as DashboardLayout with sidebar navigation.
 * 
 * @module EmployeePortalLayout
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/errors';
import EmployeePortalSidebar from '@/components/employes/EmployeePortalSidebar';
import Button from '@/components/ui/Button';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

const SIDEBAR_COLLAPSED_KEY = 'employee-portal-sidebar-collapsed';

function EmployeePortalLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">ID employé invalide</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Sidebar - handles mobile/desktop internally and its own overlay */}
        <EmployeePortalSidebar
          isOpen={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          employeeId={employeeId}
        />

        {/* Main Content */}
        <div
          className={clsx(
            'flex h-screen pt-0 md:pt-0 transition-all duration-300',
            sidebarCollapsed ? 'md:ml-0' : 'md:ml-64'
          )}
        >
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
              <h1 className="text-lg font-semibold text-foreground">Mon Portail Employé</h1>
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

          {/* Page Content */}
          <main
            key={pathname}
            className={clsx(
              'flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-4 sm:py-6 md:py-8 2xl:py-10 bg-background transition-all duration-300',
              sidebarCollapsed ? 'md:mt-16' : 'mt-14 md:mt-0'
            )}
            style={{
              animation: 'fadeInSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployeePortalLayoutContent>{children}</EmployeePortalLayoutContent>;
}
