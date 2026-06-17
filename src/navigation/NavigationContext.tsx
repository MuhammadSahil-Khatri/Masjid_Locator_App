import React, { createContext, useContext, useState } from 'react';
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
    { screen: 'Home', params: undefined }
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
