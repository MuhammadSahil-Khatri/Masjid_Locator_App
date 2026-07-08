import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { SearchMosque, MosqueDetails } from "../types/search";

interface UseSearchMosquesResult {
  mosques: SearchMosque[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchMosqueDetails: (id: string) => Promise<MosqueDetails | null>;
}

/**
 * Custom hook to fetch mosque data once on mount
 * Only fetches essential fields for search and map display
 */
export function useSearchMosques(): UseSearchMosquesResult {
  const [mosques, setMosques] = useState<SearchMosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchMosques = useCallback(async () => {
    // Prevent multiple fetches
    if (fetchedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("mosques")
        .select(
          "id, name, address, city, latitude, longitude, image_url, capacity, is_active",
        )
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setMosques(data || []);
      fetchedRef.current = true;
    } catch (err: any) {
      console.error("Error fetching mosques:", err);
      setError(err.message || "Failed to load mosques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMosques();
  }, [fetchMosques]);

  const fetchMosqueDetails = useCallback(
    async (id: string): Promise<MosqueDetails | null> => {
      try {
        // Check if we already have this mosque in our list
        const existingMosque = mosques.find((m) => m.id === id);
        if (!existingMosque) return null;

        // Fetch additional details only when needed
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

        // Fetch tags for this mosque
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

        // Fetch admin info
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

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    fetchMosques();
  }, [fetchMosques]);

  return { mosques, loading, error, refetch, fetchMosqueDetails };
}
