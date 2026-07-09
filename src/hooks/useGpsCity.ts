/**
 * useGpsCity
 *
 * Returns the city name derived from the device's GPS coordinates.
 *
 * Strategy:
 *  1. Instantly returns the last cached city name (synchronous).
 *  2. When location resolves (from useUserLocation), reverse-geocodes it if
 *     the user has moved >1 km from the last geocoded position, or if no
 *     cached city exists.
 *  3. Saves the city name and the coordinates used to derive it so we can
 *     detect future significant movement.
 *  4. Falls back to `fallbackCity` (e.g. profile region) when GPS is
 *     unavailable or permission is denied.
 */

import { useState, useEffect, useRef } from 'react';
import { getDistance } from 'geolib';
import { useUserLocation } from './useUserLocation';
import { reverseGeocode } from '../services/prayerTimesService';
import { storageService } from '../services/storageService';

const GEOCODE_DISTANCE_THRESHOLD_METERS = 1000; // 1 km
const COORDS_KEY = 'gps_city_coords'; // lat/lng used for last geocoding

interface CityCoords { lat: number; lng: number; }

function getLastCityCoords(): CityCoords | null {
  const raw = storageService.getGenericItem(COORDS_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveLastCityCoords(lat: number, lng: number) {
  storageService.saveGenericItem(COORDS_KEY, JSON.stringify({ lat, lng }));
}

export interface UseGpsCityReturn {
  displayCity: string;
  isLocating: boolean;
}

export function useGpsCity(language: string = 'en', fallbackCity?: string): UseGpsCityReturn {
  const { location, loading: locationLoading, errorMsg } = useUserLocation();

  // Initialise from cache immediately so the UI has something on first render
  const [displayCity, setDisplayCity] = useState<string>(() => {
    return storageService.getGpsCity() || fallbackCity || '';
  });
  const [isLocating, setIsLocating] = useState(!storageService.getGpsCity());

  const geocodingRef = useRef(false);
  const lastLanguageRef = useRef(language);

  useEffect(() => {
    // Re-run geocoding when language changes (to get localised city name)
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
      // Reset so the language-change triggers fresh geocoding below
    }
  }, [language]);

  useEffect(() => {
    if (!location || geocodingRef.current) return;

    const lastCoords = getLastCityCoords();

    const needsGeocode =
      !lastCoords ||
      !storageService.getGpsCity() ||
      getDistance(
        { latitude: lastCoords.lat, longitude: lastCoords.lng },
        { latitude: location.lat, longitude: location.lng }
      ) > GEOCODE_DISTANCE_THRESHOLD_METERS;

    if (!needsGeocode) {
      // Use cached city; just ensure isLocating is cleared
      setIsLocating(false);
      return;
    }

    geocodingRef.current = true;
    setIsLocating(true);

    reverseGeocode(location.lat, location.lng, language)
      .then((city) => {
        if (city) {
          storageService.saveGpsCity(city);
          saveLastCityCoords(location.lat, location.lng);
          setDisplayCity(city);
        } else if (fallbackCity) {
          setDisplayCity(fallbackCity);
        }
      })
      .catch(() => {
        if (fallbackCity) setDisplayCity(fallbackCity);
      })
      .finally(() => {
        setIsLocating(false);
        geocodingRef.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, language]);

  // If GPS permission denied / unavailable, fall back to profile city
  useEffect(() => {
    if (errorMsg && !displayCity && fallbackCity) {
      setDisplayCity(fallbackCity);
      setIsLocating(false);
    }
  }, [errorMsg, displayCity, fallbackCity]);

  return {
    displayCity: displayCity || fallbackCity || '',
    isLocating: locationLoading || isLocating,
  };
}
