import { supabase } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { profileService } from "./profileService";
import { Profile } from "../types";
import { onlineManager } from "@tanstack/react-query";

export interface LogoutResult {
  serverRevoked: boolean;
  error?: string | null;
}

export const authService = {
  async login(email: string, password: string) {
    if (!onlineManager.isOnline()) {
      throw new Error("Internet connection unavailable. Please check your network and try again.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(
    email: string,
    password: string,
    metadata: { name: string; phone: string },
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          phone: metadata.phone,
          phone_number: metadata.phone,
        },
      },
    });
    if (error) throw error;

    return data;
  },

  async createProfile(profile: Omit<Profile, "created_at" | "updated_at">) {
    return await profileService.createProfile(profile);
  },

  async fetchCurrentUserProfile(userId: string) {
    return await profileService.fetchCurrentUserProfile(userId);
  },

  async updateProfile(
    userId: string,
    updates: { name?: string; phone?: string },
  ) {
    return await profileService.updateProfile(userId, updates);
  },

  async updateUserMetadata(metadata: { name?: string; phone?: string }) {
    // 1. Update Auth Metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        ...(metadata.phone ? { phone_number: metadata.phone } : {}),
      },
    });
    if (error) throw error;

    // 2. Update Database Profiles Table (if logged in)
    if (data.user) {
      const updates: any = {};
      if (metadata.name !== undefined) updates.name = metadata.name;
      if (metadata.phone !== undefined) updates.phone = metadata.phone;

      if (Object.keys(updates).length > 0) {
        await profileService.updateProfile(data.user.id, updates);
      }
    }
    return data;
  },

  /**
   * Safe logout handling distinction between server-side revocation and local cleanup.
   */
  async logout(options?: { scope?: "global" | "local" }): Promise<LogoutResult> {
    const isOnline = onlineManager.isOnline();

    if (isOnline && options?.scope !== "local") {
      try {
        const { error } = await supabase.auth.signOut({ scope: "global" });
        if (error) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          return { serverRevoked: false, error: error.message };
        }
        return { serverRevoked: true };
      } catch (err: any) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        return { serverRevoked: false, error: err?.message || "Failed to contact auth server" };
      }
    }

    // Offline or explicit local scope: clear local session only
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err: any) {
      return { serverRevoked: false, error: err?.message || "Local sign out failed" };
    }
    return { serverRevoked: false, error: "Device offline; session cleared locally only" };
  },

  isSessionExpired(session: Session | null): boolean {
    if (!session || !session.expires_at) return true;
    // expires_at is unix timestamp in seconds
    return session.expires_at * 1000 <= Date.now();
  },

  async refreshSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  },

  async forgotPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  async verifyPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};

