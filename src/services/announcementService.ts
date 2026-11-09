import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { storageService } from './storageService';

export interface Announcement {
  id: string;
  mosque_id: string | null;
  category_id: string;
  description_en: string;
  description_ur: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_name_en?: string | null;
  category_name_ur?: string | null;
  mosque_name?: string | null;
  creator_name?: string | null;
  title?: string;
  description?: string;
  event_date?: string | null;
  event_time?: string | null;
  is_today?: boolean;
}

export interface AnnouncementCategory {
  id: string;
  name?: string;
  name_en?: string;
  name_ur?: string;
  created_at?: string;
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

    // Get category info
    const categoryIds = [...new Set(announcements.map(a => a.category_id).filter(Boolean))];
    let categoryMap: Record<string, { name_en: string; name_ur: string; name?: string }> = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('announcement_categories')
        .select('*')
        .in('id', categoryIds);
      if (categories) {
        categoryMap = Object.fromEntries(
          categories.map((c: any) => [c.id, { name_en: c.name_en || c.name || '', name_ur: c.name_ur || '', name: c.name || c.name_en || '' }])
        );
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
      if (mosques) mosqueMap = Object.fromEntries(mosques.map(m => [m.id, m.name]));
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

    const result = announcements.map(a => {
      const cat = a.category_id ? categoryMap[a.category_id] : null;
      return {
        ...a,
        category_name: cat ? (cat.name_en || cat.name || cat.name_ur) : null,
        category_name_en: cat ? cat.name_en : null,
        category_name_ur: cat ? cat.name_ur : null,
        mosque_name: a.mosque_id ? mosqueMap[a.mosque_id] || null : null,
        creator_name: a.created_by ? creatorMap[a.created_by] || null : null,
        title: a.title || (cat ? cat.name_en : 'Announcement'),
        description: a.description_en || a.description || a.description_ur || '',
      };
    });
    // Persist to local cache for offline use
    storageService.saveAnnouncements(result);
    return result;
  },

  /** Public – fetch active announcements for a specific category. */
  async fetchAnnouncementsByCategory(categoryId: string): Promise<Announcement[]> {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching category announcements:', error);
      throw error;
    }
    if (!announcements || announcements.length === 0) return [];

    // Get category info
    const { data: category } = await supabase
      .from('announcement_categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle();

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
      category_name: category ? (category.name_en || category.name || category.name_ur) : null,
      category_name_en: category ? category.name_en : null,
      category_name_ur: category ? category.name_ur : null,
      mosque_name: a.mosque_id ? mosqueMap[a.mosque_id] || null : null,
      creator_name: a.created_by ? creatorMap[a.created_by] || null : null,
      title: a.title || (category ? category.name_en : 'Announcement'),
      description: a.description_en || a.description || a.description_ur || '',
    }));
  },

  /** Public – fetch active announcements for a specific mosque. */
  async fetchAnnouncementsByMosque(mosqueId: string): Promise<Announcement[]> {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .eq('mosque_id', mosqueId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mosque announcements:', error);
      throw error;
    }
    if (!announcements || announcements.length === 0) return [];

    // Get category info
    const categoryIds = [...new Set(announcements.map(a => a.category_id).filter(Boolean))];
    let categoryMap: Record<string, { name_en: string; name_ur: string; name?: string }> = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('announcement_categories')
        .select('*')
        .in('id', categoryIds);
      if (categories) {
        categoryMap = Object.fromEntries(
          categories.map((c: any) => [c.id, { name_en: c.name_en || c.name || '', name_ur: c.name_ur || '', name: c.name || c.name_en || '' }])
        );
      }
    }

    return announcements.map(a => {
      const cat = a.category_id ? categoryMap[a.category_id] : null;
      return {
        ...a,
        category_name: cat ? (cat.name_en || cat.name || cat.name_ur) : null,
        category_name_en: cat ? cat.name_en : null,
        category_name_ur: cat ? cat.name_ur : null,
        title: a.title || (cat ? cat.name_en : 'Announcement'),
        description: a.description_en || a.description || a.description_ur || '',
      };
    });
  },

  async fetchAllAnnouncements(): Promise<Announcement[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, mosque_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
      throw new Error('403: Forbidden - Access restricted to admins.');
    }

    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    // Admins only view and manage announcements for their assigned masjid
    if (profile.role === 'admin') {
      let mosqueId = profile.mosque_id;
      if (!mosqueId) {
        const { data: m } = await supabase
          .from('mosques')
          .select('id')
          .eq('admin_id', user.id)
          .maybeSingle();
        if (m) mosqueId = m.id;
      }

      if (!mosqueId) {
        return [];
      }

      query = query.eq('mosque_id', mosqueId);
    }

    const { data: announcements, error } = await query;

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
        .select('*')
        .in('id', categoryIds);
      if (categories) {
        categoryMap = Object.fromEntries(
          categories.map((c: any) => [c.id, c.name_en || c.name || c.name_ur || ''])
        );
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
      .order('created_at', { ascending: true });

    if (error) {
      // 42501 = permission denied; anonymous users cannot read this table by design.
      // Return an empty array so callers fall back to their static defaults.
      if (error.code === '42501') {
        return [];
      }
      console.error('Error fetching categories:', error);
      throw error;
    }
    return data || [];
  },

  async createCategory(name: string, name_ur?: string): Promise<AnnouncementCategory> {
    const trimmedEn = name.trim();
    const trimmedUr = (name_ur && name_ur.trim()) || trimmedEn;
    const { data, error } = await supabase
      .from('announcement_categories')
      .insert({ name_en: trimmedEn, name_ur: trimmedUr })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }
    return data;
  },

  async fetchMosques(): Promise<{ id: string; name: string; city?: string; address?: string }[]> {
    const { data, error } = await supabase
      .from('mosques')
      .select('id, name, city, address')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching mosques:', error);
      throw error;
    }
    return data || [];
  },

  async createAnnouncement(announcement: {
    mosque_id?: string | null;
    category_id: string;
    description_en: string;
    description_ur: string;
    created_by: string;
    is_active?: boolean;
    title?: string;
    description?: string;
    event_date?: string | null;
    event_time?: string | null;
  }): Promise<Announcement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, mosque_id')
      .eq('id', user.id)
      .maybeSingle();

    let mosqueId = announcement.mosque_id || null;

    if (profile?.role === 'admin') {
      mosqueId = profile.mosque_id;
      if (!mosqueId) {
        const { data: m } = await supabase
          .from('mosques')
          .select('id')
          .eq('admin_id', user.id)
          .maybeSingle();
        if (m) mosqueId = m.id;
      }
      if (!mosqueId) {
        throw new Error('You do not have an assigned mosque to create announcements for.');
      }
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        mosque_id: mosqueId,
        category_id: announcement.category_id,
        description_en: announcement.description_en,
        description_ur: announcement.description_ur,
        created_by: user.id,
        is_active: announcement.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
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
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
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
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  },
};