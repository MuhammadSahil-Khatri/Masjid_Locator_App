import { useState, useEffect, useCallback, useRef } from 'react';
import { getDistance } from 'geolib';
import { supabase } from '../lib/supabase';
import { SearchMosque } from '../types/search';
import { CacheService } from '../services/cacheService';

interface UseNearestMosquesResult {
  mosques: SearchMosque[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNearestMosques(
  userLocation?: { lat: number; lng: number } | null
): UseNearestMosquesResult {
  // Initialize immediately from cached 10 nearest mosques for instant/offline load
  const [mosques, setMosques] = useState<SearchMosque[]>(() => {
    const cached = CacheService.getNearbyMosquesDirectly();
    if (cached && cached.length > 0) {
      return cached.slice(0, 10);
    }
    const allCached = CacheService.getAllMosques();
    if (allCached && allCached.length > 0) {
      return allCached.slice(0, 10);
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    const cached = CacheService.getNearbyMosquesDirectly();
    return !cached || cached.length === 0;
  });

  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const userLocationRef = useRef(userLocation);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const fetchNearest10 = useCallback(
    async (lat: number, lng: number, force = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        if (force || mosques.length === 0) {
          setLoading(true);
        }
        setError(null);

        // 1. Fetch active mosque coordinates
        const { data: coordsData, error: coordsError } = await supabase
          .from('mosques')
          .select('id, latitude, longitude')
          .eq('is_active', true);

        if (coordsError) throw coordsError;

        const allCoords = coordsData || [];

        // Sort coordinates by distance to find top 10 nearest IDs
        const sortedCoords = allCoords
          .map((m: any) => {
            const dist = getDistance(
              { latitude: lat, longitude: lng },
              { latitude: m.latitude, longitude: m.longitude }
            );
            return { id: m.id, distance: dist / 1000 };
          })
          .sort((a, b) => a.distance - b.distance);

        const nearest10Ids = sortedCoords.slice(0, 10).map((c) => c.id);

        if (nearest10Ids.length === 0) {
          setMosques([]);
          CacheService.setNearbyMosques(lat, lng, []);
          setLoading(false);
          fetchingRef.current = false;
          return;
        }

        // 2. Fetch full details of ONLY the top 10 nearest mosques
        const { data: nearestMosquesData, error: nearestError } = await supabase
          .from('mosques')
          .select(
            'id, name, address, city, latitude, longitude, image_url, capacity, is_active'
          )
          .in('id', nearest10Ids);

        if (nearestError) throw nearestError;

        // Calculate and attach distances
        const nearest10: SearchMosque[] = (nearestMosquesData || [])
          .map((m: any) => {
            const matching = sortedCoords.find((c) => c.id === m.id);
            return { ...m, distance: matching ? matching.distance : 0 };
          })
          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
          .slice(0, 10);

        // Cache and display the 10 nearest mosques
        CacheService.setNearbyMosques(lat, lng, nearest10);
        setMosques(nearest10);
      } catch (err: any) {
        console.warn('[useNearestMosques] Fetch failed (likely offline):', err);
        const cached = CacheService.getNearbyMosquesDirectly();
        if (cached && cached.length > 0) {
          const updated = cached
            .map((m: any) => {
              const dist = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: m.latitude, longitude: m.longitude }
              );
              return { ...m, distance: dist / 1000 };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
          setMosques(updated);
        } else {
          setError('Failed to load nearby mosques. Please check your connection.');
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [mosques.length]
  );

  // Fetch when userLocation is first ready or changes significantly
  useEffect(() => {
    if (userLocation) {
      fetchNearest10(userLocation.lat, userLocation.lng);
    }
  }, [userLocation?.lat, userLocation?.lng, fetchNearest10]);

  const refetch = useCallback(() => {
    const loc = userLocationRef.current;
    if (loc) {
      fetchNearest10(loc.lat, loc.lng, true);
    }
  }, [fetchNearest10]);

  return { mosques, loading, error, refetch };
}
