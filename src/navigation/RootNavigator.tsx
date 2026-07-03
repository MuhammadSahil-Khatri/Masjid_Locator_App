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
    if (authLoading) return;

    if (currentScreen === 'Splash' || currentScreen === 'Welcome') return;

    if (!user && currentScreen !== 'Auth') {
      navigate('Auth');
    } else if (user && currentScreen === 'Auth') {
      navigate('Home');
    }
  }, [user, authLoading, currentScreen]);

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
