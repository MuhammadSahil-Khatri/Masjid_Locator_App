import React, { createContext, useContext, useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { AppScreen } from './types';

interface NavigationContextType {
  currentScreen: AppScreen;
  params: any;
  navigate: (screen: AppScreen, params?: any) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<Array<{ screen: AppScreen; params: any }>>([
    { screen: 'Splash', params: undefined }
  ]);

  const current = history[history.length - 1] || { screen: 'Home', params: undefined };

  const navigate = (screen: AppScreen, params?: any) => {
    setHistory(prev => [...prev, { screen, params }]);
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  // The 4 main-tab screens (other than Home) that should navigate to Home on back press
  const MAIN_TAB_SCREENS: AppScreen[] = ['Hadees', 'Search', 'Announcements', 'Profile'];

  useEffect(() => {
    const handleBackPress = () => {
      const currentScreen = current.screen;

      // Exit app from Home / Auth / Splash / Welcome
      if (
        currentScreen === 'Splash' ||
        currentScreen === 'Welcome' ||
        currentScreen === 'Home' ||
        currentScreen === 'Auth'
      ) {
        return false;
      }

      // The 4 other main tabs → go to Home
      if (MAIN_TAB_SCREENS.includes(currentScreen)) {
        setHistory([{ screen: 'Home', params: undefined }]);
        return true;
      }

      // All other sub-screens → normal stack back
      if (history.length > 1) {
        goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [history, current.screen]);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen: current.screen,
        params: current.params,
        navigate,
        goBack
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
