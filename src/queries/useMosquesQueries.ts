import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { SearchMosque } from '../types/search';
import { getDistance } from 'geolib';

export const MOSQUES_QUERY_KEYS = {
  allActive: ['mosques', 'active'] as const,
};

/**
 * Fetches all active mosques with essential coordinate and detail fields.
 */
async function fetchActiveMosques(): Promise<SearchMosque[]> {
  const { data, error } = await supabase
    .from('mosques')
    .select('id, name, address, city, latitude, longitude, image_url, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.warn('[useMosquesQueries] Error fetching mosques from Supabase:', error.message);
    throw error;
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    address: m.address,
    city: m.city,
    latitude: m.latitude,
    longitude: m.longitude,
    image_url: m.image_url,
    capacity: m.capacity ?? null,
    is_active: m.is_active,
  }));
}

/**
 * Primary hook for all active mosques (cached offline & fresh in background).
 */
export function useActiveMosquesQuery() {
  return useQuery({
    queryKey: MOSQUES_QUERY_KEYS.allActive,
    queryFn: fetchActiveMosques,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in persistent storage
  });
}

/**
 * Hook that computes the 10 nearest mosques from the cached active mosques list
 * based on user coordinates. Avoids fragmented location-keyed cache entries.
 */
export function useNearestMosquesQuery(userLocation?: { lat: number; lng: number } | null) {
  const query = useActiveMosquesQuery();

  const nearestMosques: SearchMosque[] = useMemo(() => {
    const rawList = query.data || [];
    if (rawList.length === 0) return [];

    if (!userLocation || userLocation.lat === 0 || userLocation.lng === 0) {
      return rawList.slice(0, 10).map((m) => ({ ...m, distance: 0 }));
    }

    return rawList
      .map((m) => {
        const dist = getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: m.latitude, longitude: m.longitude }
        );
        return {
          ...m,
          distance: dist / 1000, // in kilometers
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [query.data, userLocation?.lat, userLocation?.lng]);

  return {
    ...query,
    mosques: nearestMosques,
    allMosques: query.data || [],
  };
}
