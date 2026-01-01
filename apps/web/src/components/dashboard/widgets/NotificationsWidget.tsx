'use client';

/**
 * Widget : Notifications
 */

import { Bell, ExternalLink } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { notificationsAPI } from '@/lib/api/notifications';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function NotificationsWidget({ }: WidgetProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [notifsData, unread] = await Promise.all([
          notificationsAPI.getNotifications({ limit: 5 }),
          notificationsAPI.getUnreadCount(),
        ]);
        setNotifications(notifsData.notifications || []);
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Notifications</span>
        </div>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-auto space-y-2">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Aucune notification"
            description="Vous êtes à jour !"
            variant="compact"
          />
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border ${
                !notif.read
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(notif.notification_type || 'info')}`}>
                      {notif.notification_type || 'info'}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {notif.title || 'Notification'}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {notif.message || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDate(notif.created_at)}
                  </p>
                </div>
                {notif.action_url && (
                  <Link
                    href={notif.action_url}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/profile/notifications"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Voir toutes les notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
