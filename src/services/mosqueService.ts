import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../lib/supabase";

export interface MosqueRow {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string | null;
  image_url: string | null;
  admin_id: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MosqueWithAdmin extends MosqueRow {
  admin_name: string | null;
  admin_email: string | null;
  tags: string[];
}

export interface MosqueTag {
  id: string;
  name: string;
}

export const mosqueService = {
  /**
   * Fetches all mosques with their assigned admin name and tags.
   */
  async fetchAllMosques(): Promise<MosqueWithAdmin[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "super_admin") {
      throw new Error("403: Forbidden - Super Admin access required.");
    }

    // Fetch mosques
    const { data: mosques, error: mosquesError } = await supabase
      .from("mosques")
      .select("*")
      .order("created_at", { ascending: false });

    if (mosquesError) {
      console.error("Error fetching mosques:", mosquesError);
      throw mosquesError;
    }

    if (!mosques || mosques.length === 0) return [];

    // Fetch admin names for all mosques that have admin_id
    const adminIds = mosques
      .map((m) => m.admin_id)
      .filter((id): id is string => id !== null);

    let adminMap: Record<string, { name: string; email: string }> = {};
    if (adminIds.length > 0) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", adminIds);

      if (admins) {
        adminMap = Object.fromEntries(
          admins.map((a) => [
            a.id,
            { name: a.name || "Unknown", email: a.email || "" },
          ]),
        );
      }
    }

    // Fetch tags for all mosques
    const mosqueIds = mosques.map((m) => m.id);
    const { data: assignments } = await supabase
      .from("mosque_tag_assignments")
      .select("mosque_id, tag_id")
      .in("mosque_id", mosqueIds);

    let tagIds: string[] = [];
    if (assignments) {
      tagIds = [...new Set(assignments.map((a) => a.tag_id))];
    }

    let tagMap: Record<string, string> = {};
    if (tagIds.length > 0) {
      const { data: tags } = await supabase
        .from("mosque_tags")
        .select("id, name")
        .in("id", tagIds);

      if (tags) {
        tagMap = Object.fromEntries(tags.map((t) => [t.id, t.name]));
      }
    }

    // Build assignment lookup
    const assignmentLookup: Record<string, string[]> = {};
    if (assignments) {
      for (const a of assignments) {
        if (!assignmentLookup[a.mosque_id]) assignmentLookup[a.mosque_id] = [];
        if (tagMap[a.tag_id]) {
          assignmentLookup[a.mosque_id].push(tagMap[a.tag_id]);
        }
      }
    }

    return mosques.map((m) => ({
      ...m,
      admin_name: m.admin_id ? adminMap[m.admin_id]?.name || null : null,
      admin_email: m.admin_id ? adminMap[m.admin_id]?.email || null : null,
      tags: assignmentLookup[m.id] || [],
    }));
  },

  /**
   * Fetches all available mosque tags.
   */
  async fetchAllTags(): Promise<MosqueTag[]> {
    const { data, error } = await supabase
      .from("mosque_tags")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Creates a new mosque tag.
   */
  async createTag(name: string): Promise<MosqueTag> {
    const { data, error } = await supabase
      .from("mosque_tags")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
    return data;
  },

  /**
   * Uploads an image to the mosque-images bucket and returns the public URL.
   */
  async uploadMosqueImage(uri: string): Promise<string> {
    try {
      const rawExt = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const extension = ["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(
        rawExt,
      )
        ? rawExt
        : "jpg";
      const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;
      const fileName = `mosque_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const arrayBuffer = Buffer.from(base64, "base64");

      const { data, error } = await supabase.storage
        .from("mosque-images")
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("mosque-images")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error("Upload failed:", err?.message ?? err);
      throw err;
    }
  },

  /**
   * Finds an admin profile by email with role validation.
   * Returns the profile only if the user has role='admin'.
   * Throws an error if not found or not an admin.
   */
  async findAdminByEmail(
    email: string,
  ): Promise<{ id: string; name: string; email: string }> {
    const trimmed = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("email", trimmed)
      .maybeSingle();

    if (error) {
      console.error("Error finding admin by email:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No user found with this email address.");
    }

    if (data.role !== "admin") {
      throw new Error(
        'This user is not an Admin. Only users with role "admin" can be assigned.',
      );
    }

    return {
      id: data.id,
      name: data.name || "Unknown",
      email: data.email || "",
    };
  },

  /**
   * Fetches the mosque name assigned to an admin. Returns null if none.
   */
  async fetchMosqueByAdminId(
    adminId: string,
  ): Promise<{ id: string; name: string } | null> {
    const { data, error } = await supabase
      .from("mosques")
      .select("id, name")
      .eq("admin_id", adminId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching mosque by admin ID:", error);
      return null;
    }
    return data || null;
  },

  /**
   * Fetches distinct cities from mosques table.
   */
  async fetchDistinctCities(): Promise<string[]> {
    const { data, error } = await supabase
      .from("mosques")
      .select("city")
      .order("city", { ascending: true });

    if (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }

    const cities = [
      ...new Set((data || []).map((r) => r.city).filter(Boolean)),
    ];
    return cities;
  },

  /**
   * Fetches the mosque assigned to the current admin user.
   * Returns null if no mosque is assigned.
   */
  async fetchAdminMosque(): Promise<MosqueWithAdmin | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    const { data: mosques, error } = await supabase
      .from("mosques")
      .select("*")
      .eq("admin_id", user.id)
      .limit(1);

    if (error) {
      console.error("Error fetching admin mosque:", error);
      throw error;
    }

    if (!mosques || mosques.length === 0) return null;

    const mosque = mosques[0];

    // Get admin info
    let adminName: string | null = null;
    let adminEmail: string | null = null;
    if (mosque.admin_id) {
      const { data: admin } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", mosque.admin_id)
        .maybeSingle();
      if (admin) {
        adminName = admin.name;
        adminEmail = admin.email;
      }
    }

    // Get tags
    const { data: assignments } = await supabase
      .from("mosque_tag_assignments")
      .select("tag_id")
      .eq("mosque_id", mosque.id);

    let tags: string[] = [];
    if (assignments && assignments.length > 0) {
      const tagIds = [...new Set(assignments.map((a) => a.tag_id))];
      const { data: tagData } = await supabase
        .from("mosque_tags")
        .select("name")
        .in("id", tagIds);
      if (tagData) {
        tags = tagData.map((t) => t.name);
      }
    }

    return {
      ...mosque,
      admin_name: adminName,
      admin_email: adminEmail,
      tags,
    };
  },

  /**
   * Fetches all admins (for filter dropdown).
   */
  async fetchAdmins(): Promise<{ id: string; name: string; email: string }[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("role", "admin");

    if (error) {
      console.error("Error fetching admins:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Updates a mosque record.
   */
  async updateMosque(
    mosqueId: string,
    updates: Partial<Omit<MosqueRow, "id" | "created_at" | "updated_at">>,
  ): Promise<void> {
    const { error } = await supabase
      .from("mosques")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", mosqueId);

    if (error) {
      console.error("Error updating mosque:", error);
      throw error;
    }
  },

  /**
   * Creates a new mosque record.
   */
  async createMosque(
    mosque: Omit<MosqueRow, "id" | "created_at" | "updated_at">,
  ): Promise<MosqueRow> {
    const { data, error } = await supabase
      .from("mosques")
      .insert(mosque)
      .select()
      .single();

    if (error) {
      console.error("Error creating mosque:", error);
      throw error;
    }
    return data;
  },

  /**
   * Deletes a mosque by ID.
   */
  async deleteMosque(mosqueId: string): Promise<void> {
    const { error } = await supabase
      .from("mosques")
      .delete()
      .eq("id", mosqueId);

    if (error) {
      console.error("Error deleting mosque:", error);
      throw error;
    }
  },

  /**
   * Updates tags for a mosque (replaces all tags).
   */
  async updateMosqueTags(mosqueId: string, tagIds: string[]): Promise<void> {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from("mosque_tag_assignments")
      .delete()
      .eq("mosque_id", mosqueId);

    if (deleteError) {
      console.error("Error deleting old tag assignments:", deleteError);
      throw deleteError;
    }

    if (tagIds.length === 0) return;

    // Insert new assignments
    const assignments = tagIds.map((tagId) => ({
      mosque_id: mosqueId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from("mosque_tag_assignments")
      .insert(assignments);

    if (insertError) {
      console.error("Error inserting tag assignments:", insertError);
      throw insertError;
    }
  },

  /**
   * Gets tag IDs for a mosque.
   */
  async getMosqueTagIds(mosqueId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("mosque_tag_assignments")
      .select("tag_id")
      .eq("mosque_id", mosqueId);

    if (error) {
      console.error("Error fetching mosque tag IDs:", error);
      throw error;
    }
    return (data || []).map((a) => a.tag_id);
  },
};
