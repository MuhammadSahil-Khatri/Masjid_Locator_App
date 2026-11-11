import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AppNotification, NotificationType } from '../types/notifications';
import { onlineManager } from '@tanstack/react-query';

const STORAGE_KEYS = {
  NOTIFICATIONS: '@masjid_notifications_list_v1',
  LAST_SYNC: '@masjid_notifications_last_sync_v1',
  BOOTSTRAP_DONE: '@masjid_notifications_bootstrap_done_v1',
};

const MAX_HISTORY_LIMIT = 100;
const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000; // 72 hours
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class NotificationService {
  private realtimeChannel: RealtimeChannel | null = null;
  private isSyncing = false;

  /**
   * Enforces retention and expiration requirements:
   * 1. In-app notifications remain available for 72 hours (local check).
   * 2. Expired notifications disappear from the in-app list.
   * 3. Retain unread notifications until read (within valid 72-hour window).
   * 4. Remove read notifications older than 30 days.
   * 5. Cap local history at 100 records (retaining all unread, dropping oldest read).
   */
  public applyRetentionRules(notifications: AppNotification[]): AppNotification[] {
    const now = Date.now();
    const readCutoffDate = now - THIRTY_DAYS_MS;

    // Filter out expired notifications locally (72 hours or explicit expiresAt)
    const valid = notifications.filter((item) => {
      // 1. Check explicit expiresAt timestamp if present
      if (item.expiresAt) {
        const expTime = new Date(item.expiresAt).getTime();
        if (!isNaN(expTime) && expTime <= now) {
          return false;
        }
      }

      // 2. Check 72-hour window from createdAt
      const createdTime = new Date(item.createdAt).getTime();
      if (!isNaN(createdTime) && now - createdTime > SEVENTY_TWO_HOURS_MS) {
        return false;
      }

      // 3. Filter out read notifications older than 30 days
      if (item.isRead) {
        const readTime = new Date(item.readAt || item.createdAt).getTime();
        if (!isNaN(readTime) && readTime < readCutoffDate) {
          return false;
        }
      }

      return true;
    });

    // Sort newest first
    valid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Cap at 100 records
    if (valid.length <= MAX_HISTORY_LIMIT) {
      return valid;
    }

    const unreadItems = valid.filter((n) => !n.isRead);
    const readItems = valid.filter((n) => n.isRead);

    // Keep all unread items, fill remainder up to 100 with newest read items
    const maxReadToKeep = Math.max(0, MAX_HISTORY_LIMIT - unreadItems.length);
    const retainedReadItems = readItems.slice(0, maxReadToKeep);

    const result = [...unreadItems, ...retainedReadItems];
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }

  /**
   * Load persisted notifications from AsyncStorage with retention/expiration rules applied
   */
  public async loadStoredNotifications(): Promise<AppNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!raw) return [];
      const parsed: AppNotification[] = JSON.parse(raw);
      return Array.isArray(parsed) ? this.applyRetentionRules(parsed) : [];
    } catch (err) {
      console.warn('[NotificationService] Failed to load stored notifications:', err);
      return [];
    }
  }

  /**
   * Save notifications to AsyncStorage with retention rules applied
   */
  public async saveStoredNotifications(notifications: AppNotification[]): Promise<AppNotification[]> {
    try {
      const cleaned = this.applyRetentionRules(notifications);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleaned));
      return cleaned;
    } catch (err) {
      console.warn('[NotificationService] Failed to save notifications:', err);
      return notifications;
    }
  }

  /**
   * Check whether first-time installation bootstrap has been completed
   */
  public async isBootstrapDone(): Promise<boolean> {
    try {
      const done = await AsyncStorage.getItem(STORAGE_KEYS.BOOTSTRAP_DONE);
      return done === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark a single notification as read by composite ID (`${type}:${recordId}`)
   */
  public async markAsRead(notificationId: string): Promise<AppNotification[]> {
    const list = await this.loadStoredNotifications();
    let hasChanged = false;

    const updated = list.map((item) => {
      if (item.id === notificationId && !item.isRead) {
        hasChanged = true;
        return {
          ...item,
          isRead: true,
          readAt: new Date().toISOString(),
        };
      }
      return item;
    });

    if (hasChanged) {
      return this.saveStoredNotifications(updated);
    }
    return list;
  }

  /**
   * Mark notification as read by content type and original record UUID
   */
  public async markRecordAsRead(type: NotificationType, recordId: string): Promise<AppNotification[]> {
    const compositeId = `${type}:${recordId}`;
    return this.markAsRead(compositeId);
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<AppNotification[]> {
    const list = await this.loadStoredNotifications();
    const now = new Date().toISOString();
    const updated = list.map((item) => ({
      ...item,
      isRead: true,
      readAt: item.readAt || now,
    }));
    return this.saveStoredNotifications(updated);
  }

  /**
   * Core synchronization function with Supabase `notifications` table:
   * - Supabase `public.notifications` is the source of truth for notification existence
   * - Queries active notifications where `expires_at > now()`
   * - Preserves existing composite keys `${type}:${recordId}` and local read/unread state
   * - Removes notifications that no longer exist on the server (e.g. deleted or expired)
   * - First install (bootstrap): marks initial items as read
   * - Subsequent syncs: new items are marked unread
   */
  public async sync(): Promise<AppNotification[]> {
    if (this.isSyncing) {
      return this.loadStoredNotifications();
    }

    if (!onlineManager.isOnline()) {
      return this.loadStoredNotifications();
    }

    this.isSyncing = true;
    try {
      const isBootstrap = !(await this.isBootstrapDone());
      const currentList = await this.loadStoredNotifications();
      const existingMap = new Map<string, AppNotification>();
      currentList.forEach((n) => existingMap.set(n.id, n));

      const nowIso = new Date().toISOString();

      // Query active server notifications
      const { data: serverNotifications, error } = await supabase
        .from('notifications')
        .select('id, type, record_id, title, body, created_at, expires_at')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[NotificationService] Fetch error from public.notifications:', error.message);
        return currentList;
      }

      const syncTimestamp = new Date().toISOString();
      const reconciledList: AppNotification[] = [];

      if (serverNotifications && serverNotifications.length > 0) {
        for (const row of serverNotifications) {
          const type = row.type as NotificationType;
          const compositeId = `${type}:${row.record_id}`;
          const existing = existingMap.get(compositeId);

          if (existing) {
            // Preserve local read state, update title/body/expiresAt
            reconciledList.push({
              ...existing,
              title: row.title || (type === 'hadith' ? 'Hadith' : 'Announcement'),
              description: row.body || '',
              expiresAt: row.expires_at,
              serverNotificationId: row.id,
            });
          } else {
            // New record from server
            reconciledList.push({
              id: compositeId,
              recordId: row.record_id,
              type,
              title: row.title || (type === 'hadith' ? 'Hadith' : 'Announcement'),
              description: row.body || '',
              createdAt: row.created_at,
              expiresAt: row.expires_at,
              serverNotificationId: row.id,
              // Initial sync records are marked as read; subsequent new records are unread
              isRead: isBootstrap,
              readAt: isBootstrap ? syncTimestamp : undefined,
            });
          }
        }
      }

      // Reconciled list contains only active notifications that currently exist on server
      const saved = await this.saveStoredNotifications(reconciledList);

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTimestamp);
      if (isBootstrap) {
        await AsyncStorage.setItem(STORAGE_KEYS.BOOTSTRAP_DONE, 'true');
      }

      return saved;
    } catch (err) {
      console.warn('[NotificationService] Sync failed:', err);
      return this.loadStoredNotifications();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Subscribe to Supabase Realtime changes on `public.notifications`:
   * - INSERT: Add the new notification to the local list (deduplicating using existing identifiers)
   * - DELETE: Remove the corresponding notification
   * - Reconnection: Resynchronize from server
   */
  public subscribeRealtime(
    onNotificationAdded: (item: AppNotification) => void,
    onNotificationRemoved?: (removed: { id?: string; type?: string; record_id?: string }) => void
  ): () => void {
    if (this.realtimeChannel) {
      try {
        supabase.removeChannel(this.realtimeChannel);
      } catch {}
      this.realtimeChannel = null;
    }

    const channel = supabase.channel('public:notifications');

    // 1. Listen for new notifications (INSERT)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      async (payload) => {
        const item = payload.new as any;
        if (!item || !item.type || !item.record_id) return;

        // Check expiration locally
        if (item.expires_at && new Date(item.expires_at).getTime() <= Date.now()) return;

        const type = item.type as NotificationType;
        const compositeId = `${type}:${item.record_id}`;
        const existing = await this.loadStoredNotifications();

        if (existing.some((n) => n.id === compositeId || (item.id && n.serverNotificationId === item.id))) {
          return; // Deduplicate
        }

        const newNotification: AppNotification = {
          id: compositeId,
          recordId: item.record_id,
          type,
          title: item.title || (type === 'hadith' ? 'Hadith' : 'Announcement'),
          description: item.body || '',
          createdAt: item.created_at || new Date().toISOString(),
          expiresAt: item.expires_at,
          serverNotificationId: item.id,
          isRead: false,
        };

        const updated = await this.saveStoredNotifications([newNotification, ...existing]);
        onNotificationAdded(newNotification);
      }
    );

    // 2. Listen for deleted notifications (DELETE)
    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'notifications' },
      async (payload) => {
        const oldItem = payload.old as any;
        if (!oldItem) return;

        const existing = await this.loadStoredNotifications();
        const updated = existing.filter((n) => {
          if (oldItem.id && n.serverNotificationId === oldItem.id) return false;
          if (oldItem.id && n.id === oldItem.id) return false;
          if (oldItem.type && oldItem.record_id && n.id === `${oldItem.type}:${oldItem.record_id}`) return false;
          if (oldItem.record_id && n.recordId === oldItem.record_id) return false;
          return true;
        });

        if (updated.length !== existing.length) {
          await this.saveStoredNotifications(updated);
          if (onNotificationRemoved) {
            onNotificationRemoved(oldItem);
          }
        }
      }
    );

    // 3. Catch-up sync on subscription connection
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.sync();
      }
    });

    this.realtimeChannel = channel;

    return () => {
      if (this.realtimeChannel) {
        try {
          supabase.removeChannel(this.realtimeChannel);
        } catch {}
        this.realtimeChannel = null;
      }
    };
  }

  /**
   * Fetch single announcement by UUID for Detail screen
   */
  public async fetchAnnouncementById(id: string) {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, mosque_id, category_id, description_en, description_ur, is_active, created_at, updated_at, announcement_categories(name_en, name_ur), mosques(name)')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data;
  }

  /**
   * Fetch single Hadith by UUID for Detail screen
   */
  public async fetchHadithById(id: string) {
    const { data, error } = await supabase
      .from('hadith')
      .select('id, arabic_text, urdu_translation, english_translation, reference, is_active, created_at, updated_at')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data;
  }
}

export const notificationService = new NotificationService();
