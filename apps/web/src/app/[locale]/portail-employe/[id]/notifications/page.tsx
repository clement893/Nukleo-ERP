'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader, PageContainer } from '@/components/layout';
import { NotificationList } from '@/components/settings';
import { Card, Button } from '@/components/ui';
import { Bell, Settings, Filter } from 'lucide-react';
import { notificationsAPI } from '@/lib/api/notifications';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import { employeesAPI } from '@/lib/api/employees';
import type { Notification } from '@/types/notification';

export default function EmployeeNotificationsPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [employee, setEmployee] = useState<{ user_id?: number | null } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!employeeId) {
      router.push(`/${locale}/portail-employe`);
      return;
    }

    loadEmployee();
    loadNotifications();
    loadUnreadCount();
  }, [employeeId, locale, router, filter, typeFilter]);

  const loadEmployee = async () => {
    try {
      if (!employeeId) return;
      const emp = await employeesAPI.get(employeeId);
      setEmployee(emp);
    } catch (error) {
      logger.error('Failed to load employee', error);
    }
  };

  const loadNotifications = async () => {
    if (!employee?.user_id) return;
    
    try {
      const response = await notificationsAPI.getNotifications({
        read: filter === 'all' ? undefined : filter === 'read',
        notification_type: typeFilter as any || undefined,
        limit: 200
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      logger.error('Failed to load notifications', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les notifications',
        type: 'error'
      });
    }
  };

  const loadUnreadCount = async () => {
    if (!employee?.user_id) return;
    
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      logger.error('Failed to load unread count', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      await loadNotifications();
      await loadUnreadCount();
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

  const notificationTypes = [
    { value: null, label: 'Tous les types' },
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Succès' },
    { value: 'warning', label: 'Avertissement' },
    { value: 'error', label: 'Erreur' }
  ];

  const filteredNotifications = typeFilter
    ? notifications.filter(n => n.notification_type === typeFilter)
    : notifications;

  if (!employeeId) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Mes Notifications'}
        description={t('description') || 'Consultez toutes vos notifications'}
        breadcrumbs={[
          { label: 'Portail Employé', href: `/${locale}/portail-employe/${employeeId}/dashboard` },
          { label: t('breadcrumbs.notifications') || 'Notifications' },
        ]}
      />

      {/* Actions et Filtres */}
      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mes Notifications
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
                {unreadCount > 0 && ` • ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/portail-employe/${employeeId}/notifications/preferences`)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Préférences
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres:
            </span>
            
            {/* Filtre par statut */}
            <div className="flex gap-2">
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

            {/* Filtre par type */}
            <div className="flex gap-2">
              {notificationTypes.map((type) => (
                <Button
                  key={type.value || 'all'}
                  variant={typeFilter === type.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des notifications */}
      <NotificationList 
        className="mb-6" 
        initialFilter={filter}
        typeFilter={typeFilter}
        showFilters={false}
      />
    </PageContainer>
  );
}
