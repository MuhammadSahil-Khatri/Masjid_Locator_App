import { useState, useEffect, useCallback, useRef } from "react";
import { getDistance } from "geolib";
import { supabase } from "../lib/supabase";
import { SearchMosque, MosqueDetails } from "../types/search";
import { CacheService } from "../services/cacheService";

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
  // Load from cache initially
  const [mosques, setMosques] = useState<SearchMosque[]>(() => {
    if (CacheService.isMosquesWarmed()) {
      return CacheService.getAllMosques() || [];
    }
    return CacheService.getNearbyMosquesDirectly() || [];
  });

  const [loading, setLoading] = useState(() => {
    if (CacheService.isMosquesWarmed()) return false;
    const cached = CacheService.getNearbyMosquesDirectly();
    return !cached || cached.length === 0;
  });

  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const userLocationRef = useRef(userLocation);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const fetchMosques = useCallback(
    async (lat: number, lng: number, force = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        if (mosques.length === 0) {
          setLoading(true);
        }
        setError(null);

        // 1. Fetch only IDs and coordinates (extremely lightweight)
        const { data: coordsData, error: coordsError } = await supabase
          .from("mosques")
          .select("id, latitude, longitude")
          .eq("is_active", true);

        if (coordsError) throw coordsError;

        const allCoords = coordsData || [];

        // Sort coordinates by distance to find top 10 nearest IDs
        const sortedCoords = allCoords
          .map((m: any) => {
            const dist = getDistance(
              { latitude: lat, longitude: lng },
              { latitude: m.latitude, longitude: m.longitude },
            );
            return { id: m.id, distance: dist / 1000 };
          })
          .sort((a, b) => a.distance - b.distance);

        const nearest10Ids = sortedCoords.slice(0, 10).map((c) => c.id);
        const remainingIds = sortedCoords.slice(10).map((c) => c.id);

        if (nearest10Ids.length === 0) {
          // No mosques in DB
          setMosques([]);
          CacheService.setNearbyMosques(lat, lng, []);
          CacheService.setAllMosques([]);
          setLoading(false);
          fetchingRef.current = false;
          return;
        }

        // 2. Fetch full details of top 10 nearest
        const { data: nearestMosquesData, error: nearestError } = await supabase
          .from("mosques")
          .select(
            "id, name, address, city, latitude, longitude, image_url, capacity, is_active",
          )
          .in("id", nearest10Ids);

        if (nearestError) throw nearestError;

        // Calculate distances for nearest 10
        const nearest10 = (nearestMosquesData || [])
          .map((m: any) => {
            const matching = sortedCoords.find((c) => c.id === m.id);
            return { ...m, distance: matching ? matching.distance : 0 };
          })
          .sort((a, b) => a.distance - b.distance);

        // Cache and display nearest 10 immediately!
        CacheService.setNearbyMosques(lat, lng, nearest10);
        setMosques(nearest10);
        setLoading(false);

        // 3. Fetch remaining in the background
        if (remainingIds.length > 0) {
          const { data: remainingMosquesData, error: remainingError } =
            await supabase
              .from("mosques")
              .select(
                "id, name, address, city, latitude, longitude, image_url, capacity, is_active",
              )
              .in("id", remainingIds);

          if (!remainingError && remainingMosquesData) {
            const remainingWithDistance = remainingMosquesData.map((m: any) => {
              const matching = sortedCoords.find((c) => c.id === m.id);
              return { ...m, distance: matching ? matching.distance : 0 };
            });

            // Merge nearest 10 with remaining
            const allMosques = [...nearest10, ...remainingWithDistance].sort(
              (a, b) => a.distance - b.distance,
            );

            // Update cache & state
            CacheService.setAllMosques(allMosques);
            setMosques(allMosques);
          }
        } else {
          CacheService.setAllMosques(nearest10);
        }
      } catch (err: any) {
        console.warn("[useSearchMosques] Fetch failed (likely offline):", err);
        // Fallback: load from local complete cache or nearest cache
        const cachedAll = CacheService.getAllMosques();
        if (cachedAll && cachedAll.length > 0) {
          const updatedAll = cachedAll
            .map((m: any) => {
              const dist = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: m.latitude, longitude: m.longitude },
              );
              return { ...m, distance: dist / 1000 };
            })
            .sort((a, b) => a.distance - b.distance);
          setMosques(updatedAll);
        } else {
          const cachedNearest = CacheService.getNearbyMosquesDirectly();
          if (cachedNearest && cachedNearest.length > 0) {
            const updatedNearest = cachedNearest
              .map((m: any) => {
                const dist = getDistance(
                  { latitude: lat, longitude: lng },
                  { latitude: m.latitude, longitude: m.longitude },
                );
                return { ...m, distance: dist / 1000 };
              })
              .sort((a, b) => a.distance - b.distance);
            setMosques(updatedNearest);
          } else {
            setError(
              "Failed to load mosques. Please check your internet connection.",
            );
          }
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [mosques.length],
  );

  // Initial trigger or when userLocation shifts
  useEffect(() => {
    if (userLocation) {
      // Re-use in-memory data during active session to prevent tab-switch fetching
      if (CacheService.isMosquesWarmed()) {
        return;
      }

      fetchMosques(userLocation.lat, userLocation.lng);
    }
  }, [userLocation?.lat, userLocation?.lng, fetchMosques]);

  const refetch = useCallback(() => {
    const loc = userLocationRef.current;
    if (loc) {
      fetchMosques(loc.lat, loc.lng, true);
    }
  }, [fetchMosques]);

  const fetchMosqueDetails = useCallback(
    async (id: string): Promise<MicroDetails | null> => {
      try {
        const existingMosque = mosques.find((m) => m.id === id);
        if (!existingMosque) return null;

        const { data, error: detailsError } = await supabase
          .from("mosques")
          .select(
            "id, name, address, city, latitude, longitude, image_url, capacity, is_active, description",
          )
          .eq("id", id)
          .single();

        if (detailsError) {
          console.error("Error fetching mosque details:", detailsError);
          return null;
        }

        const { data: assignments } = await supabase
          .from("mosque_tag_assignments")
          .select("tag_id")
          .eq("mosque_id", id);

        let tags: string[] = [];
        if (assignments && assignments.length > 0) {
          const tagIds = [...new Set(assignments.map((a: any) => a.tag_id))];
          const { data: tagData } = await supabase
            .from("mosque_tags")
            .select("name")
            .in("id", tagIds);
          if (tagData) {
            tags = tagData.map((t: any) => t.name);
          }
        }

        const { data: adminData } = await supabase
          .from("mosques")
          .select("admin_id")
          .eq("id", id)
          .single();

        let admin_name: string | null = null;
        let admin_email: string | null = null;
        if (adminData?.admin_id) {
          const { data: admin } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", adminData.admin_id)
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
        console.error("Error fetching mosque details:", err);
        return null;
      }
    },
    [mosques],
  );

  return { mosques, loading, error, refetch, fetchMosqueDetails };
}
type MicroDetails = MosqueDetails;
