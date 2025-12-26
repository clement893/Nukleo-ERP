'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';

interface SidebarItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  badge?: string | number;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  currentPath?: string;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: {
    name?: string;
    email?: string;
  } | null;
}

export default function Sidebar({
  items,
  currentPath,
  className,
  collapsed = false,
  onToggleCollapse,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const activePath = currentPath || pathname;

  const toggleItem = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isActive = activePath === item.href || (item.href && activePath?.startsWith(item.href));

    return (
      <div key={item.label}>
        <div
          className={clsx(
            'flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors',
            isActive
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
            level > 0 && 'ml-4'
          )}
        >
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center flex-1 space-x-3 min-w-0"
            >
              {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          ) : (
            <button
              onClick={item.onClick || (hasChildren ? () => toggleItem(item.label) : undefined)}
              className="flex items-center flex-1 space-x-3 text-left min-w-0"
            >
              {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </button>
          )}
          {!collapsed && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronRight
                  className={clsx(
                    'w-4 h-4 transition-transform text-gray-500 dark:text-gray-400',
                    isExpanded && 'transform rotate-90'
                  )}
                />
              )}
            </div>
          )}
        </div>
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={clsx(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64 md:w-72',
        className
      )}
    >
      {onToggleCollapse && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRight
              className={clsx(
                'w-5 h-5 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
          </button>
        </div>
      )}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">{items.map((item) => renderItem(item))}</nav>
      {user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={clsx(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

