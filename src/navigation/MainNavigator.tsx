import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../components/ui/Text';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import { useNavigation } from './NavigationContext';
import { useSystemBars, getScreenBgColor } from '../hooks/useSystemBars';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { AnnouncementsScreen } from '../screens/Announcements/AnnouncementsScreen';
import { CategoryAnnouncementsScreen } from '../screens/Announcements/CategoryAnnouncementsScreen';
import { SearchScreen } from '../screens/Search/SearchScreen';
import { NearestMosquesScreen } from '../screens/Masjids/NearestMosquesScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { ChangePasswordScreen } from '../screens/Settings/ChangePasswordScreen';
import { EditProfileScreen } from '../screens/Settings/EditProfileScreen';
import { PrayerTimesScreen } from '../screens/PrayerTimes/PrayerTimesScreen';
import { QiblaScreen } from '../screens/Qibla/QiblaScreen';
import { storageService } from '../services/storageService';
import { HadeesScreen } from '../screens/Hadees/HadeesScreen';

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
import { LinearGradient } from 'expo-linear-gradient';
import { HomeIcon, AnnouncementIcon, MapIcon, MasjidIcon, ProfileIcon } from './NavbarIcons';

export const MainNavigator: React.FC = () => {
  const { currentScreen, navigate } = useNavigation();
  const { highContrast: isDark, isRtl, translations } = useApp();
  const currentTheme = colors.light;

  // Synchronize status bar and Android navigation bar with the active screen background
  const activeBgColor = getScreenBgColor(currentScreen, isDark);
  useSystemBars(activeBgColor);

  // Hydrate storageService at app start
  React.useEffect(() => {
    storageService.hydrate();
  }, []);

  // Screen Dispatcher routing
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Hadees':
        return <HadeesScreen />;
      case 'Announcement':
      case 'Announcements':
        return <AnnouncementsScreen />;
      case 'CategoryAnnouncements':
        return <CategoryAnnouncementsScreen />;
      case 'Search':
        return <SearchScreen />;
      case 'Masjids':
        return <NearestMosquesScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'PrayerTimes':
        return <PrayerTimesScreen />;
      case 'Qibla':
        return <QiblaScreen />;
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
      case 'ChangePassword':
        return <ChangePasswordScreen />;
      case 'EditProfile':
        return <EditProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const navItems = [
    {
      key: 'Home' as const,
      label: isRtl ? 'ہوم' : 'Home',
      Icon: HomeIcon,
      iconSize: 20,
    },
    {
      key: 'Announcement' as const,
      label: isRtl ? 'اعلانات' : 'Announcement',
      Icon: AnnouncementIcon,
      iconSize: 22,
    },
    {
      key: 'Search' as const,
      label: isRtl ? 'نقشہ' : 'Map',
      Icon: MapIcon,
      iconSize: 20,
    },
    {
      key: 'Masjids' as const,
      label: isRtl ? 'مساجد' : 'Masjid',
      Icon: MasjidIcon,
      iconSize: 20,
    },
    {
      key: 'Settings' as const,
      label: isRtl ? 'ترتیبات' : 'Setting',
      Icon: ProfileIcon,
      iconSize: 20,
    },
  ];

  const showBottomBar = true;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Screen container */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Nav Bar */}
      {showBottomBar && (
        <View style={[
          styles.bottomBar,
          {
            backgroundColor: currentTheme.navBg,
            borderTopColor: '#0081A0',
          },
        ]}>
          {navItems.map((item) => {
            const isActive =
              currentScreen === item.key ||
              (item.key === 'Announcement' && currentScreen === 'CategoryAnnouncements') ||
              (item.key === 'Settings' && [
                'SuperAdminPanel',
                'AdminPanel',
                'ManageMosques',
                'ManageAdmins',
                'ManageSuperAdmins',
                'ManageHadith',
                'ManageAnnouncements',
                'ManageWorshipers',
                'AssignedMosque',
                'ChangePassword',
                'EditProfile',
              ].includes(currentScreen));
            const iconColor = isActive ? '#FFFFFF' : '#1D3B6D';

            if (isActive) {
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.tabBtnActive}
                  onPress={() => navigate(item.key)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={colors.gradients.cyan as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeGradient}
                  >
                    <item.Icon size={item.iconSize} color={iconColor} isActive={true} />
                    <Text style={styles.tabLabelActive} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabBtn}
                onPress={() => navigate(item.key)}
                activeOpacity={0.7}
              >
                <item.Icon size={item.iconSize} color={iconColor} isActive={false} />
                <Text style={[styles.tabLabel, { color: '#1D3B6D' }]} numberOfLines={1}>
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
    overflow: 'hidden',
  },
  bottomBar: {
    height: 74,
    borderTopWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    elevation: 12,
    shadowColor: '#0081A0',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabBtnActive: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    minWidth: 68,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
export default MainNavigator;
