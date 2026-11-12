import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  INSTALLATION_ID: '@masjid_installation_id_v1',
  LAST_REGISTERED_TOKEN: '@masjid_last_registered_token_v1',
  LAST_REGISTERED_AT: '@masjid_last_registered_at_v1',
};

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Expo Go detection ────────────────────────────────────────────────────────
/**
 * Returns true when running inside the Expo Go app.
 * Push notifications (remote) were removed from Expo Go on Android in SDK 53+.
 * Uses multiple detection strategies:
 *  1. expo's native isRunningInExpoGo()
 *  2. Constants.expoVersion (non-null only inside Expo Go)
 *  3. Constants.executionEnvironment (ExecutionEnvironment.StoreClient)
 *  4. Constants.appOwnership === 'expo'
 */
export function isExpoGo(): boolean {
  try {
    if (typeof isRunningInExpoGo === 'function' && isRunningInExpoGo()) {
      return true;
    }
  } catch {}

  return Boolean(
    (Constants.expoVersion !== null && Constants.expoVersion !== undefined) ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    (Constants as any).executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo' ||
    (Constants as any).appOwnership === 'expo'
  );
}

// ─── UUID generator ───────────────────────────────────────────────────────────
function generateUUIDv4(): string {
  const g = globalThis as any;
  if (typeof g !== 'undefined' && g.crypto?.randomUUID) {
    try {
      const id = g.crypto.randomUUID();
      if (UUID_V4_REGEX.test(id)) return id;
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Public types ─────────────────────────────────────────────────────────────
export type NotificationNavigationCallback = (type: string, recordId: string) => void;

export interface PermissionRegistrationResult {
  granted: boolean;
  token: string | null;
  canAskAgain: boolean;
}

export interface PermissionStatusInfo {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

// ─── Service ──────────────────────────────────────────────────────────────────
class PushNotificationService {
  private isConfigured = false;
  private channelCreated = false;
  private isInitializing = false;
  private isRegistering = false;
  private navigationCallback: NotificationNavigationCallback | null = null;
  private tokenSubscription: Notifications.EventSubscription | null = null;
  private notificationReceivedSubscription: Notifications.EventSubscription | null = null;
  private notificationResponseSubscription: Notifications.EventSubscription | null = null;
  private onForegroundSync?: () => void;

  // ── EAS project ID ──────────────────────────────────────────────────────────
  public getProjectId(): string | undefined {
    return (
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId ??
      'bfd6253f-9c3b-48d3-800a-e43833e77095'
    );
  }

  // ── Persistent installation UUID ────────────────────────────────────────────
  public async getOrCreateInstallationId(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLATION_ID);
      if (stored && UUID_V4_REGEX.test(stored)) return stored;
      const freshId = generateUUIDv4();
      await AsyncStorage.setItem(STORAGE_KEYS.INSTALLATION_ID, freshId);
      return freshId;
    } catch {
      return generateUUIDv4();
    }
  }

  // ── Foreground handler & Android channel ────────────────────────────────────
  /**
   * Sets the foreground notification handler and creates the Android channel.
   * Completely disabled in Expo Go to avoid SDK 53+ crashes.
   */
  public async configureNotificationSystem(): Promise<void> {
    if (isExpoGo()) {
      return;
    }

    // 1. Foreground presentation configuration
    if (!this.isConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      this.isConfigured = true;
    }

    // 2. Android notification channel creation — required before requesting permission
    if (Platform.OS === 'android' && !this.channelCreated) {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General Updates',
          description: 'Announcements and Hadith notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1D3B6D',
          sound: 'default',
        });
        this.channelCreated = true;
        console.log('[PushNotificationService] Android notification channel "default" created successfully.');
      } catch (err) {
        console.warn('[PushNotificationService] Failed to create notification channel:', err);
      }
    }
  }

  // ── Register device with Supabase Edge Function ──────────────────────────────
  public async registerDevice(installationId: string, pushToken: string | null): Promise<boolean> {
    if (this.isRegistering) return false;
    this.isRegistering = true;

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://otnlqydfbqqmilvghdlg.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const tokenKey = pushToken || '__NULL__';

      // Skip redundant call if same token was registered within the last 24 h
      const lastToken = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_TOKEN);
      const lastRegisteredAt = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_AT);
      if (lastToken === tokenKey && lastRegisteredAt) {
        const hoursSinceLast = (Date.now() - new Date(lastRegisteredAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 24) {
          console.log('[PushNotificationService] Supabase registration skipped (token deduplicated within 24h).');
          return true;
        }
      }

      console.log('[PushNotificationService] Registering device with Supabase Edge Function...', {
        installationId,
        hasPushToken: !!pushToken,
        platform,
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          installation_id: installationId,
          expo_push_token: pushToken,
          platform,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[PushNotificationService] register-device error (${response.status}):`, text);
        return false;
      }

      console.log('[PushNotificationService] Supabase device registration succeeded.');
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

  // ── Permission Status Inspection ────────────────────────────────────────────
  /**
   * Reads current notification permissions without prompting the user.
   */
  public async getPermissionStatus(): Promise<PermissionStatusInfo> {
    if (isExpoGo()) {
      return {
        granted: false,
        canAskAgain: false,
        status: Notifications.PermissionStatus.DENIED,
      };
    }

    try {
      const perms = await Notifications.getPermissionsAsync();
      const granted = perms.granted || perms.status === Notifications.PermissionStatus.GRANTED;
      return {
        granted,
        canAskAgain: perms.canAskAgain,
        status: perms.status,
      };
    } catch (err) {
      console.warn('[PushNotificationService] getPermissionStatus error:', err);
      return {
        granted: false,
        canAskAgain: true,
        status: Notifications.PermissionStatus.UNDETERMINED,
      };
    }
  }

  // ── Open App Settings ────────────────────────────────────────────────────────
  /**
   * Directs user to the system app settings to manage notification permissions.
   */
  public async openNotificationSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('[PushNotificationService] Failed to open system settings:', err);
    }
  }

  // ── Manual Permission Request (Callable from UI) ─────────────────────────────
  public async requestPermissionsAndRegister(): Promise<PermissionRegistrationResult> {
    const installationId = await this.getOrCreateInstallationId();

    // 1. In Expo Go, remote push notifications are unsupported
    if (isExpoGo()) {
      console.log('[PushNotificationService] [Manual Request] Running in Expo Go – remote push notifications are disabled.');
      await this.registerDevice(installationId, null);
      return { granted: false, token: null, canAskAgain: false };
    }

    // 2. Emulator guard
    if (!Device.isDevice) {
      console.log('[PushNotificationService] [Manual Request] Simulator/Emulator detected – registering with null token.');
      await this.registerDevice(installationId, null);
      return { granted: false, token: null, canAskAgain: false };
    }

    // 3. Ensure notification system and Android channel are configured
    await this.configureNotificationSystem();

    try {
      // 4. Inspect existing permissions
      const initialPermissions = await Notifications.getPermissionsAsync();
      const initialGranted =
        initialPermissions.granted || initialPermissions.status === Notifications.PermissionStatus.GRANTED;

      console.log('[PushNotificationService] [Manual Request] Initial permission status:', {
        status: initialPermissions.status,
        granted: initialPermissions.granted,
        canAskAgain: initialPermissions.canAskAgain,
      });

      let finalGranted = initialGranted;
      let canAskAgain = initialPermissions.canAskAgain;

      // 5. If not granted and can ask again, prompt the user
      if (!initialGranted) {
        if (canAskAgain) {
          console.log('[PushNotificationService] [Manual Request] Prompting user for permission...');
          const requestResult = await Notifications.requestPermissionsAsync();
          console.log('[PushNotificationService] [Manual Request] Permission prompt result:', {
            status: requestResult.status,
            granted: requestResult.granted,
            canAskAgain: requestResult.canAskAgain,
          });
          finalGranted = requestResult.granted || requestResult.status === Notifications.PermissionStatus.GRANTED;
          canAskAgain = requestResult.canAskAgain;
        } else {
          console.log('[PushNotificationService] [Manual Request] Permission permanently denied (canAskAgain: false). User must enable in settings.');
          await this.registerDevice(installationId, null);
          return { granted: false, token: null, canAskAgain: false };
        }
      }

      if (!finalGranted) {
        console.log('[PushNotificationService] [Manual Request] Permission was not granted.');
        await this.registerDevice(installationId, null);
        return { granted: false, token: null, canAskAgain };
      }

      // 6. Generate Expo push token only after permission is granted
      const projectId = this.getProjectId();
      console.log('[PushNotificationService] [Manual Request] Expo project ID availability:', {
        hasProjectId: !!projectId,
        projectId: projectId ?? 'NOT_FOUND',
      });

      let token: string | null = null;
      try {
        const tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        token = tokenResult.data;
        console.log('[PushNotificationService] [Manual Request] Push token generation SUCCESS:', {
          tokenPrefix: token ? `${token.substring(0, 15)}...` : null,
        });
      } catch (tokenErr) {
        console.warn('[PushNotificationService] [Manual Request] Push token generation FAILURE:', tokenErr);
      }

      // 7. Register token with Supabase Edge Function
      const registered = await this.registerDevice(installationId, token);
      console.log('[PushNotificationService] [Manual Request] Supabase device registration:', registered ? 'SUCCESS' : 'FAILURE');

      return { granted: true, token, canAskAgain: true };
    } catch (err) {
      console.warn('[PushNotificationService] [Manual Request] Request failed with exception:', err);
      await this.registerDevice(installationId, null);
      return { granted: false, token: null, canAskAgain: false };
    }
  }

  // ── Main automatic initialization ───────────────────────────────────────────
  /**
   * Call once from NotificationProvider on mount.
   * Works safely in Expo Go, simulators, and production builds.
   */
  public async initialize(
    navigationCallback?: NotificationNavigationCallback,
    onForegroundSync?: () => void
  ): Promise<void> {
    if (navigationCallback) this.navigationCallback = navigationCallback;
    if (onForegroundSync) this.onForegroundSync = onForegroundSync;

    // Prevent duplicate simultaneous initializations
    if (this.isInitializing) {
      console.log('[PushNotificationService] initialize() is already in progress, skipping duplicate call.');
      return;
    }
    this.isInitializing = true;

    try {
      const runningInExpoGo = isExpoGo();
      const installationId = await this.getOrCreateInstallationId();

      // Diagnostics: Environment
      console.log('[PushNotificationService] Diagnostics:', {
        physicalDevice: Device.isDevice,
        expoGo: runningInExpoGo,
        platform: Platform.OS,
        androidVersion: Platform.OS === 'android' ? Platform.Version : 'N/A',
        deviceModel: Device.modelName ?? 'unknown',
      });

      // 1. Expo Go: Remote push notifications are completely disabled on Android SDK 53+
      if (runningInExpoGo) {
        console.log('[PushNotificationService] Running in Expo Go – remote push notifications disabled. Registering null device token with Supabase.');
        await this.registerDevice(installationId, null);
        return;
      }

      // 2. Simulator / emulator: register null token
      if (!Device.isDevice) {
        console.log('[PushNotificationService] Simulator/Emulator detected – registering null token without push capabilities.');
        await this.registerDevice(installationId, null);
        return;
      }

      // 3. Configure foreground notification handler and Android channel (standalone / dev build only)
      await this.configureNotificationSystem();

      // 4. Physical device: Check permissions with Notifications.getPermissionsAsync()
      const initialPermissions = await Notifications.getPermissionsAsync();
      const initialGranted =
        initialPermissions.granted || initialPermissions.status === Notifications.PermissionStatus.GRANTED;

      console.log('[PushNotificationService] Initial permission check:', {
        status: initialPermissions.status,
        granted: initialPermissions.granted,
        canAskAgain: initialPermissions.canAskAgain,
      });

      let finalGranted = initialGranted;

      if (!initialGranted) {
        if (initialPermissions.canAskAgain) {
          // Permission is not granted and can be requested again
          console.log('[PushNotificationService] Permission undetermined or can ask again; requesting permission...');
          const requestResult = await Notifications.requestPermissionsAsync();
          console.log('[PushNotificationService] Permission request result:', {
            status: requestResult.status,
            granted: requestResult.granted,
            canAskAgain: requestResult.canAskAgain,
          });
          finalGranted = requestResult.granted || requestResult.status === Notifications.PermissionStatus.GRANTED;
        } else {
          // Permission is permanently denied; do not repeatedly prompt
          console.log(
            '[PushNotificationService] Permission is permanently denied (canAskAgain: false). Skipping repeated request. UI should guide user to Android app settings.'
          );
        }
      } else {
        console.log('[PushNotificationService] Permission is already granted. Skipping unnecessary prompt.');
      }

      // 5. If granted, generate Expo push token using existing project ID
      let pushToken: string | null = null;
      if (finalGranted) {
        const projectId = this.getProjectId();
        console.log('[PushNotificationService] Expo project ID availability:', {
          hasProjectId: !!projectId,
          projectId: projectId ?? 'NOT_FOUND',
        });

        try {
          const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
          pushToken = data;
          console.log('[PushNotificationService] Push token generation SUCCESS:', {
            tokenPrefix: pushToken ? `${pushToken.substring(0, 15)}...` : null,
          });
        } catch (tokenErr) {
          console.warn('[PushNotificationService] Push token generation FAILURE:', tokenErr);
        }
      } else {
        console.log('[PushNotificationService] Permission not granted; registering null push token with Supabase.');
      }

      // 6. Register device in Supabase Edge Function
      const registered = await this.registerDevice(installationId, pushToken);
      console.log('[PushNotificationService] Supabase device registration result:', {
        success: registered,
        installationId,
        hasPushToken: !!pushToken,
      });

      // 7. Event listeners: token refresh, foreground reception, tap responses
      if (!this.tokenSubscription) {
        this.tokenSubscription = Notifications.addPushTokenListener(async ({ data: newToken }) => {
          console.log('[PushNotificationService] Push token refreshed event:', newToken);
          const id = await this.getOrCreateInstallationId();
          await this.registerDevice(id, newToken);
        });
      }

      if (!this.notificationReceivedSubscription) {
        this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener(() => {
          if (this.onForegroundSync) this.onForegroundSync();
        });
      }

      if (!this.notificationResponseSubscription) {
        this.notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
          (response) => this.handleNotificationResponse(response)
        );
      }

      // Handle cold-start tap (app opened from terminated state via notification)
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        this.handleNotificationResponse(lastResponse);
      }
    } catch (err) {
      console.warn('[PushNotificationService] Initialization error:', err);
    } finally {
      this.isInitializing = false;
    }
  }

  // ── Navigation callback ──────────────────────────────────────────────────────
  public setNavigationCallback(callback: NotificationNavigationCallback | null): void {
    this.navigationCallback = callback;
  }

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
      console.warn('[PushNotificationService] Error handling notification tap:', err);
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  public cleanup(): void {
    this.tokenSubscription?.remove();
    this.tokenSubscription = null;
    this.notificationReceivedSubscription?.remove();
    this.notificationReceivedSubscription = null;
    this.notificationResponseSubscription?.remove();
    this.notificationResponseSubscription = null;
  }
}

export const pushNotificationService = new PushNotificationService();
