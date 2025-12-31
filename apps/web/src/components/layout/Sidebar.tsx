'use client';

import { useState, useMemo } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationLogo } from '@/hooks/useOrganizationLogo';
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
    const external = isExternalLink(item.href);
    const className = clsx(
      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
      active
        ? 'glass-card-active text-primary shadow-sm'
        : 'text-foreground/70 hover:glass-card-hover hover:text-foreground'
    );

    const iconClassName = clsx(
      'w-5 h-5 transition-all duration-200',
      active ? 'text-primary scale-110' : 'text-foreground/60 group-hover:text-primary group-hover:scale-105'
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
          {/* Active indicator */}
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
          )}
          <span className={iconClassName}>{item.icon}</span>
          <span className="flex-1">{item.name}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
              {item.badge}
            </span>
          )}
        </a>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={className}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
        )}
        <span className={iconClassName}>{item.icon}</span>
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Render navigation group
  const renderNavGroup = (group: NavigationGroup) => {
    const isGroupOpen = openGroups.has(group.name);
    const hasActiveItem = group.items.some((item) => isActive(item.href));

    // Auto-open group if it has an active item
    if (hasActiveItem && !isGroupOpen && group.collapsible) {
      setOpenGroups((prev) => new Set(prev).add(group.name));
    }

    return (
      <div key={group.name} className="space-y-1">
        {group.collapsible ? (
          <button
            onClick={() => toggleGroup(group.name)}
            className={clsx(
              'group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              hasActiveItem
                ? 'glass-card-active text-primary shadow-sm'
                : 'text-foreground/70 hover:glass-card-hover hover:text-foreground'
            )}
            aria-expanded={isGroupOpen}
            aria-label={`Toggle ${group.name} group`}
          >
            <div className="flex items-center gap-3">
              <span className={clsx(
                'w-5 h-5 transition-all duration-200',
                hasActiveItem ? 'text-primary scale-110' : 'text-foreground/60 group-hover:text-primary group-hover:scale-105'
              )}>
                {group.icon}
              </span>
              <span>{group.name}</span>
            </div>
            <div className={clsx(
              'transition-transform duration-200',
              isGroupOpen ? 'rotate-0' : '-rotate-90'
            )}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="w-5 h-5">{group.icon}</span>
            <span>{group.name}</span>
          </div>
        )}
        {(!group.collapsible || isGroupOpen) && (
          <div className="ml-8 space-y-1">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const external = isExternalLink(item.href);
              const className = clsx(
                'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'glass-card-active text-primary shadow-sm'
                  : 'text-foreground/70 hover:glass-card-hover hover:text-foreground'
              );

              const iconClassName = clsx(
                'w-4 h-4 transition-all duration-200',
                active ? 'text-primary scale-110' : 'text-foreground/60 group-hover:text-primary group-hover:scale-105'
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
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
                    )}
                    <span className={iconClassName}>{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
                  )}
                  <span className={iconClassName}>{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
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
          className="fixed inset-0 z-30 glass-overlay md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 h-screen w-72 glass-sidebar-enhanced flex flex-col',
          'transition-transform duration-normal ease-smooth',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between h-16 px-4 flex-shrink-0 border-b border-border/30">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {logoUrl ? (
              <div className="relative h-10 w-10 flex-shrink-0 rounded-xl overflow-hidden glass-card p-1.5 group-hover:scale-105 transition-transform duration-200">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="object-contain h-full w-full"
                />
              </div>
            ) : (
              <div className="relative h-10 w-10 flex-shrink-0 rounded-xl glass-card flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <span className="text-lg font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  N
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground">
                Nukleo ERP
              </span>
              <span className="text-xs text-muted-foreground">
                Gestion d'entreprise
              </span>
            </div>
          </Link>
          {/* Close Button (Mobile only) */}
          <button
            onClick={handleClose}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:glass-card-hover transition-all min-h-[44px] min-w-[44px]"
            aria-label="Fermer le menu"
            aria-expanded={isOpen}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm glass-card border-0 focus:ring-2 focus:ring-primary/20"
              aria-label="Rechercher dans la navigation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavigation.length === 0 ? (
            <div className="px-3 py-8 text-sm text-muted-foreground text-center">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucun résultat trouvé</p>
            </div>
          ) : (
            filteredNavigation.map((item) =>
              'items' in item ? renderNavGroup(item) : renderNavItem(item)
            )
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/30 p-4 flex-shrink-0 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3 p-2 rounded-xl glass-card">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ThemeToggleWithIcon />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={logout}
              className="p-2.5 h-10 w-10 rounded-xl hover:glass-card-hover hover:text-red-500 transition-all"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
