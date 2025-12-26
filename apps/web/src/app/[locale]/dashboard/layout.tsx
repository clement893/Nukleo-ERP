'use client';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/ui/Sidebar';
import Button from '@/components/ui/Button';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import { 
  LayoutDashboard, 
  FolderKanban, 
  LogOut,
  Menu,
  X,
  Shield,
  Home,
  User,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Check if user is admin or superadmin
  const isAdmin = user?.is_admin;

  const sidebarItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <User className="w-5 h-5" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      label: 'Projets',
      href: '/dashboard/projects',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      label: 'Super Admin',
      href: '/dashboard/become-superadmin',
      icon: <Shield className="w-5 h-5" />,
    },
    // Admin link - only visible to admins and superadmins
    ...(isAdmin
      ? [
          {
            label: 'Administration',
            href: '/admin',
            icon: <Shield className="w-5 h-5" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-900">
      {/* Mobile/Tablet Header */}
      <header className="xl:hidden bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate flex-1 mr-2">
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/dashboard/projects' && 'Projets'}
            {pathname === '/dashboard/become-superadmin' && 'Super Admin'}
            {pathname === '/profile' && 'Profile'}
            {pathname === '/settings' && 'Settings'}
            {pathname?.startsWith('/admin') && 'Administration'}
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              aria-label="Retour à l'accueil"
              title="Retour à l'accueil"
              className="hidden sm:flex"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <ThemeToggleWithIcon />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="p-2"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout} className="hidden sm:flex">
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Logout</span>
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={handleLogout} 
              className="sm:hidden p-2"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile/Tablet Sidebar */}
      <aside
        className={clsx(
          'xl:hidden fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out w-64 sm:w-72',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          items={sidebarItems}
          currentPath={pathname}
          className="h-full"
          user={user}
        />
      </aside>

      {/* Desktop Layout */}
      <div className="flex h-screen pt-0 xl:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden xl:block">
          <Sidebar
            items={sidebarItems}
            currentPath={pathname}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-screen sticky top-0"
            user={user}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Desktop Header */}
          <header className="hidden xl:block bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pathname === '/dashboard' && 'Dashboard'}
                {pathname === '/dashboard/projects' && 'Projets'}
                {pathname === '/dashboard/become-superadmin' && 'Super Admin'}
                {pathname === '/profile' && 'Profile'}
                {pathname === '/settings' && 'Settings'}
                {pathname?.startsWith('/admin') && 'Administration'}
              </h1>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  aria-label="Retour à l'accueil"
                  title="Retour à l'accueil"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Accueil
                </Button>
                <ThemeToggleWithIcon />
                <Button variant="danger" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 xl:px-8 py-4 sm:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProtectedRoute>
  );
}
