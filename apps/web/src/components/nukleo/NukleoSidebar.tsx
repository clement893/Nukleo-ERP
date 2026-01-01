'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  FolderKanban, 
  Users, 
  Building2,
  Settings,
  Search,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui';
import { clsx } from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

interface NukleoSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function NukleoSidebar({ 
  isOpen = true, 
  onClose,
  collapsed = false,
  onToggleCollapse
}: NukleoSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Commercial', 'Projets']));
  const [darkMode, setDarkMode] = useState(false);

  // Navigation mock data
  const navigation: (NavItem | NavGroup)[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'Commercial',
      items: [
        { name: 'Opportunités', href: '/dashboard/opportunites-demo', icon: <Briefcase className="w-4 h-4" />, badge: 12 },
        { name: 'Pipeline', href: '/dashboard/pipeline-client-demo', icon: <FolderKanban className="w-4 h-4" /> },
        { name: 'Pipelines', href: '/dashboard/pipelines-demo', icon: <FolderKanban className="w-4 h-4" /> },
      ],
    },
    {
      name: 'Projets',
      items: [
        { name: 'Clients', href: '/dashboard/clients-demo', icon: <Building2 className="w-4 h-4" /> },
        { name: 'Équipes', href: '/dashboard/projets/equipes', icon: <Users className="w-4 h-4" />, badge: 3 },
      ],
    },
    {
      name: 'Réseau',
      items: [
        { name: 'Contacts', href: '/dashboard/reseau/contacts', icon: <Users className="w-4 h-4" /> },
        { name: 'Témoignages', href: '/dashboard/reseau/temoignages', icon: <Briefcase className="w-4 h-4" /> },
      ],
    },
    {
      name: 'Admin',
      items: [
        { name: 'Paramètres', href: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

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

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getCategoryColor = (name: string) => {
    const colors: Record<string, string> = {
      'Dashboard': '#523DC9',
      'Commercial': '#3B82F6',
      'Projets': '#10B981',
      'Réseau': '#F59E0B',
      'Admin': '#6B7280',
    };
    return colors[name] || '#523DC9';
  };

  const renderNavItem = (item: NavItem, isInGroup = false) => {
    const active = isActive(item.href);
    const color = isInGroup ? '#523DC9' : getCategoryColor(item.name);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={clsx(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          active
            ? 'glass-card text-[#523DC9] shadow-sm border border-[#523DC9]/20'
            : 'text-foreground/70 hover:glass-card hover:text-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        {/* Active indicator */}
        {active && !collapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-[#5F2B75] via-[#523DC9] to-[#6B1817] rounded-r-full" />
        )}
        
        {/* Icon with background */}
        <div 
          className={clsx(
            'p-2 rounded-lg transition-all duration-200',
            active ? 'scale-110' : 'group-hover:scale-105'
          )}
          style={{ backgroundColor: `${color}10` }}
        >
          <div style={{ color }}>{item.icon}</div>
        </div>
        
        {/* Name and badge */}
        {!collapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#523DC9]/10 text-[#523DC9]">
                {item.badge}
              </span>
            )}
          </>
        )}
        
        {/* Badge for collapsed mode */}
        {collapsed && item.badge && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#523DC9] text-white text-xs flex items-center justify-center font-semibold">
            {item.badge}
          </div>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isOpen = openGroups.has(group.name);
    const color = getCategoryColor(group.name);

    return (
      <div key={group.name} className="space-y-1">
        {/* Group header */}
        <button
          onClick={() => toggleGroup(group.name)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'text-foreground/70 hover:glass-card hover:text-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          {!collapsed && (
            <>
              <span className="flex-1 text-left font-nukleo">{group.name}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#523DC9]/10 text-[#523DC9]">
                  {group.items.length}
                </span>
                <ChevronDown 
                  className={clsx(
                    'w-4 h-4 transition-transform duration-300',
                    isOpen && 'rotate-180'
                  )} 
                />
              </div>
            </>
          )}
          {collapsed && (
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}10` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            </div>
          )}
        </button>

        {/* Group items */}
        {isOpen && !collapsed && (
          <div className="ml-3 space-y-1 border-l-2 border-[#A7A2CF]/20 pl-3">
            {group.items.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen bg-background border-r border-[#A7A2CF]/20 z-50 transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header with gradient Aurora Borealis */}
        <div className="relative bg-nukleo-gradient overflow-hidden p-6">
          {/* Texture grain */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Logo + Nom */}
          <div className="relative flex items-center gap-3">
            {!collapsed && (
              <>
                <div className="w-12 h-12 rounded-xl glass-card p-2 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">N</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-nukleo font-bold text-lg">Nukleo ERP</h2>
                  <p className="text-white/70 text-xs">Votre organisation</p>
                </div>
              </>
            )}
            {collapsed && (
              <div className="w-12 h-12 rounded-xl glass-card p-2 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
            )}
          </div>

          {/* Close button (mobile) */}
          {!collapsed && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:hidden text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Toggle collapse button (desktop) */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="absolute -right-3 top-1/2 -translate-y-1/2 hidden md:flex w-6 h-6 rounded-full bg-[#523DC9] text-white items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#523DC9]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-card border border-[#A7A2CF]/20 focus:border-[#523DC9] focus:outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navigation.map((item) => {
            if ('items' in item) {
              return renderNavGroup(item);
            } else {
              return renderNavItem(item);
            }
          })}
        </nav>

        {/* Footer with user profile */}
        <div className="p-4 border-t border-[#A7A2CF]/20">
          <div className="glass-card p-3 hover-nukleo rounded-xl">
            {!collapsed ? (
              <div className="flex items-center gap-3">
                {/* Avatar with gradient border */}
                <div className="relative">
                  <div className="absolute inset-0 bg-nukleo-gradient rounded-full opacity-50 blur-sm" />
                  <div className="relative w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-[#523DC9]/20 flex items-center justify-center">
                    <span className="text-[#523DC9] font-semibold">JT</span>
                  </div>
                </div>
                
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">Jean Tremblay</p>
                  <p className="text-xs text-gray-500 truncate">jean@nukleo.ca</p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-[#523DC9]/20 flex items-center justify-center">
                  <span className="text-[#523DC9] font-semibold text-xs">JT</span>
                </div>
                <Button size="sm" variant="ghost" className="w-full">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
