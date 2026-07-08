/**
 * storageService.ts
 *
 * Hybrid storage layer:
 *   - Native builds: uses react-native-mmkv (synchronous, fastest)
 *   - Expo Go / Web: uses an in-memory map backed by AsyncStorage for persistence
 *
 * All public read methods are synchronous (reads from the in-memory map).
 * Writes are synchronous to memory AND fire-and-forget to the persistence layer.
 * Call `storageService.hydrate()` once at app startup to load AsyncStorage
 * data into the in-memory map before rendering.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_KEY = 'user_last_location';
const PRAYER_TIMES_KEY = 'prayer_times_cache';
const QIBLA_KEY = 'qibla_cache';
const CACHE_VERSION_KEY = 'cache_version';
const NEARBY_MOSQUES_KEY = 'nearby_mosques_cache';
const ANNOUNCEMENTS_KEY = 'announcements_cache';
const HADITH_KEY = 'hadith_cache';
const ALL_MOSQUES_KEY = 'all_mosques_cache';
// Bump this whenever the prayer times format changes to auto-purge old cache
const CACHE_VERSION = '2'; // v2: 12-hour AM/PM format

const ALL_KEYS = [
  LOCATION_KEY,
  PRAYER_TIMES_KEY,
  QIBLA_KEY,
  CACHE_VERSION_KEY,
  NEARBY_MOSQUES_KEY,
  ANNOUNCEMENTS_KEY,
  HADITH_KEY,
  ALL_MOSQUES_KEY,
];

// ── In-memory sync cache (populated at hydration time) ─────────────────────
const memoryCache = new Map<string, string>();

// ── Try to load native MMKV, fall back gracefully ─────────────────────────
let nativeStorage: { set: (k: string, v: string) => void; getString: (k: string) => string | undefined } | null = null;

try {
  const { createMMKV } = require('react-native-mmkv');
  nativeStorage = createMMKV();
} catch {
  // Not available in Expo Go or Web – will use AsyncStorage fallback
}

// ── Unified helpers ────────────────────────────────────────────────────────

function syncSet(key: string, value: string): void {
  memoryCache.set(key, value);
  if (nativeStorage) {
    nativeStorage.set(key, value);
  } else {
    // Fire-and-forget async write for persistence
    AsyncStorage.setItem(key, value).catch((e) =>
      console.warn('[storageService] AsyncStorage.setItem failed:', e)
    );
  }
}

function syncGet(key: string): string | undefined {
  // Always read from the in-memory map for O(1) synchronous access
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  // If MMKV is available, also check there (covers fresh installs where hydrate hasn't run)
  if (nativeStorage) {
    const val = nativeStorage.getString(key);
    if (val !== undefined) {
      memoryCache.set(key, val);
    }
    return val;
  }
  return undefined;
}

// ── Exported interfaces ────────────────────────────────────────────────────

export interface CachedLocation {
  lat: number;
  lng: number;
}

export interface CachedPrayerTimes {
  timings: {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
  hijriDate: string;
  gregorianDate: string;
  city: string;
  fetchedAtDate?: string;
}

export interface CachedQibla {
  bearing: number;
  city: string;
}

// ── Service ────────────────────────────────────────────────────────────────

export const storageService = {
  /**
   * Hydrate the in-memory cache from AsyncStorage.
   * Call this ONCE at app startup (before rendering) when not using native MMKV.
   * On native builds with MMKV this is a no-op.
   */
  async hydrate(): Promise<void> {
    if (nativeStorage) {
      // On MMKV, check version and purge if stale
      const storedVersion = nativeStorage.getString(CACHE_VERSION_KEY);
      if (storedVersion !== CACHE_VERSION) {
        nativeStorage.set(PRAYER_TIMES_KEY, '');
        nativeStorage.set(CACHE_VERSION_KEY, CACHE_VERSION);
        memoryCache.delete(PRAYER_TIMES_KEY);
      }
      return;
    }
    try {
      const pairs = await AsyncStorage.multiGet(ALL_KEYS);
      for (const [key, value] of pairs) {
        if (value !== null) {
          memoryCache.set(key, value);
        }
      }
      // Purge stale cache if version mismatch
      const storedVersion = memoryCache.get(CACHE_VERSION_KEY);
      if (storedVersion !== CACHE_VERSION) {
        memoryCache.delete(PRAYER_TIMES_KEY);
        await AsyncStorage.removeItem(PRAYER_TIMES_KEY);
        await AsyncStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
        memoryCache.set(CACHE_VERSION_KEY, CACHE_VERSION);
      }
    } catch (e) {
      console.warn('[storageService] hydrate failed:', e);
    }
  },

  // ── Location ─────────────────────────────────────────────────────────────

  saveLocation(lat: number, lng: number) {
    syncSet(LOCATION_KEY, JSON.stringify({ lat, lng }));
  },

  getCachedLocation(): CachedLocation | null {
    const raw = syncGet(LOCATION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  // ── Prayer Times ──────────────────────────────────────────────────────────

  savePrayerTimes(data: CachedPrayerTimes) {
    syncSet(PRAYER_TIMES_KEY, JSON.stringify(data));
  },

  getCachedPrayerTimes(): CachedPrayerTimes | null {
    const raw = syncGet(PRAYER_TIMES_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  // ── Qibla ─────────────────────────────────────────────────────────────────

  saveQibla(data: CachedQibla) {
    syncSet(QIBLA_KEY, JSON.stringify(data));
  },

  getCachedQibla(): CachedQibla | null {
    const raw = syncGet(QIBLA_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  // ── Generic Caching ───────────────────────────────────────────────────────

  saveGenericItem(key: string, value: string): void {
    syncSet(key, value);
  },

  getGenericItem(key: string): string | null {
    return syncGet(key) || null;
  },

  KEYS: {
    NEARBY_MOSQUES: NEARBY_MOSQUES_KEY,
    ANNOUNCEMENTS: ANNOUNCEMENTS_KEY,
    HADITH: HADITH_KEY,
    ALL_MOSQUES: ALL_MOSQUES_KEY,
  }
};
