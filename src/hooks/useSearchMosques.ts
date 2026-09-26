import { useMemo, useCallback } from 'react';
import { getDistance } from 'geolib';
import { supabase } from '../lib/supabase';
import { SearchMosque, MosqueDetails } from '../types/search';
import { useActiveMosquesQuery } from '../queries/useMosquesQueries';

interface UseSearchMosquesResult {
  mosques: SearchMosque[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchMosqueDetails: (id: string) => Promise<MosqueDetails | null>;
}

export function useSearchMosques(
  userLocation?: { lat: number; lng: number } | null,
): UseSearchMosquesResult {
  const { data: rawMosques = [], isLoading, error, refetch } = useActiveMosquesQuery();

  const mosques: SearchMosque[] = useMemo(() => {
    if (!rawMosques || rawMosques.length === 0) return [];

    if (!userLocation || userLocation.lat === 0 || userLocation.lng === 0) {
      return rawMosques.map((m) => ({ ...m, distance: 0 }));
    }

    return rawMosques
      .map((m) => {
        const dist = getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: m.latitude, longitude: m.longitude },
        );
        return {
          ...m,
          distance: dist / 1000,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [rawMosques, userLocation?.lat, userLocation?.lng]);

  const fetchMosqueDetails = useCallback(
    async (id: string): Promise<MosqueDetails | null> => {
      const existingMosque = rawMosques.find((m) => m.id === id);

      try {
        const { data, error: detailsError } = await supabase
          .from('mosques')
          .select('id, name, address, city, latitude, longitude, image_url, is_active')
          .eq('id', id)
          .single();

        if (detailsError) {
          if (existingMosque) {
            return {
              ...existingMosque,
              description: null,
              tags: [],
              admin_name: null,
              admin_email: null,
            };
          }
          return null;
        }

        const { data: assignments } = await supabase
          .from('mosque_tag_assignments')
          .select('tag_id')
          .eq('mosque_id', id);

        let tags: string[] = [];
        if (assignments && assignments.length > 0) {
          const tagIds = [...new Set(assignments.map((a: any) => a.tag_id))];
          const { data: tagData } = await supabase
            .from('mosque_tags')
            .select('name')
            .in('id', tagIds);
          if (tagData) {
            tags = tagData.map((t: any) => t.name);
          }
        }

        const { data: adminData } = await supabase
          .from('mosques')
          .select('admin_id')
          .eq('id', id)
          .single();

        let admin_name: string | null = null;
        let admin_email: string | null = null;
        if (adminData?.admin_id) {
          const { data: admin } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', adminData.admin_id)
            .maybeSingle();
          if (admin) {
            admin_name = admin.name;
            admin_email = admin.email;
          }
        }

        return {
          ...data,
          tags,
          admin_name,
          admin_email,
        };
      } catch (err) {
        if (existingMosque) {
          return {
            ...existingMosque,
            description: null,
            tags: [],
            admin_name: null,
            admin_email: null,
          };
        }
        return null;
      }
    },
    [rawMosques],
  );

  return {
    mosques,
    loading: isLoading && rawMosques.length === 0,
    error: error ? (error as Error).message : null,
    refetch: () => { refetch(); },
    fetchMosqueDetails,
  };
}
