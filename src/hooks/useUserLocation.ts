import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { storageService } from '../services/storageService';

export interface LocationState {
  lat: number;
  lng: number;
}

// Consider change of 500 meters as significant
const SIGNIFICANT_DISTANCE_METERS = 500;

export function useUserLocation(_defaultLocation?: LocationState) {
  // Load initial cached location immediately (cache-first)
  const cached = storageService.getCachedLocation();
  const [location, setLocation] = useState<LocationState | null>(cached);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // If we already have a cached location, we don't show loading state
  const [loading, setLoading] = useState(!cached);

  const locationRef = useRef<LocationState | null>(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;
    let webWatchId: number | null = null;

    const handleLocationUpdate = (newLat: number, newLng: number) => {
      const locObj = { lat: newLat, lng: newLng };
      const currentLoc = locationRef.current;
      if (!currentLoc) {
        storageService.saveLocation(locObj.lat, locObj.lng);
        setLocation(locObj);
      } else {
        const dist = getDistance(
          { latitude: currentLoc.lat, longitude: currentLoc.lng },
          { latitude: locObj.lat, longitude: locObj.lng }
        );
        if (dist > SIGNIFICANT_DISTANCE_METERS) {
          storageService.saveLocation(locObj.lat, locObj.lng);
          setLocation(locObj);
        }
      }
    };

    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        // Get initial location with balanced accuracy in the background
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        const newLoc = {
          lat: initialLocation.coords.latitude,
          lng: initialLocation.coords.longitude,
        };

        const currentCached = storageService.getCachedLocation();
        if (!currentCached) {
          // No cache exists, save and update UI
          storageService.saveLocation(newLoc.lat, newLoc.lng);
          setLocation(newLoc);
        } else {
          // Cache exists, check if distance is significant
          const dist = getDistance(
            { latitude: currentCached.lat, longitude: currentCached.lng },
            { latitude: newLoc.lat, longitude: newLoc.lng }
          );
          if (dist > SIGNIFICANT_DISTANCE_METERS) {
            storageService.saveLocation(newLoc.lat, newLoc.lng);
            setLocation(newLoc);
          }
        }
        setLoading(false);

        // Watch for changes - branching for Web/Native to avoid expo-location Web subscription cleanup bug
        if (Platform.OS === 'web') {
          const nav = navigator as any;
          if (nav && nav.geolocation) {
            webWatchId = nav.geolocation.watchPosition(
              (pos: any) => {
                handleLocationUpdate(pos.coords.latitude, pos.coords.longitude);
              },
              (err: any) => {
                console.warn('Geolocation watchPosition error on Web:', err);
              },
              { enableHighAccuracy: false, timeout: 10000 }
            );
          }
        } else {
          subscriber = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 50,
            },
            (newLocation) => {
              handleLocationUpdate(newLocation.coords.latitude, newLocation.coords.longitude);
            }
          );
        }
      } catch (err) {
        setErrorMsg('Error retrieving location');
        setLoading(false);
      }
    };

    initLocation();

    return () => {
      if (Platform.OS === 'web' && webWatchId !== null) {
        const nav = navigator as any;
        if (nav && nav.geolocation) {
          nav.geolocation.clearWatch(webWatchId);
        }
      } else if (subscriber) {
        try {
          subscriber.remove();
        } catch (e) {
          console.warn('Failed to remove location subscription:', e);
        }
      }
    };
  }, []);

  const refreshLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: reqStatus } = await Location.requestForegroundPermissionsAsync();
        if (reqStatus !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
      }
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const newLoc = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      storageService.saveLocation(newLoc.lat, newLoc.lng);
      setLocation(newLoc);
      setErrorMsg(null);
      setLoading(false);
    } catch (err) {
      setErrorMsg('Error retrieving location');
      setLoading(false);
    }
  };

  return { location, errorMsg, loading, refreshLocation };
}
