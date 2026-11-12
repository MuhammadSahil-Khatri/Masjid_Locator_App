import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AppNotification, NotificationType } from '../types/notifications';
import { notificationService } from '../services/notificationService';
import { pushNotificationService, PermissionStatusInfo, PermissionRegistrationResult } from '../services/pushNotificationService';
import { onlineManager } from '@tanstack/react-query';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  hasUnread: boolean;
  loading: boolean;
  refreshing: boolean;
  markAsRead: (id: string) => Promise<void>;
  markRecordAsRead: (type: NotificationType, recordId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sync: () => Promise<void>;
  requestNotificationPermissions: () => Promise<PermissionRegistrationResult>;
  getNotificationPermissionStatus: () => Promise<PermissionStatusInfo>;
  openNotificationSettings: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active');

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  // Sync execution with Supabase public.notifications
  const sync = useCallback(async () => {
    try {
      setRefreshing(true);
      const updated = await notificationService.sync();
      setNotifications(updated);
    } catch (err) {
      console.warn('[NotificationContext] Sync error:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Request permissions manually if needed
  const requestNotificationPermissions = useCallback(async () => {
    const result = await pushNotificationService.requestPermissionsAndRegister();
    return result;
  }, []);

  // Inspect permission status without prompt
  const getNotificationPermissionStatus = useCallback(async () => {
    return await pushNotificationService.getPermissionStatus();
  }, []);

  // Guide user to system settings
  const openNotificationSettings = useCallback(async () => {
    await pushNotificationService.openNotificationSettings();
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic local update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
    );
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications(updated);
    } catch (err) {
      console.warn('[NotificationContext] markAsRead failed:', err);
    }
  }, []);

  // Mark record as read by type and Supabase UUID (Read synchronization)
  const markRecordAsRead = useCallback(async (type: NotificationType, recordId: string) => {
    const compositeId = `${type}:${recordId}`;
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === compositeId || (item.type === type && item.recordId === recordId)
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    );
    try {
      const updated = await notificationService.markRecordAsRead(type, recordId);
      setNotifications(updated);
    } catch (err) {
      console.warn('[NotificationContext] markRecordAsRead failed:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })));
    try {
      const updated = await notificationService.markAllAsRead();
      setNotifications(updated);
    } catch (err) {
      console.warn('[NotificationContext] markAllAsRead failed:', err);
    }
  }, []);

  // 1. Initial hydration from storage, Realtime subscription & Push registration setup
  useEffect(() => {
    let isMounted = true;

    // Load persisted cache first for instant UI response
    notificationService.loadStoredNotifications().then((cached) => {
      if (isMounted) {
        setNotifications(cached);
        setLoading(false);
      }
    });

    // Initialize push notifications (channels, device registration, listeners)
    pushNotificationService.initialize(undefined, () => {
      // Trigger sync when foreground push notification arrives
      sync();
    });

    // Subscribe to realtime changes (subscribe first, then catch-up sync)
    const cleanupRealtime = notificationService.subscribeRealtime(
      (newNotif) => {
        if (!isMounted) return;
        setNotifications((prev) => {
          if (
            prev.some(
              (n) =>
                n.id === newNotif.id ||
                (newNotif.serverNotificationId && n.serverNotificationId === newNotif.serverNotificationId)
            )
          ) {
            return prev;
          }
          return notificationService.applyRetentionRules([newNotif, ...prev]);
        });
      },
      (removedInfo) => {
        if (!isMounted) return;
        setNotifications((prev) =>
          prev.filter((item) => {
            if (removedInfo.id && item.serverNotificationId === removedInfo.id) return false;
            if (removedInfo.id && item.id === removedInfo.id) return false;
            if (
              removedInfo.type &&
              removedInfo.record_id &&
              item.id === `${removedInfo.type}:${removedInfo.record_id}`
            ) {
              return false;
            }
            if (removedInfo.record_id && item.recordId === removedInfo.record_id) return false;
            return true;
          })
        );
      }
    );

    return () => {
      isMounted = false;
      cleanupRealtime();
      pushNotificationService.cleanup();
    };
  }, [sync]);

  // 2. Background handling: AppState listener (returning from background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, perform sync
        sync();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [sync]);

  // 3. Reconnection handling: TanStack onlineManager
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((isOnline) => {
      if (isOnline) {
        sync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sync]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        loading,
        refreshing,
        markAsRead,
        markRecordAsRead,
        markAllAsRead,
        sync,
        requestNotificationPermissions,
        getNotificationPermissionStatus,
        openNotificationSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
