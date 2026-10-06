import catalogueData from '../../assets/dua_data/catalogue.json';

export interface DuaCategory {
  id: string;
  titleEn: string;
  titleUr: string;
  description: string;
  entryCount: number;
}

export interface DuaItem {
  id: string;
  title: string;
  chapterTitle: string;
  chapterNumber: number;
  sourceReference: string;
  arabic: string;
  transliteration: string;
  translation: string;
  repeat: number | null;
  audioUrl: string | null;
  tags: string[];
}

const URDU_CATEGORY_TITLES: Record<string, string> = {
  'morning-and-evening': 'صبح اور شام کے اذکار',
  'sleep-and-waking': 'سونے اور جاگنے کے اذکار',
  'prayer-and-the-masjid': 'نماز اور مسجد کی دعائیں',
  'wudu-and-purification': 'وضو اور طہارت',
  'food-and-drink': 'کھانے پینے کے آداب و دعائیں',
  'fasting': 'روزہ اور افطار',
  'home-and-family': 'گھر اور اہل خانہ',
  'travel': 'سفر کی دعائیں',
  'hajj-and-umrah': 'حج اور عمرہ کے مناسک',
  'weather-and-nature': 'موسم اور قدرتی مناظر',
  'distress-and-anxiety': 'پریشانی اور غم سے نجات',
  'illness-and-healing': 'بیماری اور شفا کی دعائیں',
  'protection-and-refuge': 'حفاظت اور پناہ مانگنا',
  'forgiveness-and-repentance': 'توبہ اور استغفار',
  'provision-and-debt': 'رزق اور قرض کی ادائی',
  'knowledge-and-guidance': 'استخارہ اور علم و ہدایت',
  'gatherings-and-greetings': 'مجالس اور آداب سلام',
  'death-and-the-deceased': 'جنازہ اور تعزیت',
  'dhikr-and-praise': 'ذکر و تسبیحات',
};

class DuaService {
  private categories: DuaCategory[] = [];
  private duas: DuaItem[] = [];
  private initialized = false;

  private initialize() {
    if (this.initialized) return;

    try {
      const data = catalogueData as any;
      const duasMap = new Map<string, any>((data.duas || []).map((d: any) => [d.id, d]));
      const chaptersMap = new Map<string, any>((data.chapters || []).map((c: any) => [c.id, c]));

      // Parse all entries
      this.duas = (data.entries || []).map((e: any): DuaItem => {
        const chapter = chaptersMap.get(e.chapterId);
        const audioUrl = e.variations?.[0]?.steps?.[0]?.recordings?.[0]?.url || null;
        let arabic = '';
        let transliteration = '';
        let translation = '';
        let repeat: number | null = null;

        if (e.variations && e.variations.length > 0) {
          const steps = e.variations[0].steps || [];
          for (const s of steps) {
            if (s.items && s.items.length > 0) {
              for (const item of s.items) {
                const duaObj = item.dua || (item.duaId ? duasMap.get(item.duaId) : null);
                if (duaObj) {
                  arabic = duaObj.arabic || arabic;
                  transliteration = duaObj.transliteration || transliteration;
                  translation = duaObj.translation || translation;
                }
                if (item.repeat) repeat = item.repeat;
              }
            }
          }
        }

        if (!arabic && e.steps && e.steps.length > 0) {
          arabic = e.steps.map((s: any) => s.arabic).filter(Boolean).join('\n');
          translation = e.steps.map((s: any) => s.text).filter(Boolean).join('\n');
        }

        return {
          id: e.id,
          title: e.title || '',
          chapterTitle: chapter?.title || '',
          chapterNumber: chapter?.number || 0,
          sourceReference: e.sourceReference || '',
          arabic: arabic.trim(),
          transliteration: transliteration.trim(),
          translation: translation.trim(),
          repeat,
          audioUrl,
          tags: Array.isArray(e.tags) ? e.tags : [],
        };
      });

      // Parse tags as categories
      this.categories = (data.tags || []).map((t: any): DuaCategory => {
        const count = this.duas.filter((d) => d.tags.includes(t.id)).length;
        return {
          id: t.id,
          titleEn: t.title || '',
          titleUr: URDU_CATEGORY_TITLES[t.id] || t.title || '',
          description: t.description || '',
          entryCount: count || t.entryCount || 0,
        };
      });

      this.initialized = true;
    } catch (err) {
      console.error('Failed to parse dua catalogue data:', err);
    }
  }

  public getCategories(): DuaCategory[] {
    this.initialize();
    return this.categories;
  }

  public getDuasByCategory(categoryId: string): DuaItem[] {
    this.initialize();
    if (!categoryId) return this.duas;
    return this.duas.filter((d) => d.tags.includes(categoryId));
  }

  public getAllDuas(): DuaItem[] {
    this.initialize();
    return this.duas;
  }

  public searchDuas(query: string, categoryId?: string): DuaItem[] {
    this.initialize();
    const clean = query.trim().toLowerCase();
    let pool = categoryId ? this.getDuasByCategory(categoryId) : this.duas;
    if (!clean) return pool;

    return pool.filter(
      (d) =>
        d.title.toLowerCase().includes(clean) ||
        d.translation.toLowerCase().includes(clean) ||
        d.transliteration.toLowerCase().includes(clean) ||
        d.chapterTitle.toLowerCase().includes(clean) ||
        d.arabic.includes(clean)
    );
  }

  public getCategoryById(categoryId: string): DuaCategory | undefined {
    this.initialize();
    return this.categories.find((c) => c.id === categoryId);
  }
}

export const duaService = new DuaService();
