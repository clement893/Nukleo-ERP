'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Bell, Check, Trash2, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { notificationsAPI } from '@/lib/api/notifications';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import type { Notification } from '@/types/notification';

interface NotificationListProps {
  className?: string;
}

export default function NotificationList({ className }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getNotifications({
        read: filter === 'all' ? undefined : filter === 'read',
        limit: 100
      });
      setNotifications(response.notifications);
    } catch (error) {
      logger.error('Failed to load notifications', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les notifications',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setMarkingAsRead(prev => new Set([...prev, notificationId]));
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
      showToast({
        title: 'Succès',
        message: 'Notification marquée comme lue',
        type: 'success'
      });
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de marquer la notification comme lue',
        type: 'error'
      });
    } finally {
      setMarkingAsRead(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
      showToast({
        title: 'Succès',
        message: 'Toutes les notifications ont été marquées comme lues',
        type: 'success'
      });
    } catch (error) {
      logger.error('Failed to mark all as read', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de marquer toutes les notifications comme lues',
        type: 'error'
      });
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showToast({
        title: 'Succès',
        message: 'Notification supprimée',
        type: 'success'
      });
    } catch (error) {
      logger.error('Failed to delete notification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la notification',
        type: 'error'
      });
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    const config = {
      info: { label: 'Info', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      success: { label: 'Succès', className: 'bg-green-500/10 text-green-600 border-green-500/30' },
      warning: { label: 'Avertissement', className: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
      error: { label: 'Erreur', className: 'bg-red-500/10 text-red-600 border-red-500/30' }
    };
    const typeConfig = config[type as keyof typeof config] || config.info;
    return (
      <Badge className={`${typeConfig.className} border`}>
        {typeConfig.label}
      </Badge>
    );
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
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Notifications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''}
            {unreadCount > 0 && ` • ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
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
          Non lues ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('read')}
        >
          Lues
        </Button>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Aucune notification</p>
            <p className="text-sm">Vous n'avez pas encore de notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${
                notification.read
                  ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-[#523DC9]/30 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[#523DC9]" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getNotificationTypeBadge(notification.notification_type)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(notification.created_at)}</span>
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="text-[#523DC9] hover:underline"
                        >
                          {notification.action_label || 'Voir'}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markingAsRead.has(notification.id)}
                        >
                          {markingAsRead.has(notification.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
