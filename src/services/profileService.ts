import { supabase } from "../lib/supabase";
import { Profile } from "../types";

export const profileService = {
  /**
   * Inserts a new user profile record.
   */
  async createProfile(
    profile: Omit<Profile, "created_at" | "updated_at"> & {
      created_at?: string;
      updated_at?: string;
    },
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error("Error creating database profile:", error);
      throw error;
    }
    return data;
  },

  /**
   * Fetches the profile of a given user ID.
   */
  async fetchCurrentUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile from database:", error);
      throw error;
    }
    return data;
  },

  /**
   * Updates an existing user profile record.
   */
  async updateProfile(
    userId: string,
    updates: { name?: string; phone?: string },
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile in database:", error);
      throw error;
    }
    return data;
  },

  /**
   * Helper function to secure Super Admin operations by verifying
   * the currently authenticated user's role on the backend (Supabase).
   */
  async verifySuperAdmin(): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("403: Forbidden - Authentication required.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "super_admin") {
      throw new Error("403: Forbidden - Super Admin access required.");
    }
  },

  /**
   * Fetches all worshipers (users with role = 'user') from the database.
   * Secured: verifies that the requester is a super_admin.
   */
  async fetchAllWorshipers(): Promise<Profile[]> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "worshipper");

    if (error) {
      console.error("Error fetching worshipers from database:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Blocks or unblocks a worshiper by ID.
   * Secured: verifies that the requester is a super_admin.
   */
  async updateWorshiperStatus(
    userId: string,
    isBlocked: boolean,
  ): Promise<Profile> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        is_blocked: isBlocked,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating worshiper status in database:", error);
      throw error;
    }
    return data;
  },

  /**
   * Deletes a user profile from the database.
   * Secured: verifies that the requester is a super_admin.
   */
  async removeWorshiper(userId: string): Promise<void> {
    await this.verifySuperAdmin();

    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) {
      console.error("Error removing user profile from database:", error);
      throw error;
    }
  },

  /**
   * Updates a user profile's role.
   * Secured: verifies that the requester is a super_admin.
   */
  async updateProfileRole(
    userId: string,
    role: "admin" | "super_admin",
  ): Promise<Profile> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role in database:", error);
      throw error;
    }
    return data;
  },

  /**
   * Promotes a user to Admin and assigns them to a mosque.
   * Both profiles.mosque_id and mosques.admin_id are kept synchronized.
   * Secured: verifies that the requester is a super_admin.
   */
  async promoteToAdmin(
    userId: string,
    mosqueId: string,
    updates?: { name?: string; phone?: string | null }
  ): Promise<Profile> {
    await this.verifySuperAdmin();

    const payload: any = {
      role: "admin",
      mosque_id: mosqueId,
      updated_at: new Date().toISOString(),
    };
    if (updates?.name) payload.name = updates.name.trim();
    if (updates?.phone !== undefined) payload.phone = updates.phone ? updates.phone.trim() : null;

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error promoting user to admin:", error);
      throw error;
    }

    // Synchronize mosques.admin_id
    try {
      await supabase
        .from("mosques")
        .update({
          admin_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mosqueId);
    } catch (mErr) {
      console.warn("Notice: sync trigger may have handled mosque update:", mErr);
    }

    return data;
  },

  /**
   * Removes an admin, optionally clearing mosque admin assignment.
   * Secured: verifies that the requester is a super_admin.
   */
  async removeAdmin(userId: string, mosqueId?: string | null): Promise<void> {
    await this.verifySuperAdmin();

    if (mosqueId) {
      try {
        await supabase
          .from("mosques")
          .update({ admin_id: null, updated_at: new Date().toISOString() })
          .eq("id", mosqueId);
      } catch (err) {
        console.warn("Notice: error clearing mosque admin_id:", err);
      }
    }

    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) {
      console.error("Error removing admin profile:", error);
      throw error;
    }
  },

  /**
   * Fetches all super admins from the database.
   * Secured: verifies that the requester is a super_admin.
   */
  async fetchAllSuperAdmins(): Promise<Profile[]> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "super_admin");

    if (error) {
      console.error("Error fetching super admins from database:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches all admins (users with role = 'admin') from the database.
   * Secured: verifies that the requester is a super_admin.
   */
  async fetchAllAdmins(): Promise<Profile[]> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin");

    if (error) {
      console.error("Error fetching admins from database:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Finds a user profile by email.
   * Secured: verifies that the requester is a super_admin.
   */
  async findProfileByEmail(email: string): Promise<Profile | null> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error("Error finding profile by email:", error);
      throw error;
    }
    return data || null;
  },

  /**
   * Creates a brand-new admin: signs up in Auth, inserts profile with
   * role = 'admin', mosque_id = mosqueId, is_blocked = false, then
   * synchronises mosques.admin_id.
   *
   * Secured: verifies that the requester is a super_admin.
   *
   * NOTE: supabase.auth.signUp() signs in the new user, displacing the
   * current session. We snapshot the super admin session first and restore
   * it before any database writes so all subsequent calls run under the
   * correct role and RLS policies are satisfied.
   */
  async createAdminUser(
    email: string,
    password: string,
    name: string,
    phone: string | null,
    mosqueId: string,
  ): Promise<Profile> {
    // Optional early check for a friendlier client-side error.
    // The Edge Function independently enforces authorization.
    await this.verifySuperAdmin();

    const { data, error } = await supabase.functions.invoke(
      "create-admin",
      {
        body: {
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: phone?.trim() || null,
          mosqueId,
        },
      },
    );

    if (error) {
      console.error("Error calling create-admin function:", error);
      throw new Error(
        "Could not create the admin. Check your connection and Supabase function logs.",
      );
    }

    if (!data?.profile) {
      throw new Error(
        data?.error || "The server did not return the created admin profile.",
      );
    }

    return data.profile as Profile;
  },
};

