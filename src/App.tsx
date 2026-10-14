/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { CustomToast } from './components/common/CustomToast';
import Toast from 'react-native-toast-message';
import { toastConfig } from './components/common/ToastConfig';
import { GlobalToastModal } from './components/common/GlobalToastModal';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './lib/queryClient';
import { storageService } from './services/storageService';
import { colors, spacing, typography } from './theme';

function AppMain() {
  const { highContrast: isDark } = useApp();
  const safeAreaBg = colors.light.background;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: safeAreaBg }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
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
    storageService.hydrate();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
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
