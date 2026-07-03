import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, BookOpenText, MapPin, Bell, User, Newspaper, Layers } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from './NavigationContext';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { HadeesScreen } from '../screens/Hadees/HadeesScreen';
import { SearchScreen } from '../screens/Search/SearchScreen';
import { AnnouncementsScreen } from '../screens/Announcements/AnnouncementsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { MosqueDetailsScreen } from '../screens/MosqueDetails/MosqueDetailsScreen';
import { QiblaScreen } from '../screens/Qibla/QiblaScreen';
import { FavoritesScreen } from '../screens/Favorites/FavoritesScreen';

// Super Admin Imports
import { SuperAdminPanel } from '../screens/SuperAdmin/SuperAdminPanel';
import { ManageMosquesScreen } from '../screens/SuperAdmin/ManageMosquesScreen';
import { ManageAdminsScreen } from '../screens/SuperAdmin/ManageAdminsScreen';
import { ManageSuperAdminsScreen } from '../screens/SuperAdmin/ManageSuperAdminsScreen';
import { ManageHadithScreen } from '../screens/SuperAdmin/ManageHadithScreen';
import { ManageAnnouncementsScreen } from '../screens/SuperAdmin/ManageAnnouncementsScreen';
import { ManageWorshipersScreen } from '../screens/SuperAdmin/ManageWorshipersScreen';
import { AdminPanel } from '../screens/SuperAdmin/AdminPanel.tsx';
import { AssignedMosqueScreen } from '../screens/SuperAdmin/AssignedMosqueScreen';

export const MainNavigator: React.FC = () => {
  const { currentScreen, navigate } = useNavigation();
  const { highContrast: isDark, isRtl, translations } = useApp();
  const currentTheme = isDark ? colors.dark : colors.light;

  // Screen Dispatcher routing
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Hadees':
        return <HadeesScreen />;
      case 'Search':
        return <SearchScreen />;
      case 'Announcements':
        return (
          <View style={[styles.container, { backgroundColor: currentTheme.background, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: currentTheme.textMuted, fontSize: typography.sizes.md, fontWeight: 'bold' }}>
              {isRtl ? 'خالی صفحہ' : 'Blank Screen'}
            </Text>
          </View>
        );
      case 'Profile':
        return <ProfileScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'MosqueDetails':
        return <MosqueDetailsScreen />;
      case 'Qibla':
        return <QiblaScreen />;
      case 'Favorites':
        return <FavoritesScreen />;
      case 'SuperAdminPanel':
        return <SuperAdminPanel />;
      case 'ManageMosques':
        return <ManageMosquesScreen />;
      case 'ManageAdmins':
        return <ManageAdminsScreen />;
      case 'ManageSuperAdmins':
        return <ManageSuperAdminsScreen />;
      case 'ManageHadith':
        return <ManageHadithScreen />;
      case 'ManageAnnouncements':
        return <ManageAnnouncementsScreen />;
      case 'ManageWorshipers':
        return <ManageWorshipersScreen />;
      case 'AdminPanel':
        return <AdminPanel />;
      case 'AssignedMosque':
        return <AssignedMosqueScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const navItems = [
    { key: 'Home' as const, label: translations.home || 'Home', icon: Home },
    { key: 'Hadees' as const, label: `${translations.hadeesTab} & ${translations.announcements || 'Updates'}`, icon: Newspaper },
    { key: 'Search' as const, label: translations.masjidsTab || 'Masjids', icon: MapPin },
    { key: 'Announcements' as const, label: isRtl ? 'مزید' : 'More', icon: Layers },
    { key: 'Profile' as const, label: translations.settings || 'Settings', icon: User },
  ];

  const showBottomBar = ![
    'SuperAdminPanel',
    'ManageMosques',
    'ManageAdmins',
    'ManageSuperAdmins',
    'ManageHadith',
    'ManageAnnouncements',
    'ManageWorshipers',
    'AdminPanel',
    'AssignedMosque',
  ].includes(currentScreen);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Screen container */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Nav Bar (at least 44px touch targets) */}
      {showBottomBar && (
        <View style={[
          styles.bottomBar,
          {
            backgroundColor: colors.light.background,
            borderTopColor: colors.light.navBorder
          },
          isRtl && styles.rowReverse
        ]}>
          {navItems.map((item) => {
            const isActive = currentScreen === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabBtn}
                onPress={() => navigate(item.key)}
                activeOpacity={0.8}
              >
                <item.icon
                  size={22}
                  color={isActive ? colors.primary : colors.light.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.light.textMuted }
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomBar: {
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 3,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
export default MainNavigator;
