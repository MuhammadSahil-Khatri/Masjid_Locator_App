import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { useNavigation } from './NavigationContext';
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { MainNavigator } from './MainNavigator';
import { colors } from '../theme';

export const RootNavigator: React.FC = () => {
  const { currentUser, highContrast: isDark } = useApp();
  const { currentScreen, navigate } = useNavigation();

  // Route protection
  useEffect(() => {
    if (!currentUser && currentScreen !== 'Auth') {
      navigate('Auth');
    } else if (currentUser && currentScreen === 'Auth') {
      navigate('Home');
    }
  }, [currentUser, currentScreen]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      {currentScreen === 'Auth' ? (
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
});
export default RootNavigator;
