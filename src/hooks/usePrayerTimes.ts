/**
 * usePrayerTimes — Custom hook
 *
 * Fetches live prayer times from the AlAdhan API using the device's GPS
 * coordinates. Re-fetches whenever the location changes.
 *
 * Returns parsed timings, Hijri/Gregorian dates, city, upcoming prayer
 * info, loading state, error state, and a manual refetch function.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserLocation } from './useUserLocation';
import { fetchPrayerTimes, PrayerTimesResult } from '../services/prayerTimesService';
import { ParsedPrayerTimes } from '../types';
import { storageService } from '../services/storageService';

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
  'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha',
];

const computeUpcoming = (
  timings: ParsedPrayerTimes,
  now: Date
): UpcomingPrayer => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = PRAYER_KEYS.map(name => ({
    name,
    time: timings[name],
    minutes: timeToMinutes(timings[name]),
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

export const usePrayerTimes = (): UsePrayerTimesReturn => {
  const { location, loading: locationLoading, errorMsg: locationError } = useUserLocation();

  // Load from MMKV initially
  const cachedData = storageService.getCachedPrayerTimes();

  const [data, setData] = useState<PrayerTimesResult | null>(cachedData);
  const [now, setNow] = useState(new Date());

  // Tick clock every 30 seconds for countdown accuracy
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Round location to 2 decimal places to avoid tiny movement triggering requests
  const roundedLat = location ? Math.round(location.lat * 100) / 100 : null;
  const roundedLng = location ? Math.round(location.lng * 100) / 100 : null;
  const dateStr = now.toISOString().split('T')[0];

  // Query is enabled when location is available
  const { data: fetchedData, error: queryError, isPending, refetch } = useQuery({
    queryKey: ['prayerTimes', roundedLat, roundedLng, dateStr],
    queryFn: async () => {
      if (!location) throw new Error('Location not available');
      return fetchPrayerTimes(location.lat, location.lng);
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 60 * 2, // 2 hours
  });

  // Keep state in sync with fetchedData
  useEffect(() => {
    if (fetchedData) {
      const cached = storageService.getCachedPrayerTimes();
      // Check if new data differs from cached data
      const isDifferent = !cached ||
        JSON.stringify(cached.timings) !== JSON.stringify(fetchedData.timings) ||
        cached.city !== fetchedData.city ||
        cached.hijriDate !== fetchedData.hijriDate ||
        cached.gregorianDate !== fetchedData.gregorianDate;

      if (isDifferent) {
        storageService.savePrayerTimes(fetchedData);
        setData(fetchedData);
      }
    }
  }, [fetchedData]);

  const upcoming = data?.timings ? computeUpcoming(data.timings, now) : null;

  const error = locationError || (queryError ? (queryError as Error).message : null);

  // loading is true only if no cached data exists AND we are currently loading
  const loading = !data && (locationLoading || isPending);

  return {
    timings: data?.timings ?? null,
    hijriDate: data?.hijriDate ?? '',
    gregorianDate: data?.gregorianDate ?? '',
    city: data?.city ?? '',
    upcoming,
    loading,
    error,
    refetch,
  };
};

