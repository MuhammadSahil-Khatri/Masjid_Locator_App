export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Hadees: undefined;
  Search: undefined;
  Announcements: undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
  Qibla: undefined;
};

export type AppScreen = 
  | keyof MainTabParamList 
  | 'Auth' 
  | 'MosqueDetails' 
  | 'Splash' 
  | 'Welcome'
  | 'SuperAdminPanel'
  | 'ManageMosques'
  | 'ManageAdmins'
  | 'ManageSuperAdmins'
  | 'ManageHadith'
  | 'ManageAnnouncements'
  | 'ManageWorshipers'
  | 'AdminPanel'
  | 'AssignedMosque';

export interface NavigationProps {
  currentScreen: AppScreen;
  navigateTo: (screen: AppScreen, params?: any) => void;
  params?: any;
}
