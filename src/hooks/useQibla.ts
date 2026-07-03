/**
 * useQibla — Custom hook (stub, ready for real sensor integration)
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────┐
 * │  GPS location  →  fetchQiblaBearing()               │
 * │  Magnetometer heading  →  compassHeading (future)   │
 * │  qiblaRotation = qiblaBearing - compassHeading       │
 * └─────────────────────────────────────────────────────┘
 *
 * Currently:
 *  - Fetches the Qibla bearing from AlAdhan API using device GPS.
 *  - compassHeading is 0 (placeholder — magnetometer not yet integrated).
 *  - qiblaRotation = qiblaBearing - 0 = qiblaBearing.
 *
 * To integrate real compass later:
 *  1. Install `expo-sensors`.
 *  2. Subscribe to `Magnetometer.addListener` and compute heading.
 *  3. Set compassHeading state from the listener.
 *  4. qiblaRotation will auto-update in this hook.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Magnetometer } from 'expo-sensors';
import { getDistance } from 'geolib';
import { useUserLocation } from './useUserLocation';
import { fetchQiblaBearing } from '../services/prayerTimesService';
import { storageService } from '../services/storageService';

export interface UseQiblaReturn {
  /** Qibla bearing from North in degrees (0–360), fetched from AlAdhan API */
  qiblaBearing: number | null;
  /**
   * Current compass heading from North in degrees.
   */
  compassHeading: number;
  /**
   * Rotation to apply to the compass image so the Qibla arrow points correctly.
   * qiblaRotation = qiblaBearing - compassHeading
   */
  qiblaRotation: number;
  city: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useQibla = (): UseQiblaReturn => {
  const { location, errorMsg: locationError } = useUserLocation();

  // Load from MMKV initially
  const cachedQibla = storageService.getCachedQibla();

  const [qiblaBearing, setQiblaBearing] = useState<number | null>(cachedQibla?.bearing ?? null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [city, setCity] = useState<string>(cachedQibla?.city ?? 'Locating…');
  const [error, setError] = useState<string | null>(null);

  const lastFetchedCoords = useRef<{ lat: number; lng: number } | null>(storageService.getCachedLocation());

  // Subscribe to Magnetometer sensor on mount (when Qibla Screen opens)
  useEffect(() => {
    let subscription: any = null;

    // Filter states for smoothing magnetometer jitter
    let lastX = 0;
    let lastY = 0;
    let hasRawReading = false;

    Magnetometer.setUpdateInterval(100);

    subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;

      if (!hasRawReading) {
        lastX = x;
        lastY = y;
        hasRawReading = true;
      } else {
        // Low-pass filter to smooth compass rotation
        lastX = lastX + 0.15 * (x - lastX);
        lastY = lastY + 0.15 * (y - lastY);
      }

      // Calculate heading in degrees from magnetic North
      let heading = Math.atan2(-lastX, lastY) * (180 / Math.PI);
      heading = (heading + 360) % 360;

      setCompassHeading(heading);
    });

    return () => {
      if (subscription) {
        try {
          subscription.remove();
        } catch (e) {
          console.warn('Failed to remove magnetometer subscription:', e);
        }
      }
    };
  }, []);

  const load = useCallback(async () => {
    if (!location) return;
    setError(null);
    try {
      const bearing = await fetchQiblaBearing(location.lat, location.lng);
      setQiblaBearing(bearing);

      // Derive city from coordinates using AlAdhan timezone metadata
      const tzRes = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${location.lat}&longitude=${location.lng}&method=2`
      );
      let fetchedCity = '';
      if (tzRes.ok) {
        const tzJson = await tzRes.json();
        const tz: string = tzJson?.data?.meta?.timezone ?? '';
        const parts = tz.split('/');
        fetchedCity = parts[parts.length - 1].replace(/_/g, ' ');
        setCity(fetchedCity);
      } else {
        fetchedCity = 'Detected Location';
        setCity(fetchedCity);
      }

      // Cache results
      storageService.saveQibla({ bearing, city: fetchedCity });
      lastFetchedCoords.current = location;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to calculate Qibla direction');
    }
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
      return;
    }

    if (location) {
      const currentCachedQibla = storageService.getCachedQibla();
      const shouldFetch = !currentCachedQibla || !lastFetchedCoords.current || getDistance(
        { latitude: lastFetchedCoords.current.lat, longitude: lastFetchedCoords.current.lng },
        { latitude: location.lat, longitude: location.lng }
      ) > 1000; // Refetch if moved > 1km

      if (shouldFetch) {
        load();
      }
    }
  }, [location, locationError, load]);

  const qiblaRotation =
    qiblaBearing !== null ? qiblaBearing - compassHeading : 0;

  return {
    qiblaBearing,
    compassHeading,
    qiblaRotation,
    city,
    loading: false, // Cache-first: never block UI with full-screen spinner
    error,
    refetch: load,
  };
};

