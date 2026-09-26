import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { useNavigation } from './NavigationContext';
import { useAuth } from '../hooks/useAuth';
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { SplashScreen } from '../screens/Auth/SplashScreen';
import { WelcomeScreen } from '../screens/Auth/WelcomeScreen';
import { MainNavigator } from './MainNavigator';
import { colors } from '../theme';

export const RootNavigator: React.FC = () => {
  const { highContrast: isDark } = useApp();
  const { user, authLoading } = useAuth();
  const { currentScreen, navigate } = useNavigation();

  // Route protection
  useEffect(() => {
    // 1. Wait for initial authentication determination to resolve
    if (authLoading) return;

    // 2. While on Splash, let SplashScreen handle the initial transition once ready
    if (currentScreen === 'Splash') return;

    if (!user) {
      // Unauthenticated user should only be on Welcome or Auth
      if (currentScreen !== 'Welcome' && currentScreen !== 'Auth') {
        navigate('Welcome');
      }
    } else {
      // Authenticated user should not be on Welcome or Auth
      if (currentScreen === 'Welcome' || currentScreen === 'Auth') {
        navigate('Home');
      }
    }
  }, [user, authLoading, currentScreen, navigate]);

  if (authLoading && currentScreen !== 'Splash') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.light.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.light.background }]}>
      {currentScreen === 'Splash' ? (
        <SplashScreen />
      ) : currentScreen === 'Welcome' ? (
        <WelcomeScreen />
      ) : currentScreen === 'Auth' ? (
        <AuthScreen />
      ) : (
        <MainNavigator />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default RootNavigator;
