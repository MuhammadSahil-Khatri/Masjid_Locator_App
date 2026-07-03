export type Language = 'en' | 'ur';

export type UserRole = 'worshipper' | 'admin' | 'super_admin';

export interface UserAccount {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  assignedMasjidId?: string; // Admins can be assigned to a specific masjid
  region?: string; // Selected default region for calculation
  phone?: string;
  cnic?: string;
  is_blocked?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  phone?: string;
  cnic?: string;
  role: 'worshipper' | 'admin' | 'super_admin';
  email?: string;
  is_blocked: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CalculationMethod = 'MWL' | 'ISNA' | 'UmmAlQura' | 'Karachi' | 'Egypt';

export type JuristicMethod = 'Standard' | 'Hanafi';

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string;
}

export interface Masjid {
  id: string;
  nameEn: string;
  nameUr: string;
  addressEn: string;
  addressUr: string;
  lat: number;
  lng: number;
  distance: number; // in km
  image: string;
  contactNumber: string;
  capacity: number;
  genderHalls: boolean;
  janazaFacility: boolean;
  schoolOfThought?: string;
  isVerified: boolean;
  prayerTimes: PrayerTimes;
  calculationMethod: CalculationMethod;
  juristicMethod: JuristicMethod;
}

export interface Announcement {
  id: string;
  masjidId: string;
  masjidName: string;
  titleEn: string;
  titleUr: string;
  contentEn: string;
  contentUr: string;
  date: string;
  isRead: boolean;
  priority: 'high' | 'normal';
}

export interface Hadees {
  id: string;
  textAr: string;
  textEn: string;
  textUr: string;
  referenceEn: string;
  referenceUr: string;
  source: string;
}

export interface MasjidEvent {
  id: string;
  masjidId: string;
  masjidName: string;
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  date: string;
  time: string;
  category: 'iftar' | 'lecture' | 'janaza' | 'general';
  rsvpStatus: 'going' | 'declined' | 'none';
  rsvpCount: number;
}

export interface NotificationPreference {
  prayerReminders: boolean;
  announcements: boolean;
  events: boolean;
  dailyHadees: boolean;
}

// ── AlAdhan API Types ─────────────────────────────────────────────────────────

export interface PrayerTimingsData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface AlAdhanDate {
  readable: string;
  timestamp: string;
  hijri: {
    date: string;
    day: string;
    month: { number: number; en: string; ar: string };
    year: string;
    weekday: { en: string; ar: string };
  };
  gregorian: {
    date: string;
    day: string;
    month: { number: number; en: string };
    year: string;
    weekday: { en: string };
  };
}

export interface AlAdhanMeta {
  latitude: number;
  longitude: number;
  timezone: string;
  method: { id: number; name: string };
}

export interface AlAdhanTimingsResponse {
  code: number;
  status: string;
  data: {
    timings: PrayerTimingsData;
    date: AlAdhanDate;
    meta: AlAdhanMeta;
  };
}

export interface ParsedPrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerTimesState {
  timings: ParsedPrayerTimes | null;
  hijriDate: string;
  gregorianDate: string;
  city: string;
  loading: boolean;
  error: string | null;
}

