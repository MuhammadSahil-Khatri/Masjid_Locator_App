import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { profileService } from './profileService';
import { Profile } from '../types';

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, metadata: { name: string; phone: string; cnic: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          phone: metadata.phone,
          phone_number: metadata.phone,
          cnic: metadata.cnic,
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      try {
        await profileService.createProfile({
          id: data.user.id,
          name: metadata.name,
          email: email,
          phone: metadata.phone,
          cnic: metadata.cnic,
          role: 'worshipper',
          is_blocked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (profileError: any) {
        // Prevent the app from continuing in a partially created authenticated state
        await supabase.auth.signOut();
        console.error('Failed to create user profile during signUp:', profileError);
        throw new Error(`Profile creation failed: ${profileError?.message || 'Please try again.'}`);
      }
    }
    return data;
  },

  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
    return await profileService.createProfile(profile);
  },

  async fetchCurrentUserProfile(userId: string) {
    return await profileService.fetchCurrentUserProfile(userId);
  },

  async updateProfile(userId: string, updates: { name?: string; phone?: string; cnic?: string }) {
    return await profileService.updateProfile(userId, updates);
  },

  async updateUserMetadata(metadata: { name?: string; phone?: string; cnic?: string }) {
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
      if (metadata.cnic !== undefined) updates.cnic = metadata.cnic;
      
      if (Object.keys(updates).length > 0) {
        await profileService.updateProfile(data.user.id, updates);
      }
    }
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
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
