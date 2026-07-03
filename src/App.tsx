/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from './components/ui/Text';
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
import { NavigationProvider, useNavigation } from './navigation/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { CustomToast } from './components/common/CustomToast';
import Toast from 'react-native-toast-message';
import { toastConfig } from './components/common/ToastConfig';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors, spacing, typography } from './theme';

const queryClient = new QueryClient();

function AppMain() {
  const { highContrast: isDarkMode, activeRole, handleRoleToggle, language, setLanguage, setHighContrast } = useApp();
  const { navigate } = useNavigation();
  const [simPanelVisible, setSimPanelVisible] = useState(false);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ur' : 'en');
  };

  const toggleTheme = () => {
    setHighContrast(prev => !prev);
  };

  return (
    <SafeAreaView style={[styles.safeArea, styles.lightBg]}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.lightBg.backgroundColor} />
      <View style={styles.container}>
        <RootNavigator />
      </View>

      {/* Floating Simulator Action Button */}
      <TouchableOpacity
        style={[styles.floatingButton, isDarkMode ? styles.floatDark : styles.floatLight]}
        onPress={() => setSimPanelVisible(true)}
      >
        <Text style={styles.floatButtonText}>🛠️</Text>
      </TouchableOpacity>

      {/* Simulator Modal controls panel */}
      <Modal visible={simPanelVisible} transparent={true} animationType="slide" onRequestClose={() => setSimPanelVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSimPanelVisible(false)}
        >
          <View style={[styles.modalContent, isDarkMode ? styles.modalContentDark : styles.modalContentLight]}>
            <Text style={[styles.modalTitle, isDarkMode ? styles.textLight : styles.textDark]}>
              Simulator Master Panel
            </Text>

            <View style={styles.sectionDivider} />

            {/* Persona toggles */}
            <Text style={styles.sectionLabel}>Test Personas</Text>
            <View style={styles.personaRow}>
              {(['worshipper', 'admin', 'super_admin'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.personaBtn,
                    activeRole === role ? styles.personaBtnActive : null
                  ]}
                  onPress={() => {
                    handleRoleToggle(role);
                    setSimPanelVisible(false);
                    if (role === 'worshipper') {
                      navigate('Home');
                    } else {
                      navigate('Settings');
                    }
                  }}
                >
                  <Text style={[styles.personaText, activeRole === role ? styles.personaTextActive : null]}>
                    {role === 'worshipper' ? '🕌 User' : role === 'admin' ? '🔑 Admin' : '👑 Super'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionDivider} />

            {/* Language & High Contrast toggles */}
            <Text style={styles.sectionLabel}>Visual Adaptations</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={toggleLanguage}>
                <Text style={styles.controlBtnText}>
                  🌐 {language === 'en' ? 'Urdu (اردو)' : 'English'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={toggleTheme}>
                <Text style={styles.controlBtnText}>
                  🌓 {isDarkMode ? 'Off-White' : 'Slate Mode'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSimPanelVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close Panel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  floatDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
  },
  floatLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
  floatButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalContentDark: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalContentLight: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  textLight: {
    color: '#ffffff',
  },
  textDark: {
    color: '#0f172a',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  personaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  personaBtn: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaBtnActive: {
    backgroundColor: '#10b981',
  },
  personaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  personaTextActive: {
    color: '#ffffff',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  closeBtn: {
    marginTop: 20,
    height: 42,
    backgroundColor: '#334155',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
