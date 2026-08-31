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
import { fetchQiblaBearing, reverseGeocode } from '../services/prayerTimesService';
import { storageService } from '../services/storageService';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

/** Great-circle Qibla bearing calculation (offline fallback) */
const calculateQiblaAngle = (lat: number, lng: number): number => {
  const phiK = (KAABA_LAT * Math.PI) / 180;
  const lambdaK = (KAABA_LON * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const psi =
    (180 / Math.PI) *
    Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    );
  return (psi + 360) % 360;
};

export interface UseQiblaReturn {
  /** Qibla bearing from North in degrees (0–360) */
  qiblaBearing: number | null;
  /** Current compass heading from North in degrees */
  compassHeading: number;
  /** Rotation to apply to the compass image */
  qiblaRotation: number;
  city: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useQibla = (language: string = 'en'): UseQiblaReturn => {
  const { location, errorMsg: locationError } = useUserLocation();

  // Load cached data initially
  const cachedQibla = storageService.getCachedQibla();
  const cachedPrayerTimes = storageService.getCachedPrayerTimes();
  const initialCity = cachedQibla?.city || cachedPrayerTimes?.city || (language === 'ur' ? 'کراچی' : 'Karachi');

  const [qiblaBearing, setQiblaBearing] = useState<number | null>(() => {
    if (cachedQibla?.bearing) return cachedQibla.bearing;
    if (location) return calculateQiblaAngle(location.lat, location.lng);
    return null;
  });
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [city, setCity] = useState<string>(initialCity);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedCoords = useRef<{ lat: number; lng: number } | null>(storageService.getCachedLocation());

  // Subscribe to Magnetometer sensor on mount
  useEffect(() => {
    let subscription: any = null;

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
      // Calculate instant bearing locally first
      const localBearing = calculateQiblaAngle(location.lat, location.lng);
      setQiblaBearing(localBearing);

      // Attempt to reverse geocode city accurately
      let detectedCity = await reverseGeocode(location.lat, location.lng, language);

      if (!detectedCity) {
        // Fallback to timezone derivation
        const tzRes = await fetch(
          `https://api.aladhan.com/v1/timings?latitude=${location.lat}&longitude=${location.lng}&method=2`
        );
        if (tzRes.ok) {
          const tzJson = await tzRes.json();
          const tz: string = tzJson?.data?.meta?.timezone ?? '';
          const parts = tz.split('/');
          detectedCity = parts[parts.length - 1].replace(/_/g, ' ');
        }
      }

      const finalCity = detectedCity || (language === 'ur' ? 'کراچی' : 'Karachi');
      setCity(finalCity);

      // Fetch precise bearing from API
      try {
        const preciseBearing = await fetchQiblaBearing(location.lat, location.lng);
        if (preciseBearing !== null) {
          setQiblaBearing(preciseBearing);
          storageService.saveQibla({ bearing: preciseBearing, city: finalCity });
        }
      } catch {
        storageService.saveQibla({ bearing: localBearing, city: finalCity });
      }

      lastFetchedCoords.current = location;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to calculate Qibla direction');
    }
  }, [location, language]);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
      return;
    }

    if (location) {
      const currentCachedQibla = storageService.getCachedQibla();
      const shouldFetch =
        !currentCachedQibla ||
        !lastFetchedCoords.current ||
        getDistance(
          { latitude: lastFetchedCoords.current.lat, longitude: lastFetchedCoords.current.lng },
          { latitude: location.lat, longitude: location.lng }
        ) > 1000;

      if (shouldFetch) {
        load();
      } else if (!qiblaBearing) {
        setQiblaBearing(calculateQiblaAngle(location.lat, location.lng));
      }
    }
  }, [location, locationError, load, qiblaBearing]);

  const qiblaRotation =
    qiblaBearing !== null ? qiblaBearing - compassHeading : 0;

  return {
    qiblaBearing,
    compassHeading,
    qiblaRotation,
    city,
    loading: false,
    error,
    refetch: load,
  };
};

