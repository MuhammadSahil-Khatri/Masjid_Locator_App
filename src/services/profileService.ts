import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export const profileService = {
  /**
   * Inserts a new user profile record.
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating database profile:', error);
      throw error;
    }
    return data;
  },

  /**
   * Fetches the profile of a given user ID.
   */
  async fetchCurrentUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile from database:', error);
      throw error;
    }
    return data;
  },

  /**
   * Updates an existing user profile record.
   */
  async updateProfile(
    userId: string,
    updates: { name?: string; phone?: string; cnic?: string }
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile in database:', error);
      throw error;
    }
    return data;
  },

  /**
   * Helper function to secure Super Admin operations by verifying
   * the currently authenticated user's role on the backend (Supabase).
   */
  async verifySuperAdmin(): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('403: Forbidden - Authentication required.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'super_admin') {
      throw new Error('403: Forbidden - Super Admin access required.');
    }
  },

  /**
   * Fetches all worshipers (users with role = 'user') from the database.
   * Secured: verifies that the requester is a super_admin.
   */
  async fetchAllWorshipers(): Promise<Profile[]> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worshipper');
  
    if (error) {
      console.error('Error fetching worshipers from database:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Blocks or unblocks a worshiper by ID.
   * Secured: verifies that the requester is a super_admin.
   */
  async updateWorshiperStatus(userId: string, isBlocked: boolean): Promise<Profile> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_blocked: isBlocked,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating worshiper status in database:', error);
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

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error removing user profile from database:', error);
      throw error;
    }
  },

  /**
   * Updates a user profile's role.
   * Secured: verifies that the requester is a super_admin.
   */
  async updateProfileRole(userId: string, role: 'worshipper' | 'admin' | 'super_admin'): Promise<Profile> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role in database:', error);
      throw error;
    }
    return data;
  },

  /**
   * Fetches all super admins from the database.
   * Secured: verifies that the requester is a super_admin.
   */
  async fetchAllSuperAdmins(): Promise<Profile[]> {
    await this.verifySuperAdmin();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'super_admin');

    if (error) {
      console.error('Error fetching super admins from database:', error);
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
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    if (error) {
      console.error('Error fetching admins from database:', error);
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
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Error finding profile by email:', error);
      throw error;
    }
    return data || null;
  },
};
