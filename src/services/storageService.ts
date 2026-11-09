/**
 * storageService.ts
 *
 * Compact device-local storage layer:
 *   - Uses an in-memory map backed asynchronously by AsyncStorage for persistence
 *   - Fast, synchronous reads and writes across all platforms (Expo Go, Android, iOS, Web)
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
const ANNOUNCEMENTS_KEY = 'cached_public_announcements';

const LOCAL_DEVICE_KEYS = [
  LOCATION_KEY,
  CITY_NAME_KEY,
  QIBLA_KEY,
  ANNOUNCEMENTS_KEY,
];

// ── In-memory sync cache (populated at hydration time) ─────────────────────
const memoryCache = new Map<string, string>();

// ── Unified helpers ────────────────────────────────────────────────────────

function syncSet(key: string, value: string): void {
  memoryCache.set(key, value);
  AsyncStorage.setItem(key, value).catch((e) =>
    console.warn('[storageService] AsyncStorage.setItem failed:', e)
  );
}

function syncGet(key: string): string | undefined {
  return memoryCache.get(key);
}

function syncDelete(key: string): void {
  memoryCache.delete(key);
  AsyncStorage.removeItem(key).catch(() => { });
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

  // ── Announcements ──────────────────────────────────────────────────────────

  saveAnnouncements(data: any[]): void {
    if (!data || !Array.isArray(data)) return;
    syncSet(ANNOUNCEMENTS_KEY, JSON.stringify(data));
  },

  getCachedAnnouncements(): any[] {
    const raw = syncGet(ANNOUNCEMENTS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getCachedAnnouncementsByCategory(categoryId?: string, categoryName?: string): any[] {
    const all = this.getCachedAnnouncements();
    if (!all || all.length === 0) return [];
    if (!categoryId && !categoryName) return all;

    const catNameLower = (categoryName || '').toLowerCase().trim();
    return all.filter((a: any) => {
      const matchId = categoryId && a.category_id === categoryId;
      const matchEn = catNameLower && a.category_name_en && a.category_name_en.toLowerCase().trim() === catNameLower;
      const matchName = catNameLower && a.category_name && a.category_name.toLowerCase().trim() === catNameLower;
      const matchUr = catNameLower && a.category_name_ur && a.category_name_ur.toLowerCase().trim() === catNameLower;
      return matchId || matchEn || matchName || matchUr;
    });
  },

  // ── Clear Device Local Data (Purge / Logout) ──────────────────────────────

  async clearLocalData(): Promise<void> {
    for (const key of LOCAL_DEVICE_KEYS) {
      syncDelete(key);
    }
  },
};

