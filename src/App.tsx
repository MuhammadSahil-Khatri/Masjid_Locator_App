/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider, useNavigation } from './navigation/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { CustomToast } from './components/common/CustomToast';
import Toast from 'react-native-toast-message';
import { toastConfig } from './components/common/ToastConfig';
import { GlobalToastModal } from './components/common/GlobalToastModal';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister, CACHE_MAX_AGE, CACHE_BUSTER } from './lib/queryClient';
import { storageService } from './services/storageService';
import { colors, spacing, typography } from './theme';
import * as SplashScreen from 'expo-splash-screen';

// Immediately dismiss any native React Native / Expo splash screen
SplashScreen.hideAsync().catch(() => { });

function AppMain() {
  const { highContrast: isDark } = useApp();
  const { currentScreen } = useNavigation();
  const isSplash = currentScreen === 'Splash';
  const safeAreaBg = colors.light.background;

  return (
    <SafeAreaView
      edges={isSplash ? [] : ['top', 'bottom', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: isSplash ? 'transparent' : safeAreaBg }]}
    >
      <StatusBar style={isSplash ? 'light' : 'dark'} />




      <View style={styles.container}>
        <RootNavigator />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Aeonik-Light': require('../assets/Fonts/AEONIK/AEONIK-LIGHT.OTF'),
    'Aeonik-Regular': require('../assets/Fonts/AEONIK/AEONIK-REGULAR.OTF'),
    'Aeonik-Medium': require('../assets/Fonts/AEONIK/AEONIK-MEDIUM.OTF'),
    'Aeonik-SemiBold': require('../assets/Fonts/AEONIK/AEONIK-BOLD.OTF'),
    'Aeonik-Bold': require('../assets/Fonts/AEONIK/AEONIK-BOLD.OTF'),
    'Aeonik-Black': require('../assets/Fonts/AEONIK/AEONIK-BLACK.OTF'),
    'NotoNastaliqUrdu-Regular': require('../assets/Fonts/Noto_Nastaliq_Urdu/NotoNastaliqUrdu-Regular.ttf'),
    'NotoNastaliqUrdu-Medium': require('../assets/Fonts/Noto_Nastaliq_Urdu/NotoNastaliqUrdu-Medium.ttf'),
    'NotoNastaliqUrdu-SemiBold': require('../assets/Fonts/Noto_Nastaliq_Urdu/NotoNastaliqUrdu-SemiBold.ttf'),
    'NotoNastaliqUrdu-Bold': require('../assets/Fonts/Noto_Nastaliq_Urdu/NotoNastaliqUrdu-Bold.ttf'),
    'Amiri-Regular': require('../assets/Fonts/Amiri/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/Fonts/Amiri/Amiri-Bold.ttf'),
  });

  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
    storageService.hydrate().catch((e) => console.warn('Initialization error:', e));
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: CACHE_MAX_AGE,
        buster: CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return query.state.status === 'success' && query.state.data !== undefined;
          },
        },
      }}
    >
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NavigationProvider>
                <AppMain />
                <AppToastConsumer />
              </NavigationProvider>
            </GestureHandlerRootView>
          </AppProvider>
          {/* GlobalToastModal wraps Toast in its own transparent native Modal so it
              always renders above any other open Modal (Android native window stacking) */}
          <GlobalToastModal />
        </AuthProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

function AppToastConsumer() {
  const { toastMessage } = useApp();
  return <CustomToast message={toastMessage} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  darkBg: {
    backgroundColor: '#020617', // Slate-950
  },
  lightBg: {
    backgroundColor: '#f8fafc', // Slate-50
  },
  container: {
    flex: 1,
  },
});
