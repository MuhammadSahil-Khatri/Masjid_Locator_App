/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import {
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_500Medium,
  NotoNaskhArabic_600SemiBold,
  NotoNaskhArabic_700Bold,
} from '@expo-google-fonts/noto-naskh-arabic';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { CustomToast } from './components/common/CustomToast';
import Toast from 'react-native-toast-message';
import { toastConfig } from './components/common/ToastConfig';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors, spacing, typography } from './theme';

const queryClient = new QueryClient();

function AppMain() {
  return (
    <SafeAreaView style={[styles.safeArea, styles.lightBg]}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.lightBg.backgroundColor} />
      <View style={styles.container}>
        <RootNavigator />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'NotoNaskhArabic-Regular': NotoNaskhArabic_400Regular,
    'NotoNaskhArabic-Medium': NotoNaskhArabic_500Medium,
    'NotoNaskhArabic-SemiBold': NotoNaskhArabic_600SemiBold,
    'NotoNaskhArabic-Bold': NotoNaskhArabic_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
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
          {/* react-native-toast-message must be outside all providers to overlay everything */}
          <Toast config={toastConfig} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
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
