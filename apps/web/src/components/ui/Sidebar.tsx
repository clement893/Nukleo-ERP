'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

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
}

export default function Sidebar({
  items,
  currentPath,
  className,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    const isActive = currentPath === item.href;

    return (
      <div key={item.label}>
        <div
          className={clsx(
            'flex items-center justify-between px-4 py-2 rounded-lg transition-colors',
            isActive
              ? 'bg-blue-100 text-blue-900'
              : 'text-gray-700 hover:bg-gray-100',
            level > 0 && 'ml-4'
          )}
        >
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center flex-1 space-x-3"
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          ) : (
            <button
              onClick={item.onClick || (hasChildren ? () => toggleItem(item.label) : undefined)}
              className="flex items-center flex-1 space-x-3 text-left"
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </button>
          )}
          {!collapsed && (
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <svg
                  className={clsx(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'transform rotate-90'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
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
        'bg-white border-r border-gray-200 h-full transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {onToggleCollapse && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
              />
            </svg>
          </button>
        </div>
      )}
      <nav className="p-4 space-y-1">{items.map((item) => renderItem(item))}</nav>
    </aside>
  );
}

