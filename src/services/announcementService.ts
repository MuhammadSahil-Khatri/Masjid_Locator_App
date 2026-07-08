import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  mosque_id: string;
  category_id: string;
  title: string;
  description: string;
  event_date: string | null;
  event_time: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  mosque_name?: string;
  creator_name?: string;
  is_today?: boolean;
}

export interface AnnouncementCategory {
  id: string;
  name: string;
  created_at: string;
}

export const announcementService = {
  /** Public – no admin role required. Returns all active announcements with mosque & category names. */
  async fetchPublicAnnouncements(): Promise<Announcement[]> {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public announcements:', error);
      throw error;
    }
    if (!announcements || announcements.length === 0) return [];

    // Get category names
    const categoryIds = [...new Set(announcements.map(a => a.category_id).filter(Boolean))];
    let categoryMap: Record<string, string> = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('announcement_categories')
        .select('id, name')
        .in('id', categoryIds);
      if (categories) categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    }

    // Get mosque names
    const mosqueIds = [...new Set(announcements.map(a => a.mosque_id).filter(Boolean))];
    let mosqueMap: Record<string, string> = {};
    if (mosqueIds.length > 0) {
      const { data: mosques } = await supabase
        .from('mosques')
        .select('id, name')
        .in('id', mosqueIds);
      if (mosques) mosqueMap = Object.fromEntries(mosques.map(m => [m.id, m.name]));
    }

    return announcements.map(a => ({
      ...a,
      category_name: a.category_id ? categoryMap[a.category_id] || null : null,
      mosque_name: a.mosque_id ? mosqueMap[a.mosque_id] || null : null,
    }));
  },

  async fetchAllAnnouncements(): Promise<Announcement[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
      throw new Error('403: Forbidden - Access restricted to admins.');
    }

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
    if (!announcements || announcements.length === 0) return [];

    // Get category names
    const categoryIds = [...new Set(announcements.map(a => a.category_id).filter(Boolean))];
    let categoryMap: Record<string, string> = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('announcement_categories')
        .select('id, name')
        .in('id', categoryIds);
      if (categories) {
        categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
      }
    }

    // Get mosque names
    const mosqueIds = [...new Set(announcements.map(a => a.mosque_id).filter(Boolean))];
    let mosqueMap: Record<string, string> = {};
    if (mosqueIds.length > 0) {
      const { data: mosques } = await supabase
        .from('mosques')
        .select('id, name')
        .in('id', mosqueIds);
      if (mosques) {
        mosqueMap = Object.fromEntries(mosques.map(m => [m.id, m.name]));
      }
    }

    // Get creator names
    const creatorIds = [...new Set(announcements.map(a => a.created_by).filter(Boolean))];
    let creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', creatorIds);
      if (creators) {
        creatorMap = Object.fromEntries(creators.map(c => [c.id, c.name]));
      }
    }

    return announcements.map(a => ({
      ...a,
      category_name: a.category_id ? categoryMap[a.category_id] || null : null,
      mosque_name: a.mosque_id ? mosqueMap[a.mosque_id] || null : null,
      creator_name: a.created_by ? creatorMap[a.created_by] || null : null,
    }));
  },

  async fetchCategories(): Promise<AnnouncementCategory[]> {
    const { data, error } = await supabase
      .from('announcement_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    return data || [];
  },

  async createCategory(name: string): Promise<AnnouncementCategory> {
    const { data, error } = await supabase
      .from('announcement_categories')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }
    return data;
  },

  async fetchMosques(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('mosques')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching mosques:', error);
      throw error;
    }
    return data || [];
  },

  async createAnnouncement(announcement: {
    mosque_id: string;
    category_id: string;
    title: string;
    description: string;
    event_date: string | null;
    event_time: string | null;
    created_by: string;
  }): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        mosque_id: announcement.mosque_id,
        category_id: announcement.category_id,
        title: announcement.title,
        description: announcement.description,
        event_date: announcement.event_date,
        event_time: announcement.event_time,
        created_by: announcement.created_by,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
    return data;
  },

  async updateAnnouncement(
    id: string,
    updates: Partial<Omit<Announcement, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
};