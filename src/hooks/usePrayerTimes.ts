import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserLocation } from './useUserLocation';
import { fetchPrayerTimes, reverseGeocode, PrayerTimesResult } from '../services/prayerTimesService';
import { ParsedPrayerTimes } from '../types';
import { storageService } from '../services/storageService';
import { CacheService } from '../services/cacheService';

// ── Helpers ─────────────────────────────────────────────────────────────────

const timeToMinutes = (timeStr: string): number => {
  // Handles both "HH:MM" (24-hr) and "h:MM AM/PM" (12-hr)
  const parts = timeStr.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (parts[1]) {
    // 12-hour format
    const period = parts[1].toUpperCase();
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
  }
  return h * 60 + m;
};

export interface UpcomingPrayer {
  name: keyof ParsedPrayerTimes;
  time: string;
  remainingTime: string;
  currentActive: keyof ParsedPrayerTimes;
}

const PRAYER_KEYS: Array<keyof ParsedPrayerTimes> = [
  'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha',
];

const computeUpcoming = (
  timings: ParsedPrayerTimes,
  now: Date
): UpcomingPrayer => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = PRAYER_KEYS
    .filter(name => !!timings[name])
    .map(name => ({
      name,
      time: timings[name] as string,
      minutes: timeToMinutes(timings[name] as string),
    }));

  let upcoming = prayers.find(p => p.minutes > currentMinutes);
  let isNextDay = false;
  if (!upcoming) {
    upcoming = prayers[0];
    isNextDay = true;
  }

  const upcomingMinutes = upcoming.minutes;
  const diff = isNextDay
    ? 1440 - currentMinutes + upcomingMinutes
    : upcomingMinutes - currentMinutes;

  const h = Math.floor(diff / 60);
  const m = diff % 60;
  const remainingTime = h > 0 ? `${h}h ${m}m` : `${m}m`;

  // Determine current active prayer
  let currentActive: keyof ParsedPrayerTimes = 'Isha';
  for (let i = prayers.length - 1; i >= 0; i--) {
    if (currentMinutes >= prayers[i].minutes) {
      currentActive = prayers[i].name;
      break;
    }
  }

  return { name: upcoming.name, time: upcoming.time, remainingTime, currentActive };
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePrayerTimesReturn {
  timings: ParsedPrayerTimes | null;
  hijriDate: string;
  gregorianDate: string;
  city: string;
  upcoming: UpcomingPrayer | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePrayerTimes = (language: string = 'en'): UsePrayerTimesReturn => {
  const { location, loading: locationLoading, errorMsg: locationError } = useUserLocation();

  // Load from cache initially
  const [data, setData] = useState<PrayerTimesResult | null>(() => {
    return storageService.getCachedPrayerTimes();
  });
  
  const [loading, setLoading] = useState(() => {
    const cached = storageService.getCachedPrayerTimes();
    return !cached;
  });
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Tick clock every 30 seconds for countdown accuracy
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const fetchingRef = useRef(false);
  const userLocationRef = useRef(location);

  useEffect(() => {
    userLocationRef.current = location;
  }, [location]);

  const fetchTimes = useCallback(async (lat: number, lng: number, force = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);
      if (force) {
        const fresh = await fetchPrayerTimes(lat, lng, 2, language);
        CacheService.setPrayerTimes(fresh.city, fresh);
        setData(fresh);
      } else {
        // Detect city first
        const detectedCity = await reverseGeocode(lat, lng, language);
        if (detectedCity) {
          const cached = CacheService.getPrayerTimes(detectedCity);
          if (cached) {
            setData(cached);
            setLoading(false);
            fetchingRef.current = false;
            return;
          }
        }
        
        // Fetch if city/date mismatch or geocoding empty
        const fresh = await fetchPrayerTimes(lat, lng, 2, language);
        const finalCity = fresh.city || detectedCity || 'Karachi';
        CacheService.setPrayerTimes(finalCity, { ...fresh, city: finalCity });
        setData({ ...fresh, city: finalCity });
      }
    } catch (err: any) {
      console.error('[usePrayerTimes] error fetching prayer times:', err);
      setError(err.message || 'Error retrieving prayer times');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Effect to trigger fetch when location resolves or changes
  useEffect(() => {
    if (location) {
      reverseGeocode(location.lat, location.lng, language).then(detectedCity => {
        const city = detectedCity || 'Karachi';

        // 1. If session is already warmed, use in-memory data and don't query
        if (CacheService.isPrayerTimesWarmed(city)) {
          const cached = CacheService.getPrayerTimes(city);
          if (cached) {
            setData(cached);
            setLoading(false);
          }
          return;
        }

        // 2. Otherwise, check persistent cache
        const cached = CacheService.getPrayerTimes(city);
        if (cached) {
          setData(cached);
          setLoading(false);
          // Save in session
          CacheService.setPrayerTimes(city, cached);
        } else {
          // Expiry or missing -> fetch
          fetchTimes(location.lat, location.lng);
        }
      }).catch(() => {
        const cached = storageService.getCachedPrayerTimes();
        if (cached) {
          setData(cached);
          setLoading(false);
        } else {
          fetchTimes(location.lat, location.lng);
        }
      });
    }
  }, [location?.lat, location?.lng, fetchTimes]);

  const upcoming = data?.timings ? computeUpcoming(data.timings, now) : null;
  const combinedError = locationError || error;

  const refetch = useCallback(() => {
    const loc = userLocationRef.current;
    if (loc) {
      fetchTimes(loc.lat, loc.lng, true);
    }
  }, [fetchTimes]);

  return {
    timings: data?.timings ?? null,
    hijriDate: data?.hijriDate ?? '',
    gregorianDate: data?.gregorianDate ?? '',
    city: data?.city ?? '',
    upcoming,
    loading: loading && !data,
    error: combinedError,
    refetch,
  };
};
