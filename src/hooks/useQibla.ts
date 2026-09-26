/**
 * useQibla — Production-ready Qibla compass hook
 *
 * Features:
 *  - Accelerometer + Magnetometer sensor fusion for tilt compensation.
 *  - React Native Reanimated shared values for 60/120fps native animation decoupled from React state.
 *  - Shortest-path continuous angle accumulation (no 350° → 5° jump/spin).
 *  - Low-pass filtering for smooth, responsive and damped rotation.
 *  - Magnetic interference and excessive tilt detection with user calibration messages.
 *  - Preserves existing UseQiblaReturn interface for full backward compatibility.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { useSharedValue, withSpring, SharedValue } from 'react-native-reanimated';
import { getDistance } from 'geolib';
import { useUserLocation } from './useUserLocation';
import { fetchQiblaBearing, reverseGeocode } from '../services/prayerTimesService';
import { storageService } from '../services/storageService';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

/** Great-circle Qibla bearing calculation (offline fallback) */
export const calculateQiblaAngle = (lat: number, lng: number): number => {
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

/** Compute shortest angular difference in [-180, 180] */
export const getShortestAngleDiff = (from: number, to: number): number => {
  let diff = (to - from) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
};

/** Spring configuration for smooth, responsive, damped compass rotation */
export const QIBLA_SPRING_CONFIG = {
  damping: 22,
  stiffness: 120,
  mass: 0.6,
  overshootClamping: false,
};

export interface UseQiblaReturn {
  /** Qibla bearing from North in degrees (0–360) */
  qiblaBearing: number | null;
  /** Current compass heading from North in degrees */
  compassHeading: number;
  /** Rotation of Qibla relative to device heading (degrees) */
  qiblaRotation: number;
  city: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;

  // ── Enhanced Reanimated & Calibration properties ──
  /** Reanimated shared value for continuous compass dial rotation (negative heading) */
  animatedCompassRotation: SharedValue<number>;
  /** Reanimated shared value for continuous Qibla indicator rotation */
  animatedQiblaRotation: SharedValue<number>;
  /** Whether the compass sensor is available on device */
  sensorAvailable: boolean;
  /** Whether compass reading is stable and reliable */
  isReliable: boolean;
  /** True if calibration or flat positioning is needed */
  calibrationNeeded: boolean;
  /** User-friendly calibration guidance message */
  calibrationMessage: string | null;
  /** True when device is aligned with Qibla within ±3° */
  isAligned: boolean;
}

export const useQibla = (language: string = 'en'): UseQiblaReturn => {
  const { location, errorMsg: locationError, refreshLocation } = useUserLocation();

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
  const [qiblaRotation, setQiblaRotation] = useState<number>(0);
  const [city, setCity] = useState<string>(initialCity);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);
  const [isReliable, setIsReliable] = useState<boolean>(true);
  const [calibrationNeeded, setCalibrationNeeded] = useState<boolean>(false);
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState<boolean>(false);

  const lastFetchedCoords = useRef<{ lat: number; lng: number } | null>(storageService.getCachedLocation());

  // ── Reanimated Shared Values for 60/120fps Native UI Animation ──
  const animatedCompassRotation = useSharedValue(0);
  const animatedQiblaRotation = useSharedValue(0);

  // Accumulated continuous rotation values to avoid 359° -> 1° full spins
  const accumulatedCompassRotation = useRef<number>(0);
  const accumulatedQiblaRotation = useRef<number>(0);

  // Filtered sensor values (Low-pass filter for smooth damping)
  const filteredM = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const filteredA = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 1 });
  const hasRawM = useRef<boolean>(false);
  const hasRawA = useRef<boolean>(false);

  // Throttled React state update refs
  const lastStateUpdate = useRef<number>(0);
  const lastReportedHeading = useRef<number>(0);
  const qiblaBearingRef = useRef<number | null>(qiblaBearing);
  qiblaBearingRef.current = qiblaBearing;

  // ── Sensor Setup with Tilt Compensation ─────────────────────────────────────
  useEffect(() => {
    let magSubscription: any = null;
    let accSubscription: any = null;
    let isMounted = true;

    // Check sensor hardware availability
    Magnetometer.isAvailableAsync()
      .then((avail) => {
        if (!isMounted) return;
        setSensorAvailable(avail);
        if (!avail) {
          setIsReliable(false);
          setCalibrationNeeded(true);
          setCalibrationMessage(
            language === 'ur'
              ? 'اس ڈیوائس پر کمپاس سینسر دستیاب نہیں ہے'
              : 'Compass sensor is not available on this device'
          );
        }
      })
      .catch(() => {
        if (isMounted) setSensorAvailable(false);
      });

    // 30ms interval (~33Hz) for responsive tracking without CPU overload
    Magnetometer.setUpdateInterval(30);
    Accelerometer.setUpdateInterval(30);

    // Accelerometer listener for device tilt/gravity
    accSubscription = Accelerometer.addListener((accData) => {
      const { x, y, z } = accData;
      if (!hasRawA.current) {
        filteredA.current = { x, y, z };
        hasRawA.current = true;
      } else {
        // Smooth gravity vector
        filteredA.current.x += 0.15 * (x - filteredA.current.x);
        filteredA.current.y += 0.15 * (y - filteredA.current.y);
        filteredA.current.z += 0.15 * (z - filteredA.current.z);
      }
    });

    // Magnetometer listener
    magSubscription = Magnetometer.addListener((magData) => {
      const { x, y, z } = magData;

      if (!hasRawM.current) {
        filteredM.current = { x, y, z };
        hasRawM.current = true;
      } else {
        // Low-pass filter raw magnetic reading to eliminate jitter
        filteredM.current.x += 0.2 * (x - filteredM.current.x);
        filteredM.current.y += 0.2 * (y - filteredM.current.y);
        filteredM.current.z += 0.2 * (z - filteredM.current.z);
      }

      const mx = filteredM.current.x;
      const my = filteredM.current.y;
      const mz = filteredM.current.z;

      // ── Tilt Compensation ───────────────────────────────────────────────
      let ax = filteredA.current.x;
      let ay = filteredA.current.y;
      let az = filteredA.current.z;

      let heading = 0;

      const normA = Math.hypot(ax, ay, az);
      if (normA > 0.05) {
        ax /= normA;
        ay /= normA;
        az /= normA;

        // Clamp pitch to [-60°, 60°] to prevent gimbal anomalies when held vertically
        const clampedAy = Math.max(-0.866, Math.min(0.866, -ay));
        const pitch = Math.asin(clampedAy);
        const cosPitch = Math.cos(pitch);

        let roll = 0;
        if (Math.abs(cosPitch) > 0.1) {
          const clampedAx = Math.max(-1, Math.min(1, ax / cosPitch));
          roll = Math.asin(clampedAx);
        } else {
          roll = Math.atan2(ax, az);
        }

        const cosRoll = Math.cos(roll);
        const sinRoll = Math.sin(roll);
        const sinPitch = Math.sin(pitch);

        // Horizontal magnetic components
        const xh = mx * cosRoll + mz * sinRoll;
        const yh = mx * sinPitch * sinRoll + my * cosPitch - mz * sinPitch * cosRoll;

        heading = Math.atan2(-xh, yh) * (180 / Math.PI);
      } else {
        // Fallback to flat 2D heading
        heading = Math.atan2(-mx, my) * (180 / Math.PI);
      }

      heading = ((heading % 360) + 360) % 360;

      // ── Reanimated Continuous Shortest-Path Tracking ─────────────────────
      // Dial rotates by -heading so North on dial points to real-world North
      const targetDialAngle = -heading;
      const compassDiff = getShortestAngleDiff(accumulatedCompassRotation.current, targetDialAngle);
      accumulatedCompassRotation.current += compassDiff;
      animatedCompassRotation.value = withSpring(accumulatedCompassRotation.current, QIBLA_SPRING_CONFIG);

      // Qibla indicator rotates by (qiblaBearing - heading)
      const currentBearing = qiblaBearingRef.current ?? 0;
      const targetQiblaAngle = currentBearing - heading;
      const qiblaDiff = getShortestAngleDiff(accumulatedQiblaRotation.current, targetQiblaAngle);
      accumulatedQiblaRotation.current += qiblaDiff;
      animatedQiblaRotation.value = withSpring(accumulatedQiblaRotation.current, QIBLA_SPRING_CONFIG);

      // ── Calibration & Stability Diagnostics ──────────────────────────────
      const magField = Math.hypot(mx, my, mz);
      // Earth magnetic field normally ranges from 25 to 65 uT
      const isInterference = magField > 0 && (magField < 12 || magField > 130);
      const isExcessiveTilt = Math.abs(ay) > 0.3; // Tilted > 60°

      const calibrated = !isInterference && !isExcessiveTilt;

      // Check alignment with Qibla (within ±3°)
      const currentDiffFromQibla = Math.abs(getShortestAngleDiff(heading, currentBearing));
      const aligned = currentDiffFromQibla <= 3;

      // ── Throttled React State Update (150ms / 1.5°) to Keep JS Thread Fast ─
      const now = Date.now();
      if (now - lastStateUpdate.current > 150 || Math.abs(heading - lastReportedHeading.current) > 1.5) {
        lastStateUpdate.current = now;
        lastReportedHeading.current = heading;

        const roundedHeading = Math.round(heading);
        const shortestRelQibla = Math.round(getShortestAngleDiff(heading, currentBearing));

        setCompassHeading(roundedHeading);
        setQiblaRotation(shortestRelQibla);
        setIsReliable(calibrated);
        setIsAligned(aligned);

        if (isExcessiveTilt) {
          setCalibrationNeeded(true);
          setCalibrationMessage(
            language === 'ur'
              ? 'درست سمت کے لیے فون کو ہموار (سیدھا) رکھیں'
              : 'Hold phone flat for more accurate direction'
          );
        } else if (isInterference) {
          setCalibrationNeeded(true);
          setCalibrationMessage(
            language === 'ur'
              ? 'مقناطیسی مداخلت۔ کمپاس درست کرنے کے لیے فون کو 8 کے انداز میں گھمائیں'
              : 'Magnetic interference detected. Move phone in a figure-8 to calibrate'
          );
        } else {
          setCalibrationNeeded(false);
          setCalibrationMessage(null);
        }
      }
    });

    return () => {
      isMounted = false;
      if (magSubscription) {
        try {
          magSubscription.remove();
        } catch (e) {
          console.warn('Failed to remove magnetometer subscription:', e);
        }
      }
      if (accSubscription) {
        try {
          accSubscription.remove();
        } catch (e) {
          console.warn('Failed to remove accelerometer subscription:', e);
        }
      }
    };
  }, [language]);

  // ── Fetch Qibla Bearing and Reverse Geocode City ────────────────────────────
  const load = useCallback(async () => {
    if (!location) return;
    setError(null);
    try {
      // Calculate instant bearing locally first
      const localBearing = calculateQiblaAngle(location.lat, location.lng);
      setQiblaBearing(localBearing);

      // Attempt reverse geocoding
      let detectedCity = await reverseGeocode(location.lat, location.lng, language);

      if (!detectedCity) {
        // Fallback to timezone derivation
        const tzRes = await fetch(
          `https://api.aladhan.com/v1/timings?latitude=${location.lat}&longitude=${location.lng}&method=1`
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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let currentStatus = status;
      if (currentStatus !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        currentStatus = req.status;
      }

      if (currentStatus === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        storageService.saveLocation(coords.lat, coords.lng);

        const localBearing = calculateQiblaAngle(coords.lat, coords.lng);
        setQiblaBearing(localBearing);
        setError(null);

        try {
          const detectedCity = await reverseGeocode(coords.lat, coords.lng, language);
          const finalCity = detectedCity || (language === 'ur' ? 'کراچی' : 'Karachi');
          setCity(finalCity);
          const preciseBearing = await fetchQiblaBearing(coords.lat, coords.lng);
          if (preciseBearing !== null) {
            setQiblaBearing(preciseBearing);
            storageService.saveQibla({ bearing: preciseBearing, city: finalCity });
          } else {
            storageService.saveQibla({ bearing: localBearing, city: finalCity });
          }
        } catch {
          storageService.saveQibla({ bearing: localBearing, city: city });
        }

        lastFetchedCoords.current = coords;
        refreshLocation();
      } else {
        setError(
          language === 'ur'
            ? 'لوکیشن کی اجازت نہیں دی گئی۔'
            : 'Permission to access location was denied'
        );
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to retrieve location');
    } finally {
      setLoading(false);
    }
  }, [language, city, refreshLocation]);

  return {
    qiblaBearing,
    compassHeading,
    qiblaRotation,
    city,
    loading,
    error,
    refetch,
    animatedCompassRotation,
    animatedQiblaRotation,
    sensorAvailable,
    isReliable,
    calibrationNeeded,
    calibrationMessage,
    isAligned,
  };
};
