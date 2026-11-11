/**
 * In-App Notification Types
 */

export type NotificationType = 'announcement' | 'hadith';

export interface AppNotification {
  /** Composite key: `${type}:${recordId}` used for deduplication */
  id: string;
  /** Original Supabase record UUID */
  recordId: string;
  /** Content category */
  type: NotificationType;
  /** Title / Heading */
  title: string;
  /** Short text / preview / description */
  description: string;
  /** Full text details if available */
  descriptionUr?: string;
  descriptionEn?: string;
  arabicText?: string;
  reference?: string;
  categoryName?: string;
  mosqueName?: string;
  /** Timestamp when original record was created */
  createdAt: string;
  /** Read status */
  isRead: boolean;
  /** Timestamp when record was marked read */
  readAt?: string;
  /** Server notification UUID from public.notifications */
  serverNotificationId?: string;
  /** Server expiration timestamp */
  expiresAt?: string;
}

