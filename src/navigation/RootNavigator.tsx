import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from './NavigationContext';
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { SplashScreen } from '../screens/Auth/SplashScreen';
import { WelcomeScreen } from '../screens/Auth/WelcomeScreen';
import { MainNavigator } from './MainNavigator';
import { colors } from '../theme';

export const RootNavigator: React.FC = () => {
  const { currentScreen } = useNavigation();

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
