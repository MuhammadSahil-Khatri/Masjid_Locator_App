import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserLocation } from './useUserLocation';
import {
  fetchPrayerTimes,
  reverseGeocode,
  PrayerTimesResult,
} from '../services/prayerTimesService';
import { ParsedPrayerTimes } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────────────

const timeToMinutes = (timeStr: string): number => {
  const parts = timeStr.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (parts[1]) {
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
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

const hasValidTimings = (timings: ParsedPrayerTimes | null | undefined): boolean => {
  if (!timings) return false;
  return PRAYER_KEYS.some((name) => {
    const val = timings[name];
    return typeof val === 'string' && val.trim() !== '';
  });
};

const computeUpcoming = (
  timings: ParsedPrayerTimes,
  now: Date,
): UpcomingPrayer | null => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = PRAYER_KEYS.filter((name) => {
    const val = timings[name];
    return typeof val === 'string' && val.trim() !== '';
  }).map((name) => ({
    name,
    time: timings[name] as string,
    minutes: timeToMinutes(timings[name] as string),
  }));

  if (prayers.length === 0) {
    return null;
  }

  let upcoming = prayers.find((p) => p.minutes > currentMinutes);
  let isNextDay = false;
  if (!upcoming) {
    upcoming = prayers[0];
    isNextDay = true;
  }

  if (!upcoming) {
    return null;
  }

  const upcomingMinutes = upcoming.minutes;
  const diff = isNextDay
    ? 1440 - currentMinutes + upcomingMinutes
    : upcomingMinutes - currentMinutes;

  const h = Math.floor(diff / 60);
  const m = diff % 60;
  const remainingTime = h > 0 ? `${h}h ${m}m` : `${m}m`;

  let currentActive: keyof ParsedPrayerTimes = 'Isha';
  for (let i = prayers.length - 1; i >= 0; i--) {
    if (currentMinutes >= prayers[i].minutes) {
      currentActive = prayers[i].name;
      break;
    }
  }

  return {
    name: upcoming.name,
    time: upcoming.time,
    remainingTime,
    currentActive,
  };
};

export interface UsePrayerTimesReturn {
  timings: ParsedPrayerTimes | null;
  hijriDate: string;
  gregorianDate: string;
  city: string;
  upcoming: UpcomingPrayer | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<any>;
}

export const usePrayerTimes = (
  language: string = 'en',
): UsePrayerTimesReturn => {
  const {
    location,
    loading: locationLoading,
    errorMsg: locationError,
  } = useUserLocation();

  const [now, setNow] = useState(new Date());

  // Tick clock every 30 seconds for countdown accuracy
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const todayDateStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Approximate coordinate grid to prevent infinite location cache key fragmentation
  const latGrid = location ? Math.round(location.lat * 100) / 100 : 24.86;
  const lngGrid = location ? Math.round(location.lng * 100) / 100 : 67.0;

  const prayerQuery = useQuery<PrayerTimesResult>({
    queryKey: ['prayerTimes', todayDateStr, latGrid, lngGrid, language],
    queryFn: async () => {
      const lat = location?.lat ?? 24.8607; // Default to Karachi if location not yet granted
      const lng = location?.lng ?? 67.0011;

      // Reverse geocode to get city label (fallback safely if offline)
      let city = '';
      try {
        city = await reverseGeocode(lat, lng, language);
      } catch {}

      const fresh = await fetchPrayerTimes(lat, lng, 1, language, undefined, city || undefined);
      return {
        ...fresh,
        city: fresh.city || city || 'Karachi',
      };
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (prevents storing stale dates indefinitely)
  });

  const data = prayerQuery.data;
  const upcoming = data?.timings && hasValidTimings(data.timings)
    ? computeUpcoming(data.timings, now)
    : null;

  return {
    timings: data?.timings ?? null,
    hijriDate: data?.hijriDate ?? '',
    gregorianDate: data?.gregorianDate ?? '',
    city: data?.city ?? '',
    upcoming,
    loading: prayerQuery.isLoading && !data,
    error: (locationError || (prayerQuery.error ? (prayerQuery.error as Error).message : null)),
    refetch: prayerQuery.refetch,
  };
};
