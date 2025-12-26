'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Gift } from 'lucide-react';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_dismissible: boolean;
  action_label?: string;
  action_url?: string;
}

interface AnnouncementBannerProps {
  className?: string;
  showOnLogin?: boolean;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  promotion: Gift,
};

const typeStyles = {
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  promotion: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
};

export function AnnouncementBanner({ className = '', showOnLogin = false }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, [showOnLogin]);

  const fetchAnnouncements = async () => {
    try {
      const response = await apiClient.get<Announcement[]>('/api/v1/announcements/announcements', {
        params: {
          show_on_login: showOnLogin || undefined,
        },
      });
      if (response.data) {
        setAnnouncements(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const handleDismiss = async (announcementId: number) => {
    try {
      await apiClient.post(`/api/v1/announcements/announcements/${announcementId}/dismiss`);
      setDismissedIds(new Set([...dismissedIds, announcementId]));
    } catch (error) {
      console.error('Failed to dismiss announcement:', error);
    }
  };

  const visibleAnnouncements = announcements.filter(
    (ann) => !dismissedIds.has(ann.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleAnnouncements.map((announcement) => {
        const Icon = typeIcons[announcement.type];
        const styles = typeStyles[announcement.type];

        return (
          <div
            key={announcement.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${styles}`}
          >
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">{announcement.title}</h4>
              <p className="text-sm">{announcement.message}</p>
              {announcement.action_label && announcement.action_url && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (announcement.action_url?.startsWith('http')) {
                        window.open(announcement.action_url, '_blank');
                      } else {
                        window.location.href = announcement.action_url || '#';
                      }
                    }}
                  >
                    {announcement.action_label}
                  </Button>
                </div>
              )}
            </div>
            {announcement.is_dismissible && (
              <button
                onClick={() => handleDismiss(announcement.id)}
                className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}



