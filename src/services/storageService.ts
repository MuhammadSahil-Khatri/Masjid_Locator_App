/**
 * storageService.ts
 *
 * Compact device-local storage layer:
 *   - Native builds: uses react-native-mmkv (synchronous, fastest)
 *   - Expo Go / Web: uses an in-memory map backed by AsyncStorage for persistence
 *
 * Dedicated strictly to device-local state:
 *   - Last known GPS coordinates
 *   - GPS reverse-geocoded city name
 *   - Qibla compass bearing calibration
 *
 * Server / API data (mosques, prayer times, announcements, hadith) is managed
 * exclusively by TanStack Query.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_KEY = 'user_last_location';
const CITY_NAME_KEY = 'gps_city_name';
const QIBLA_KEY = 'qibla_cache';

const LOCAL_DEVICE_KEYS = [
  LOCATION_KEY,
  CITY_NAME_KEY,
  QIBLA_KEY,
];

// ── In-memory sync cache (populated at hydration time) ─────────────────────
const memoryCache = new Map<string, string>();

// ── Try to load native MMKV, fall back gracefully ─────────────────────────
let nativeStorage: {
  set: (k: string, v: string) => void;
  getString: (k: string) => string | undefined;
  remove?: (k: string) => boolean | void;
  delete?: (k: string) => boolean | void;
} | null = null;

try {
  const { createMMKV } = require('react-native-mmkv');
  nativeStorage = createMMKV();
} catch {
  // Not available in Expo Go or Web – will use AsyncStorage fallback
}

// ── Unified helpers ────────────────────────────────────────────────────────

function syncSet(key: string, value: string): void {
  memoryCache.set(key, value);
  try {
    if (nativeStorage && typeof nativeStorage.set === 'function') {
      nativeStorage.set(key, value);
      return;
    }
  } catch (e) {
    console.warn('[storageService] nativeStorage.set failed:', e);
  }
  // Fallback to AsyncStorage
  AsyncStorage.setItem(key, value).catch((e) =>
    console.warn('[storageService] AsyncStorage.setItem failed:', e)
  );
}

function syncGet(key: string): string | undefined {
  // Always read from the in-memory map for O(1) synchronous access
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  // If MMKV is available, also check there
  try {
    if (nativeStorage && typeof nativeStorage.getString === 'function') {
      const val = nativeStorage.getString(key);
      if (val !== undefined) {
        memoryCache.set(key, val);
      }
      return val;
    }
  } catch (e) {
    console.warn('[storageService] nativeStorage.getString failed:', e);
  }
  return undefined;
}

function syncDelete(key: string): void {
  memoryCache.delete(key);
  try {
    if (nativeStorage) {
      if (typeof nativeStorage.remove === 'function') {
        nativeStorage.remove(key);
      } else if (typeof nativeStorage.delete === 'function') {
        nativeStorage.delete(key);
      }
    }
  } catch (e) {
    console.warn('[storageService] nativeStorage deletion failed:', e);
  }
  AsyncStorage.removeItem(key).catch(() => {});
}

// ── Exported interfaces ────────────────────────────────────────────────────

export interface CachedLocation {
  lat: number;
  lng: number;
}

export interface CachedQibla {
  bearing: number;
  city: string;
}

// ── Service ────────────────────────────────────────────────────────────────

export const storageService = {
  /**
   * Hydrate in-memory cache from AsyncStorage for device-local keys.
   * Call once at app startup before rendering.
   */
  async hydrate(): Promise<void> {
    if (nativeStorage) {
      // MMKV is already synchronous and persistent; no hydration needed
      return;
    }
    try {
      const pairs = await AsyncStorage.multiGet(LOCAL_DEVICE_KEYS);
      for (const [key, value] of pairs) {
        if (value !== null) {
          memoryCache.set(key, value);
        }
      }
    } catch (e) {
      console.warn('[storageService] hydrate failed:', e);
    }
  },

  // ── Device Location ───────────────────────────────────────────────────────

  saveLocation(lat: number, lng: number): void {
    syncSet(LOCATION_KEY, JSON.stringify({ lat, lng }));
  },

  getCachedLocation(): CachedLocation | null {
    const raw = syncGet(LOCATION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // ── GPS City Name ─────────────────────────────────────────────────────────

  saveGpsCity(city: string): void {
    syncSet(CITY_NAME_KEY, city);
  },

  getGpsCity(): string | null {
    return syncGet(CITY_NAME_KEY) || null;
  },

  // ── Qibla Bearing ─────────────────────────────────────────────────────────

  saveQibla(data: CachedQibla): void {
    syncSet(QIBLA_KEY, JSON.stringify(data));
  },

  getCachedQibla(): CachedQibla | null {
    const raw = syncGet(QIBLA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // ── Clear Device Local Data (Purge / Logout) ──────────────────────────────

  async clearLocalData(): Promise<void> {
    for (const key of LOCAL_DEVICE_KEYS) {
      syncDelete(key);
    }
  },
};

