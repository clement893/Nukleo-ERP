'use client';

import { useState, useMemo } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import { getNavigationConfig, type NavigationItem, type NavigationGroup } from '@/lib/navigation';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, Search, X, LogOut } from 'lucide-react';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: controlledIsOpen, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleClose = onClose || (() => setInternalIsOpen(false));

  // Check if user is admin or superadmin
  const isAdmin = user?.is_admin || false;

  // Get navigation configuration
  const navigationConfig = useMemo(() => getNavigationConfig(isAdmin), [isAdmin]);

  // Toggle group open/closed
  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Check if item is active
  // Only mark as active if it's an exact match or if it's the most specific matching route
  const isActive = (href: string) => {
    if (!pathname) return false;
    
    // Exact match
    if (pathname === href) return true;
    
    // For dashboard root, only match exactly
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // Check if pathname starts with href
    if (!pathname.startsWith(href)) return false;
    
    // If href is a prefix, check that the next character is '/' or end of string
    // This prevents /dashboard/commercial from matching /dashboard/commercials
    const nextChar = pathname[href.length];
    if (nextChar && nextChar !== '/') return false;
    
    // Now we need to check if there's a more specific route that should be active instead
    // Get all navigation items to check for more specific matches
    const allItems: NavigationItem[] = [];
    navigationConfig.items.forEach((item) => {
      if ('items' in item) {
        allItems.push(...item.items);
      } else {
        allItems.push(item);
      }
    });
    
    // Check if any other route is a more specific match (longer href that also matches)
    const moreSpecificMatch = allItems.some((item) => {
      if (item.href === href) return false; // Skip self
      if (item.href.length <= href.length) return false; // Must be longer
      // Check if the more specific route matches the current pathname
      return pathname.startsWith(item.href) && (pathname[item.href.length] === '/' || pathname.length === item.href.length);
    });
    
    // If there's a more specific match, this route shouldn't be active
    return !moreSpecificMatch;
  };

  // Filter navigation based on search query
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) {
      return navigationConfig.items;
    }

    const query = searchQuery.toLowerCase();
    return navigationConfig.items.map((item) => {
      if ('items' in item) {
        // It's a group
        const filteredItems = item.items.filter(
          (subItem) =>
            subItem.name.toLowerCase().includes(query) ||
            subItem.href.toLowerCase().includes(query)
        );
        if (filteredItems.length > 0) {
          return { ...item, items: filteredItems };
        }
        return null;
      } else {
        // It's a single item
        if (
          item.name.toLowerCase().includes(query) ||
          item.href.toLowerCase().includes(query)
        ) {
          return item;
        }
        return null;
      }
    }).filter((item): item is NavigationItem | NavigationGroup => item !== null);
  }, [navigationConfig.items, searchQuery]);

  // Render navigation item
  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={clsx(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors',
          active
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
        )}
      >
        <span className="w-4 h-4">{item.icon}</span>
        <span>{item.name}</span>
        {item.badge && (
          <span className="ml-auto px-1.5 py-0.5 text-xs font-medium rounded bg-primary/20 text-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Render navigation group
  const renderNavGroup = (group: NavigationGroup) => {
    const isOpen = openGroups.has(group.name);
    const hasActiveItem = group.items.some((item) => isActive(item.href));

    // Auto-open group if it has an active item
    if (hasActiveItem && !isOpen && group.collapsible) {
      setOpenGroups((prev) => new Set(prev).add(group.name));
    }

    return (
      <div key={group.name} className="space-y-0.5">
        {group.collapsible ? (
          <button
            onClick={() => toggleGroup(group.name)}
            className={clsx(
              'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-sm transition-colors',
              hasActiveItem
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
            )}
            aria-expanded={isOpen}
            aria-label={`Toggle ${group.name} group`}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4">{group.icon}</span>
              <span>{group.name}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span className="w-4 h-4">{group.icon}</span>
            <span>{group.name}</span>
          </div>
        )}
        {(!group.collapsible || isOpen) && (
          <div className="ml-6 space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <span className="w-4 h-4">{item.icon}</span>
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-xs font-medium rounded bg-primary/20 text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay - only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 dark:bg-black/70 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-background/50 backdrop-blur-sm border-r border-border/30 flex flex-col',
          'transition-transform duration-normal ease-smooth',
          // Mobile: slide in/out from left
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header with Hamburger Menu */}
        <div className="flex items-center justify-between h-14 px-4 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-lg font-semibold text-primary">
              MODELE
            </span>
          </Link>
          {/* Hamburger Menu Button (Mobile only) */}
          <button
            onClick={handleClose}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fermer le menu"
            aria-expanded={isOpen}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Search Bar */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9 text-sm"
            aria-label="Rechercher dans la navigation"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {filteredNavigation.length === 0 ? (
          <div className="px-3 py-3 text-sm text-muted-foreground text-center">
            Aucun résultat trouvé
          </div>
        ) : (
          filteredNavigation.map((item) =>
            'items' in item ? renderNavGroup(item) : renderNavItem(item)
          )
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 p-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-medium">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <ThemeToggleWithIcon />
          <Button
            size="sm"
            variant="ghost"
            onClick={logout}
            className="p-2 h-8 w-8"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
