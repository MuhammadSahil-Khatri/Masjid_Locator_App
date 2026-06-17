export type Language = 'en' | 'ur';

export type UserRole = 'worshipper' | 'sub_admin' | 'super_admin';

export interface UserAccount {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  assignedMasjidId?: string; // Sub-admins can be assigned to a specific masjid
  region?: string; // Selected default region for calculation
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
