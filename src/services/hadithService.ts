import { supabase } from '../lib/supabase';

export interface Hadith {
  id: string;
  arabic_text: string;
  urdu_translation: string;
  english_translation: string;
  reference: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

export const hadithService = {
  async fetchAllHadith(): Promise<Hadith[]> {
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

    const { data: hadiths, error } = await supabase
      .from('hadith')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hadith:', error);
      throw error;
    }

    if (!hadiths || hadiths.length === 0) return [];

    // Get creator names
    const creatorIds = [...new Set(hadiths.map(h => h.created_by).filter(Boolean))];
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

    return hadiths.map(h => ({
      ...h,
      creator_name: h.created_by ? creatorMap[h.created_by] || null : null,
    }));
  },

  async createHadith(hadith: {
    arabic_text: string;
    urdu_translation: string;
    english_translation: string;
    reference: string;
    created_by: string;
  }): Promise<Hadith> {
    const { data, error } = await supabase
      .from('hadith')
      .insert({
        arabic_text: hadith.arabic_text,
        urdu_translation: hadith.urdu_translation,
        english_translation: hadith.english_translation,
        reference: hadith.reference,
        created_by: hadith.created_by,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hadith:', error);
      throw error;
    }
    return data;
  },

  async updateHadith(
    id: string,
    updates: Partial<Omit<Hadith, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('hadith')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating hadith:', error);
      throw error;
    }
  },

  async deleteHadith(id: string): Promise<void> {
    const { error } = await supabase
      .from('hadith')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting hadith:', error);
      throw error;
    }
  },
};