import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  INSTALLATION_ID: '@masjid_installation_id_v1',
  LAST_REGISTERED_TOKEN: '@masjid_last_registered_token_v1',
  LAST_REGISTERED_AT: '@masjid_last_registered_at_v1',
};

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Expo Go detection ────────────────────────────────────────────────────────
/**
 * Returns true when running inside Expo Go.
 * Push notifications (remote) are not available in Expo Go since SDK 53.
 * Everything except the channel/token/remote-listener code still runs.
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
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
   * Safe to call in any environment; skips the channel in Expo Go gracefully.
   * Channel creation MUST precede permission requests on Android.
   */
  public async configureNotificationSystem(): Promise<void> {
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
    if (Platform.OS === 'android' && !isExpoGo() && !this.channelCreated) {
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
    // 1. Always ensure notification system and Android channel are configured first
    await this.configureNotificationSystem();

    const installationId = await this.getOrCreateInstallationId();

    // 2. Preserve Expo Go and physical-device checks
    if (isExpoGo()) {
      console.log('[PushNotificationService] [Manual Request] Running in Expo Go – remote push setup skipped.');
      await this.registerDevice(installationId, null);
      return { granted: false, token: null, canAskAgain: false };
    }

    if (!Device.isDevice) {
      console.log('[PushNotificationService] [Manual Request] Simulator/Emulator detected – registering with null token.');
      await this.registerDevice(installationId, null);
      return { granted: false, token: null, canAskAgain: false };
    }

    try {
      // 3. Inspect existing permissions
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

      // 4. If not granted and can ask again, prompt the user
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

      // 5. Generate Expo push token only after permission is granted
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

      // 6. Register token with Supabase Edge Function
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
   *
   * Flow:
   *  1. Configure foreground handler and create Android channel (before permission checks)
   *  2. Log environment diagnostics (device, Expo Go, OS version)
   *  3. Check current permission status via getPermissionsAsync()
   *  4. If granted: fetch push token and register device
   *  5. If not granted and canAskAgain is true: request permission via requestPermissionsAsync()
   *  6. If denied and canAskAgain is false: do NOT repeatedly prompt (expose settings guidance)
   *  7. Register device with Supabase (pushToken if granted, null if not)
   *  8. Set up listeners (refresh, foreground sync, tap responses)
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
      // 1. Configure foreground notification handler and Android channel
      await this.configureNotificationSystem();

      const installationId = await this.getOrCreateInstallationId();

      // Diagnostics: Environment
      console.log('[PushNotificationService] Diagnostics:', {
        physicalDevice: Device.isDevice,
        expoGo: isExpoGo(),
        platform: Platform.OS,
        androidVersion: Platform.OS === 'android' ? Platform.Version : 'N/A',
        deviceModel: Device.modelName ?? 'unknown',
      });

      // 2. Expo Go: register null token and exit push-specific setup
      if (isExpoGo()) {
        console.log('[PushNotificationService] Running in Expo Go – remote push setup skipped.');
        await this.registerDevice(installationId, null);
        return;
      }

      // 3. Simulator / emulator: register null token
      if (!Device.isDevice) {
        console.log('[PushNotificationService] Simulator/Emulator detected – registering null token without push capabilities.');
        await this.registerDevice(installationId, null);
        return;
      }

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
