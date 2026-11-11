import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const STORAGE_KEYS = {
  INSTALLATION_ID: '@masjid_installation_id_v1',
  LAST_REGISTERED_TOKEN: '@masjid_last_registered_token_v1',
  LAST_REGISTERED_AT: '@masjid_last_registered_at_v1',
  PERMISSION_PROMPTED: '@masjid_push_permission_prompted_v1',
};

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generate standard RFC4122 v4 UUID
 */
function generateUUIDv4(): string {
  const g = globalThis as any;
  if (typeof g !== 'undefined' && g.crypto?.randomUUID) {
    try {
      const generated = g.crypto.randomUUID();
      if (UUID_V4_REGEX.test(generated)) {
        return generated;
      }
    } catch {}
  }

  // Math.random RFC4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type NotificationNavigationCallback = (type: string, recordId: string) => void;

class PushNotificationService {
  private isConfigured = false;
  private isRegistering = false;
  private navigationCallback: NotificationNavigationCallback | null = null;
  private tokenSubscription: Notifications.EventSubscription | null = null;
  private notificationReceivedSubscription: Notifications.EventSubscription | null = null;
  private notificationResponseSubscription: Notifications.EventSubscription | null = null;
  private onNotificationReceivedSync?: () => void;

  /**
   * Retrieve the EAS Project ID from Expo Constants or app config.
   */
  public getProjectId(): string | undefined {
    return (
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'bfd6253f-9c3b-48d3-800a-e43833e77095'
    );
  }

  /**
   * Get or create a persistent installation UUID.
   * Never generates a new UUID if a valid one is already stored.
   */
  public async getOrCreateInstallationId(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLATION_ID);
      if (stored && UUID_V4_REGEX.test(stored)) {
        return stored;
      }

      // Generate a new UUID if missing or corrupted
      const freshId = generateUUIDv4();
      await AsyncStorage.setItem(STORAGE_KEYS.INSTALLATION_ID, freshId);
      return freshId;
    } catch (err) {
      console.warn('[PushNotificationService] Failed to read installation ID from storage:', err);
      return generateUUIDv4();
    }
  }

  /**
   * Configure notification handlers and Android channels
   */
  public async configureNotificationSystem(): Promise<void> {
    if (this.isConfigured) return;

    try {
      // Set foreground notification presentation options
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General Updates',
          description: 'Announcements and Hadith notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1D3B6D',
          sound: 'default',
        });
      }

      this.isConfigured = true;
    } catch (err) {
      console.warn('[PushNotificationService] Error configuring notification channel/handler:', err);
    }
  }

  /**
   * Calls the deployed Supabase Edge Function `register-device`.
   * Accepts installation_id, expo_push_token (nullable), and platform.
   */
  public async registerDevice(installationId: string, pushToken: string | null): Promise<boolean> {
    if (this.isRegistering) {
      return false;
    }

    this.isRegistering = true;
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://otnlqydfbqqmilvghdlg.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      // Compare with last registered token to avoid redundant network calls
      const lastToken = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_TOKEN);
      const tokenKey = pushToken || '__NULL__';

      // If already registered with this exact token in the past 24 hours, skip duplicate call
      const lastRegisteredAt = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_AT);
      if (lastToken === tokenKey && lastRegisteredAt) {
        const hoursSinceLast = (Date.now() - new Date(lastRegisteredAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 24) {
          return true;
        }
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          installation_id: installationId,
          expo_push_token: pushToken,
          platform,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[PushNotificationService] register-device error (${response.status}):`, errorText);
        return false;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REGISTERED_TOKEN, tokenKey);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REGISTERED_AT, new Date().toISOString());
      return true;
    } catch (err) {
      console.warn('[PushNotificationService] Network error during device registration:', err);
      return false;
    } finally {
      this.isRegistering = false;
    }
  }

  /**
   * Request push notification permissions and register token if granted.
   */
  public async requestPermissionsAndRegister(): Promise<{ granted: boolean; token: string | null }> {
    const installationId = await this.getOrCreateInstallationId();

    if (!Device.isDevice) {
      console.log('[PushNotificationService] Not a physical device; push notifications require physical hardware.');
      await this.registerDevice(installationId, null);
      return { granted: false, token: null };
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_PROMPTED, 'true');
      }

      if (finalStatus !== 'granted') {
        await this.registerDevice(installationId, null);
        return { granted: false, token: null };
      }

      const projectId = this.getProjectId();
      const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      const token = tokenResponse.data;

      await this.registerDevice(installationId, token);
      return { granted: true, token };
    } catch (err) {
      console.warn('[PushNotificationService] Permission request failed:', err);
      await this.registerDevice(installationId, null);
      return { granted: false, token: null };
    }
  }

  /**
   * Initializes the push notification subsystem on app startup:
   * 1. Sets up handlers and channels
   * 2. Retrieves the persistent installation UUID
   * 3. Registers installation with null token if permission not granted
   * 4. If permissions already granted, retrieves token and registers
   * 5. Prompts for permission once if undetermined
   * 6. Sets up token refresh and notification response listeners
   */
  public async initialize(
    navigationCallback?: NotificationNavigationCallback,
    onForegroundSync?: () => void
  ): Promise<void> {
    if (navigationCallback) {
      this.navigationCallback = navigationCallback;
    }
    if (onForegroundSync) {
      this.onNotificationReceivedSync = onForegroundSync;
    }

    await this.configureNotificationSystem();

    const installationId = await this.getOrCreateInstallationId();

    if (!Device.isDevice) {
      console.log('[PushNotificationService] Simulator/Emulator detected. Registering device with null token.');
      await this.registerDevice(installationId, null);
      return;
    }

    try {
      // Check current permission state
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let pushToken: string | null = null;

      if (existingStatus === 'granted') {
        try {
          const projectId = this.getProjectId();
          const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
          pushToken = tokenRes.data;
        } catch (tokenErr) {
          console.warn('[PushNotificationService] Failed to get Expo push token:', tokenErr);
        }
      }

      // Always register installation (with token or with null)
      await this.registerDevice(installationId, pushToken);

      // If permission is undetermined and hasn't been prompted yet, request it once
      if (existingStatus === 'undetermined') {
        const hasPrompted = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_PROMPTED);
        if (!hasPrompted) {
          await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_PROMPTED, 'true');
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus === 'granted') {
            try {
              const projectId = this.getProjectId();
              const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
              if (tokenRes.data && tokenRes.data !== pushToken) {
                await this.registerDevice(installationId, tokenRes.data);
              }
            } catch (err) {
              console.warn('[PushNotificationService] Error fetching token after grant:', err);
            }
          }
        }
      }

      // Setup token refresh listener
      if (!this.tokenSubscription) {
        this.tokenSubscription = Notifications.addPushTokenListener(async (tokenData) => {
          console.log('[PushNotificationService] Push token rotated/refreshed:', tokenData.data);
          const currentId = await this.getOrCreateInstallationId();
          await this.registerDevice(currentId, tokenData.data);
        });
      }

      // Setup foreground notification received listener
      if (!this.notificationReceivedSubscription) {
        this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log('[PushNotificationService] Notification received in foreground:', notification.request.content.title);
            if (this.onNotificationReceivedSync) {
              this.onNotificationReceivedSync();
            }
          }
        );
      }

      // Setup notification response (tap) listener
      if (!this.notificationResponseSubscription) {
        this.notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            this.handleNotificationResponse(response);
          }
        );
      }

      // Check cold-start / initial notification response (app opened via tap from terminated state)
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        this.handleNotificationResponse(lastResponse);
      }
    } catch (err) {
      console.warn('[PushNotificationService] Initialization error:', err);
    }
  }

  /**
   * Set or update navigation handler
   */
  public setNavigationCallback(callback: NotificationNavigationCallback | null): void {
    this.navigationCallback = callback;
  }

  /**
   * Process notification tap response and navigate
   */
  public handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      const data = response?.notification?.request?.content?.data as any;
      if (!data) return;

      const type = data.type;
      const recordId = data.record_id || data.recordId;

      if (type && recordId && this.navigationCallback) {
        this.navigationCallback(type, recordId);
      }
    } catch (err) {
      console.warn('[PushNotificationService] Error processing notification tap response:', err);
    }
  }

  /**
   * Cleanup listeners
   */
  public cleanup(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.remove();
      this.tokenSubscription = null;
    }
    if (this.notificationReceivedSubscription) {
      this.notificationReceivedSubscription.remove();
      this.notificationReceivedSubscription = null;
    }
    if (this.notificationResponseSubscription) {
      this.notificationResponseSubscription.remove();
      this.notificationResponseSubscription = null;
    }
  }
}

export const pushNotificationService = new PushNotificationService();

