/**
 * Notification Drawer Component
 * Side drawer for comprehensive notification management
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { X, Bell, Check, Trash2, Filter, Settings, CheckCircle2 } from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationUI } from '@/types/notification';
import { logger } from '@/lib/logger';
import { useToast } from '@/lib/toast';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  info: <div className="w-2 h-2 rounded-full bg-blue-500" />,
  success: <div className="w-2 h-2 rounded-full bg-green-500" />,
  warning: <div className="w-2 h-2 rounded-full bg-orange-500" />,
  error: <div className="w-2 h-2 rounded-full bg-red-500" />,
  critical: <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />,
};

export default function NotificationDrawer({
  isOpen,
  onClose,
  className,
}: NotificationDrawerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    initialFilters: { skip: 0, limit: 100 },
    enableWebSocket: true,
    pollInterval: 30000,
    autoFetch: true,
  });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    // Status filter
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;

    // Type filter
    if (typeFilter && notif.notification_type !== typeFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = notif.title?.toLowerCase().includes(query);
      const matchesMessage = notif.message?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesMessage) return false;
    }

    return true;
  });

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de marquer la notification comme lue',
        type: 'error',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showToast({
        title: 'Succès',
        message: 'Toutes les notifications ont été marquées comme lues',
        type: 'success',
      });
    } catch (error) {
      logger.error('Failed to mark all as read', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de marquer toutes les notifications comme lues',
        type: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      logger.error('Failed to delete notification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la notification',
        type: 'error',
      });
    }
  };

  const handleNotificationClick = (notification: NotificationUI) => {
    if (notification.action_url) {
      router.push(notification.action_url);
      onClose();
    }
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={clsx(
          'fixed right-0 top-0 z-[9999] h-full w-full max-w-md bg-background shadow-2xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/settings/notifications')}
                  title="Paramètres"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-3">
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filters */}
              <div className="flex gap-1">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={filter === 'unread' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Non lues
                  {unreadCount > 0 && (
                    <Badge variant="error" className="ml-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={filter === 'read' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  Lues
                </Button>
              </div>

              {/* Type filters */}
              <div className="flex gap-1">
                {['info', 'success', 'warning', 'error'].map((type) => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                  >
                    {type.charAt(0).toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="w-full"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery || typeFilter || filter !== 'all'
                    ? 'Aucune notification correspondante'
                    : 'Aucune notification'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={clsx(
                      'p-4 rounded-xl border transition-all duration-200 cursor-pointer',
                      'hover:shadow-md hover:scale-[1.01]',
                      notification.read
                        ? 'bg-background border-border/50'
                        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 ring-2 ring-blue-500/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {NOTIFICATION_ICONS[notification.notification_type] || NOTIFICATION_ICONS.info}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={clsx(
                              'font-semibold text-sm',
                              notification.read
                                ? 'text-foreground'
                                : 'text-blue-700 dark:text-blue-300'
                            )}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {notification.action_label || 'Voir'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-success-100 dark:hover:bg-success-900/20 transition-colors"
                            title="Marquer comme lu"
                          >
                            <Check className="w-4 h-4 text-success-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-danger-100 dark:hover:bg-danger-900/20 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-border p-4 bg-background/95 backdrop-blur-sm">
            <Button
              variant="outline"
              onClick={() => {
                router.push('/notifications');
                onClose();
              }}
              className="w-full"
            >
              Voir toutes les notifications
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
