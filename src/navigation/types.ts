export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AppScreen = keyof MainTabParamList | 'Auth' | 'MosqueDetails';

export interface NavigationProps {
  currentScreen: AppScreen;
  navigateTo: (screen: AppScreen, params?: any) => void;
  params?: any;
}
