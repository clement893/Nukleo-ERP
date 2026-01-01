'use client';
// Sidebar simplifié - Design Nukleo sobre et compact

import { useState, useMemo, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationLogo } from '@/hooks/useOrganizationLogo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import { getNavigationConfig, type NavigationItem, type NavigationGroup } from '@/lib/navigation';
import { clsx } from 'clsx';
import { ChevronDown, Search, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ 
  isOpen: controlledIsOpen, 
  onClose,
  collapsed = false,
  onToggleCollapse
}: SidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { logoUrl } = useOrganizationLogo();
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

  // Check if a link is external
  const isExternalLink = (href: string) => {
    return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');
  };

  // Check if item is active
  const isActive = (href: string) => {
    if (isExternalLink(href)) return false;
    if (!pathname) return false;
    if (pathname === href) return true;
    
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    if (!pathname.startsWith(href)) return false;
    
    const nextChar = pathname[href.length];
    if (nextChar && nextChar !== '/') return false;
    
    const allItems: NavigationItem[] = [];
    navigationConfig.items.forEach((item) => {
      if ('items' in item) {
        allItems.push(...item.items);
      } else {
        allItems.push(item);
      }
    });
    
    const moreSpecificMatch = allItems.some((item) => {
      if (item.href === href) return false;
      if (item.href.length <= href.length) return false;
      return pathname.startsWith(item.href) && (pathname[item.href.length] === '/' || pathname.length === item.href.length);
    });
    
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
        // Check if group name matches
        const groupNameMatches = item.name.toLowerCase().includes(query);
        
        // Filter items in the group
        const filteredItems = item.items.filter(
          (subItem) =>
            subItem.name.toLowerCase().includes(query) ||
            subItem.href.toLowerCase().includes(query)
        );
        
        // Include group if group name matches OR if it has matching items
        if (groupNameMatches || filteredItems.length > 0) {
          // If group name matches, show all items; otherwise show only filtered items
          const itemsToShow = groupNameMatches ? item.items : filteredItems;
          return { ...item, items: itemsToShow };
        }
        return null;
      } else {
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

  // Auto-open groups that have filtered results when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const groupsToOpen = new Set<string>();
      filteredNavigation.forEach((item) => {
        if ('items' in item && item.items.length > 0) {
          groupsToOpen.add(item.name);
        }
      });
      if (groupsToOpen.size > 0) {
        setOpenGroups((prev) => {
          const newSet = new Set(prev);
          groupsToOpen.forEach((groupName) => newSet.add(groupName));
          return newSet;
        });
      }
    }
  }, [searchQuery, filteredNavigation]);

  // Render navigation item (SIMPLIFIÉ)
  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.href);
    const external = isExternalLink(item.href);
    
    const className = clsx(
      'group relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
      active
        ? 'bg-[#523DC9]/10 text-[#523DC9] dark:bg-[#523DC9]/20'
        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
    );

    const content = (
      <>
        {/* Active indicator simple */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#523DC9] rounded-r" />
        )}
        
        {/* Icon simple sans background */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-current opacity-70">
          {item.icon}
        </span>
        
        {/* Text */}
        {!collapsed && (
          <span className="truncate">{item.name}</span>
        )}
        
        {/* Badge */}
        {!collapsed && item.badge && (
          <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold rounded bg-[#523DC9]/10 text-[#523DC9]">
            {item.badge}
          </span>
        )}
      </>
    );

    if (external) {
      return (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      );
    }

    return (
      <Link key={item.href} href={item.href} className={className}>
        {content}
      </Link>
    );
  };

  // Render navigation group (SIMPLIFIÉ)
  const renderNavGroup = (group: NavigationGroup) => {
    const isGroupOpen = openGroups.has(group.name);
    const hasActiveItem = group.items.some((item) => isActive(item.href));

    return (
      <div key={group.name} className="space-y-0.5">
        {group.collapsible ? (
          <button
            onClick={() => toggleGroup(group.name)}
            className={clsx(
              'group w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
              hasActiveItem
                ? 'bg-[#523DC9]/5 text-[#523DC9]'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            )}
            aria-expanded={isGroupOpen}
            aria-label={`Toggle ${group.name} group`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Icon simple */}
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-current opacity-70">
                {group.icon}
              </span>
              {!collapsed && <span className="truncate">{group.name}</span>}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground">
                  {group.items.length}
                </span>
                <ChevronDown className={clsx(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  isGroupOpen && 'rotate-180'
                )} />
              </div>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 opacity-70">
              {group.icon}
            </span>
            {!collapsed && <span>{group.name}</span>}
          </div>
        )}
        {(!group.collapsible || isGroupOpen) && (
          <div className={clsx(
            "space-y-0.5",
            !collapsed && "ml-3 border-l border-border/50 pl-3"
          )}>
            {group.items.map((item) => renderNavItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 h-screen bg-background border-r border-border flex flex-col',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-0 md:w-0' : 'w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed && 'md:overflow-hidden'
        )}
      >
        {/* Header simple */}
        <div className={clsx(
          "border-b border-border flex-shrink-0 transition-all duration-300",
          collapsed ? "p-0" : "p-4"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                {logoUrl ? (
                  <div className="w-10 h-10 rounded-lg bg-muted p-2 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="object-contain h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#523DC9] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    Nukleo ERP
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Dashboard
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Search bar simple */}
        {!collapsed && (
          <div className="p-3 border-b border-border flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm bg-muted border-0 focus:ring-1 focus:ring-[#523DC9]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavigation.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          ) : (
            filteredNavigation.map((item) => {
              if ('items' in item) {
                return renderNavGroup(item);
              } else {
                return renderNavItem(item);
              }
            })
          )}
        </nav>

        {/* Footer simple */}
        {!collapsed && (
          <div className="border-t border-border p-3 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[#523DC9] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleWithIcon />
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex-1 text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Déconnexion
              </Button>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-20 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors hidden md:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
