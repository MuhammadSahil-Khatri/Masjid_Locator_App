import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { AppScreen } from './types';
import { pushNotificationService } from '../services/pushNotificationService';

interface NavigationContextType {
  currentScreen: AppScreen;
  params: any;
  navigate: (screen: AppScreen, params?: any) => void;
  goBack: () => void;
  navigateFromNotification: (type: string, recordId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Pending navigation queue for cold-start / early events before provider is ready
let pendingNotificationNavigation: { type: string; recordId: string } | null = null;

export const queueEarlyNotificationNavigation = (type: string, recordId: string) => {
  pendingNotificationNavigation = { type, recordId };
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<Array<{ screen: AppScreen; params: any }>>([
    { screen: 'Splash', params: undefined },
  ]);

  const current = history[history.length - 1] || { screen: 'Home', params: undefined };

  const navigate = useCallback((screen: AppScreen, params?: any) => {
    setHistory((prev) => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  const navigateFromNotification = useCallback((type: string, recordId: string) => {
    if (!type || !recordId) return;
    const targetScreen: AppScreen =
      type === 'announcement' ? 'AnnouncementDetail' : type === 'hadith' ? 'HadithDetail' : 'Notifications';

    setHistory((prev) => {
      const active = prev[prev.length - 1];
      if (!active || active.screen === 'Splash' || active.screen === 'Welcome') {
        // App cold-started from tap: replace splash with Home and push target detail screen
        return [
          { screen: 'Home', params: undefined },
          { screen: targetScreen, params: { id: recordId } },
        ];
      }
      // If already on target screen with same recordId, do not duplicate
      if (active.screen === targetScreen && active.params?.id === recordId) {
        return prev;
      }
      return [...prev, { screen: targetScreen, params: { id: recordId } }];
    });
  }, []);

  // Connect pushNotificationService navigation delegate
  useEffect(() => {
    pushNotificationService.setNavigationCallback((type, recordId) => {
      navigateFromNotification(type, recordId);
    });

    if (pendingNotificationNavigation) {
      const { type, recordId } = pendingNotificationNavigation;
      pendingNotificationNavigation = null;
      navigateFromNotification(type, recordId);
    }

    return () => {
      pushNotificationService.setNavigationCallback(null);
    };
  }, [navigateFromNotification]);

  // Main-tab screens that should go to Home on back press
  const MAIN_TAB_SCREENS: string[] = ['Hadees', 'Supplication', 'Announcement', 'Announcements', 'Masjids', 'Profile', 'Settings'];

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

      // Sub-screens → normal back navigation
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
  }, [history, current.screen, goBack]);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen: current.screen,
        params: current.params,
        navigate,
        goBack,
        navigateFromNotification,
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
