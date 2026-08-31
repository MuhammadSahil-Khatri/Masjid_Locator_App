export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Hadees: undefined;
  Search: undefined;
  Announcement: undefined;
  Masjids: undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
  Qibla: undefined;
  PrayerTimes: undefined;
};

export type AppScreen = 
  | keyof MainTabParamList 
  | 'Announcements'
  | 'Auth' 
  | 'MosqueDetails' 
  | 'PrayerTimes'
  | 'Splash' 
  | 'Welcome'
  | 'CategoryAnnouncements'
  | 'SuperAdminPanel'
  | 'ManageMosques'
  | 'ManageAdmins'
  | 'ManageSuperAdmins'
  | 'ManageHadith'
  | 'ManageAnnouncements'
  | 'ManageWorshipers'
  | 'AdminPanel'
  | 'AssignedMosque'
  | 'ChangePassword'
  | 'EditProfile';

export interface NavigationProps {
  currentScreen: AppScreen;
  navigateTo: (screen: AppScreen, params?: any) => void;
  params?: any;
}
