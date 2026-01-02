/**
 * Notification Bell Component
 * Notification indicator with glassmorphism dropdown
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Bell, MoreVertical } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import NotificationCenter from './NotificationCenter';
import type { NotificationUI } from '@/types/notification';

export interface NotificationBellProps {
  notifications: NotificationUI[];
  /** Total unread count (if provided, used instead of calculating from notifications) */
  unreadCount?: number;
  onMarkAsRead?: (id: number) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onActionClick?: (notification: NotificationUI) => void;
  onViewAll?: () => void;
  className?: string;
}

export default function NotificationBell({
  notifications,
  unreadCount: providedUnreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onActionClick,
  onViewAll,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Use provided unreadCount if available, otherwise calculate from notifications
  const unreadCount = providedUnreadCount ?? notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const dropdownItems: DropdownItem[] = [
    {
      label: 'Voir toutes les notifications',
      onClick: () => {
        setIsOpen(false);
        onViewAll?.();
      },
    },
    ...(unreadCount > 0 && onMarkAllAsRead
      ? [
          {
            label: 'Tout marquer comme lu',
            onClick: async () => {
              await onMarkAllAsRead();
            },
          },
        ]
      : []),
  ];

  return (
    <div ref={bellRef} className={clsx('relative', className)}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={clsx(
          'relative p-2.5 rounded-xl transition-all duration-200',
          'text-foreground/70 hover:text-foreground',
          'hover:glass-card-hover',
          isOpen && 'glass-card-active text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary/20'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className={clsx(
          'w-5 h-5 transition-transform duration-200',
          isOpen && 'scale-110',
          unreadCount > 0 && 'animate-pulse'
        )} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5">
            <Badge 
              variant="error" 
              className="text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 z-[9999] animate-scale-in">
          <div className="glass-modal rounded-2xl shadow-2xl max-h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <Dropdown 
                trigger={
                  <button className="p-2 rounded-lg hover:glass-card-hover transition-all">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                } 
                items={dropdownItems} 
              />
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <NotificationCenter
                  notifications={recentNotifications}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onDelete={onDelete}
                  onActionClick={(notification) => {
                    setIsOpen(false);
                    onActionClick?.(notification);
                  }}
                />
              )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
              <div className="p-4 border-t border-border/30">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onViewAll?.();
                  }}
                  className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 rounded-lg hover:glass-card-hover"
                >
                  Voir toutes les notifications ({notifications.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
