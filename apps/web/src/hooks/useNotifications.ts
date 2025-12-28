/**
 * useNotifications Hook
 * 
 * React hook for managing user notifications.
 * Provides convenient methods for fetching, marking as read, and deleting notifications
 * with loading states and error handling.
 * 
 * @example
 * ```typescript
 * import { useNotifications } from '@/hooks/useNotifications';
 * 
 * function MyComponent() {
 *   const { notifications, loading, error, markAsRead, refresh } = useNotifications();
 * 
 *   return (
 *     <div>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error}</p>}
 *       {notifications.map(notif => (
 *         <div key={notif.id}>
 *           {notif.title}
 *           <button onClick={() => markAsRead(notif.id)}>Mark as read</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '@/lib/api/notifications';
import type {
  Notification,
  NotificationFilters,
  NotificationListResponse,
} from '@/types/notification';

interface UseNotificationsOptions {
  /** Initial filters for fetching notifications */
  initialFilters?: NotificationFilters;
  /** Enable automatic polling (in milliseconds) */
  pollInterval?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Total count of notifications */
  total: number;
  /** Unread count */
  unreadCount: number;
  /** Pagination info */
  pagination: {
    skip: number;
    limit: number;
  };
  /** Fetch notifications with optional filters */
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  /** Mark a notification as read */
  markAsRead: (id: number) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  deleteNotification: (id: number) => Promise<void>;
  /** Refresh notifications (re-fetch with current filters) */
  refresh: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    initialFilters = { skip: 0, limit: 100 },
    pollInterval,
    autoFetch = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filters, setFilters] = useState<NotificationFilters>(initialFilters);

  const fetchNotifications = useCallback(
    async (newFilters?: NotificationFilters) => {
      setLoading(true);
      setError(null);

      try {
        const currentFilters = newFilters || filters;
        const response: NotificationListResponse =
          await notificationsAPI.getNotifications(currentFilters);

        setNotifications(response.notifications);
        setTotal(response.total);
        setUnreadCount(response.unread_count);
        setFilters(currentFilters);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(errorMessage);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true, read_at: new Date().toISOString() } : notif
        )
      );
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      // Refresh to get correct state
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      // Refresh to get correct state
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(
    async (id: number) => {
      try {
        await notificationsAPI.deleteNotification(id);
        // Update local state optimistically
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        // Update unread count if deleted notification was unread
        if (deleted && !deleted.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        // Update total
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete notification';
        setError(errorMessage);
        // Refresh to get correct state
        await fetchNotifications();
      }
    },
    [notifications, fetchNotifications]
  );

  const refresh = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch]); // Only run on mount

  // Polling
  useEffect(() => {
    if (!pollInterval || !autoFetch) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, autoFetch, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    total,
    unreadCount,
    pagination: {
      skip: filters.skip || 0,
      limit: filters.limit || 100,
    },
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearError,
  };
}

