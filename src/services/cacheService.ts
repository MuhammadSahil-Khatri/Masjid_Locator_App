import { getDistance } from 'geolib';
import { storageService } from './storageService';

// Interfaces for Cache Structures
export interface NearbyMosquesCache {
  userLat: number;
  userLng: number;
  fetchedAt: string; // ISO String
  data: any[];
}

export interface AnnouncementsCache {
  fetchedAt: string; // ISO String
  data: any[];
}

export interface HadithCache {
  fetchedAt: string; // ISO String
  data: any[];
}

export interface AllMosquesCache {
  fetchedAt: string; // ISO String
  data: any[];
}

const MOSQUE_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MOSQUE_CACHE_DISTANCE = 1000; // 1 km (in meters)
const ANNOUNCEMENTS_CACHE_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour
const HADITH_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// ── In-memory Session Cache ────────────────────────────────────────────────
let sessionMosques: any[] | null = null;
let sessionNearestMosques: any[] | null = null;
let sessionAnnouncements: any[] | null = null;
let sessionHadith: any[] | null = null;
let sessionPrayerTimes: { [city: string]: any } = {};

// Warming/Warmed flags
let sessionMosquesWarmed = false;
let sessionNearestMosquesWarmed = false;
let sessionAnnouncementsWarmed = false;
let sessionHadithWarmed = false;
let sessionPrayerTimesWarmed: { [city: string]: boolean } = {};

export const CacheService = {
  // ── Session Checking ──────────────────────────────────────────────────────

  isMosquesWarmed(): boolean {
    return sessionMosquesWarmed;
  },

  isNearestMosquesWarmed(): boolean {
    return sessionNearestMosquesWarmed;
  },

  isAnnouncementsWarmed(): boolean {
    return sessionAnnouncementsWarmed;
  },

  isHadithWarmed(): boolean {
    return sessionHadithWarmed;
  },

  isPrayerTimesWarmed(city: string): boolean {
    return !!sessionPrayerTimesWarmed[city.toLowerCase()];
  },

  // ── Nearby Mosques Caching ───────────────────────────────────────────────

  getNearbyMosques(lat: number, lng: number): any[] | null {
    if (sessionNearestMosquesWarmed && sessionNearestMosques) {
      return sessionNearestMosques;
    }

    const raw = storageService.getGenericItem(storageService.KEYS.NEARBY_MOSQUES);
    if (!raw) return null;

    try {
      const cached: NearbyMosquesCache = JSON.parse(raw);
      const now = new Date().getTime();
      const fetchedTime = new Date(cached.fetchedAt).getTime();

      // Check age < 24h
      if (now - fetchedTime >= MOSQUE_CACHE_EXPIRY) {
        return null;
      }

      // Check distance < 1km
      const dist = getDistance(
        { latitude: lat, longitude: lng },
        { latitude: cached.userLat, longitude: cached.userLng }
      );

      if (dist < MOSQUE_CACHE_DISTANCE) {
        sessionNearestMosques = cached.data;
        sessionNearestMosquesWarmed = true;
        return cached.data;
      }
    } catch (e) {
      console.warn('[CacheService] Failed to parse nearby mosques cache:', e);
    }
    return null;
  },

  getNearbyMosquesDirectly(): any[] | null {
    if (sessionNearestMosques) {
      return sessionNearestMosques;
    }
    const raw = storageService.getGenericItem(storageService.KEYS.NEARBY_MOSQUES);
    if (!raw) return null;
    try {
      const cached: NearbyMosquesCache = JSON.parse(raw);
      sessionNearestMosques = cached.data || null;
      if (sessionNearestMosques) {
        sessionNearestMosquesWarmed = true;
      }
      return sessionNearestMosques;
    } catch {
      return null;
    }
  },

  setNearbyMosques(lat: number, lng: number, mosques: any[]): void {
    const cachedMosques = mosques.slice(0, 10);
    const cacheData: NearbyMosquesCache = {
      userLat: lat,
      userLng: lng,
      fetchedAt: new Date().toISOString(),
      data: cachedMosques,
    };
    storageService.saveGenericItem(
      storageService.KEYS.NEARBY_MOSQUES,
      JSON.stringify(cacheData)
    );
    sessionNearestMosques = cachedMosques;
    sessionNearestMosquesWarmed = true;
  },

  // ── All Mosques Caching ───────────────────────────────────────────────────

  getAllMosques(): any[] | null {
    if (sessionMosquesWarmed && sessionMosques) {
      return sessionMosques;
    }
    const raw = storageService.getGenericItem(storageService.KEYS.ALL_MOSQUES);
    if (!raw) return null;
    try {
      const cached: AllMosquesCache = JSON.parse(raw);
      sessionMosques = cached.data || null;
      if (sessionMosques) {
        sessionMosquesWarmed = true;
      }
      return sessionMosques;
    } catch {
      return null;
    }
  },

  setAllMosques(mosques: any[]): void {
    const cacheData: AllMosquesCache = {
      fetchedAt: new Date().toISOString(),
      data: mosques,
    };
    storageService.saveGenericItem(
      storageService.KEYS.ALL_MOSQUES,
      JSON.stringify(cacheData)
    );
    sessionMosques = mosques;
    sessionMosquesWarmed = true;
  },

  // ── Prayer Times Caching ──────────────────────────────────────────────────

  getPrayerTimes(city: string): any | null {
    const cityKey = city.toLowerCase();
    if (sessionPrayerTimesWarmed[cityKey] && sessionPrayerTimes[cityKey]) {
      return sessionPrayerTimes[cityKey];
    }

    const cached = storageService.getCachedPrayerTimes() as any;
    if (!cached) return null;

    const today = new Date().toISOString().split('T')[0];
    const isToday = cached.fetchedAtDate === today;
    const isSameCity = cached.city && cached.city.toLowerCase() === cityKey;

    if (isToday && isSameCity) {
      sessionPrayerTimes[cityKey] = cached;
      sessionPrayerTimesWarmed[cityKey] = true;
      return cached;
    }
    return null;
  },

  setPrayerTimes(city: string, data: any): void {
    const today = new Date().toISOString().split('T')[0];
    const cacheData = {
      ...data,
      city,
      fetchedAtDate: today,
    };
    storageService.savePrayerTimes(cacheData);
    const cityKey = city.toLowerCase();
    sessionPrayerTimes[cityKey] = cacheData;
    sessionPrayerTimesWarmed[cityKey] = true;
  },

  // ── Announcements Caching ─────────────────────────────────────────────────

  isAnnouncementsExpired(): boolean {
    const raw = storageService.getGenericItem(storageService.KEYS.ANNOUNCEMENTS);
    if (!raw) return true;
    try {
      const cached: AnnouncementsCache = JSON.parse(raw);
      const now = new Date().getTime();
      const fetchedTime = new Date(cached.fetchedAt).getTime();
      return now - fetchedTime >= ANNOUNCEMENTS_CACHE_EXPIRY;
    } catch {
      return true;
    }
  },

  getAnnouncements(ignoreExpiry = false): any[] | null {
    if (sessionAnnouncementsWarmed && sessionAnnouncements) {
      return sessionAnnouncements;
    }

    const raw = storageService.getGenericItem(storageService.KEYS.ANNOUNCEMENTS);
    if (!raw) return null;

    try {
      const cached: AnnouncementsCache = JSON.parse(raw);
      const now = new Date().getTime();
      const fetchedTime = new Date(cached.fetchedAt).getTime();

      if (ignoreExpiry || (now - fetchedTime < ANNOUNCEMENTS_CACHE_EXPIRY)) {
        sessionAnnouncements = cached.data;
        sessionAnnouncementsWarmed = true;
        return cached.data;
      }
    } catch (e) {
      console.warn('[CacheService] Failed to parse announcements cache:', e);
    }
    return null;
  },

  setAnnouncements(announcements: any[]): void {
    // Cache announcements from the last 7 days
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);

    const filtered = announcements.filter((ann) => {
      const annDate = new Date(ann.created_at || ann.date || Date.now());
      return annDate >= limitDate;
    });

    const cacheData: AnnouncementsCache = {
      fetchedAt: new Date().toISOString(),
      data: filtered,
    };
    storageService.saveGenericItem(
      storageService.KEYS.ANNOUNCEMENTS,
      JSON.stringify(cacheData)
    );
    sessionAnnouncements = filtered;
    sessionAnnouncementsWarmed = true;
  },

  // ── Hadees Caching ────────────────────────────────────────────────────────

  isHadithExpired(): boolean {
    const raw = storageService.getGenericItem(storageService.KEYS.HADITH);
    if (!raw) return true;
    try {
      const cached: HadithCache = JSON.parse(raw);
      const now = new Date().getTime();
      const fetchedTime = new Date(cached.fetchedAt).getTime();
      return now - fetchedTime >= HADITH_CACHE_EXPIRY;
    } catch {
      return true;
    }
  },

  getHadith(ignoreExpiry = false): any[] | null {
    if (sessionHadithWarmed && sessionHadith) {
      return sessionHadith;
    }

    const raw = storageService.getGenericItem(storageService.KEYS.HADITH);
    if (!raw) return null;

    try {
      const cached: HadithCache = JSON.parse(raw);
      const now = new Date().getTime();
      const fetchedTime = new Date(cached.fetchedAt).getTime();

      if (ignoreExpiry || (now - fetchedTime < HADITH_CACHE_EXPIRY)) {
        sessionHadith = cached.data;
        sessionHadithWarmed = true;
        return cached.data;
      }
    } catch (e) {
      console.warn('[CacheService] Failed to parse hadith cache:', e);
    }
    return null;
  },

  setHadith(hadiths: any[]): void {
    // Cache Hadees from the last 7 days
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);

    const filtered = hadiths.filter((h) => {
      const hDate = new Date(h.created_at || Date.now());
      return hDate >= limitDate;
    });

    const cacheData: HadithCache = {
      fetchedAt: new Date().toISOString(),
      data: filtered,
    };
    storageService.saveGenericItem(
      storageService.KEYS.HADITH,
      JSON.stringify(cacheData)
    );
    sessionHadith = filtered;
    sessionHadithWarmed = true;
  },

  // ── Clear All Cache (Logout/Purge) ────────────────────────────────────────

  clearAllCache(): void {
    // Reset in-memory
    sessionMosques = null;
    sessionNearestMosques = null;
    sessionAnnouncements = null;
    sessionHadith = null;
    sessionPrayerTimes = {};

    sessionMosquesWarmed = false;
    sessionNearestMosquesWarmed = false;
    sessionAnnouncementsWarmed = false;
    sessionHadithWarmed = false;
    sessionPrayerTimesWarmed = {};

    // Reset persistent
    storageService.saveGenericItem(storageService.KEYS.NEARBY_MOSQUES, '');
    storageService.saveGenericItem(storageService.KEYS.ALL_MOSQUES, '');
    storageService.saveGenericItem(storageService.KEYS.ANNOUNCEMENTS, '');
    storageService.saveGenericItem(storageService.KEYS.HADITH, '');
    storageService.savePrayerTimes({
      timings: { Fajr: '', Dhuhr: '', Asr: '', Maghrib: '', Isha: '' },
      hijriDate: '',
      gregorianDate: '',
      city: '',
      fetchedAtDate: '',
    });
  },
};
