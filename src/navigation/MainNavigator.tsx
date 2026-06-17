import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, Search, Heart, User, Shield } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from './NavigationContext';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { SearchScreen } from '../screens/Search/SearchScreen';
import { FavoritesScreen } from '../screens/Favorites/FavoritesScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { MosqueDetailsScreen } from '../screens/MosqueDetails/MosqueDetailsScreen';

export const MainNavigator: React.FC = () => {
  const { currentScreen, navigate } = useNavigation();
  const { highContrast: isDark, isRtl, translations } = useApp();
  const currentTheme = isDark ? colors.dark : colors.light;

  // Screen Dispatcher routing
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Search':
        return <SearchScreen />;
      case 'Favorites':
        return <FavoritesScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'MosqueDetails':
        return <MosqueDetailsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const navItems = [
    { key: 'Home' as const, label: translations.dailyHadees, icon: Home },
    { key: 'Search' as const, label: translations.findNearbyMasjid, icon: Search },
    { key: 'Favorites' as const, label: 'Saved', icon: Heart },
    { key: 'Profile' as const, label: translations.settings, icon: User },
    { key: 'Settings' as const, label: 'Admin', icon: Shield },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Screen container */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Nav Bar (at least 44px touch targets) */}
      <View style={[
        styles.bottomBar, 
        { 
          backgroundColor: currentTheme.navBg, 
          borderTopColor: currentTheme.navBorder 
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
                size={18} 
                color={isActive ? colors.primary : currentTheme.textMuted} 
                fill={isActive && item.key === 'Favorites' ? colors.primary : 'transparent'}
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { color: isActive ? colors.primary : currentTheme.textMuted }
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
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
