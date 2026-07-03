import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native';
import { Text } from '../../components/ui/Text';
import {
  LogOut,
  User,
  Lock,
  MessageSquare,
  ShieldCheck,
  Shield,
  Building2,
  Users
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';
import { SettingTile } from '../../components/ui/SettingTile';
import { useNavigation } from '../../navigation/NavigationContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    language,
    setLanguage,
    translations,
    isRtl,
    triggerToast
  } = useApp();

  // Force light theme colors for clean UI
  const themeColors = colors.light;

  const { navigate } = useNavigation();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const confirmLogout = async () => {
    setLoggingOut(true);
    setTimeout(async () => {
      try {
        await logout();
        triggerToast('Logged out successfully');
        setLogoutModalVisible(false);
      } catch (err: any) {
        triggerToast(err.message || 'Logout failed');
      } finally {
        setLoggingOut(false);
      }
    }, 2000);
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  // Reanimated values for Logout button
  const logoutScale = useSharedValue(1);
  const rLogoutStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoutScale.value }]
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.offWhite, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isRtl && styles.rowReverse]}>
        <Text style={[styles.headerTitle, { color: '#000000' }]}>
          {translations.settings || 'Settings'}
        </Text>

        <View style={[styles.switchContainer, { borderColor: colors.primary }]}>
          <TouchableOpacity
            style={[
              styles.switchTab,
              language === 'en' ? { backgroundColor: colors.primary } : null,
            ]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.switchTabText,
                language === 'en' ? { color: '#ffffff' } : { color: colors.primary },
              ]}
            >
              EN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchTab,
              language === 'ur' ? { backgroundColor: colors.primary } : null,
            ]}
            onPress={() => setLanguage('ur')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.switchTabText,
                language === 'ur' ? { color: '#ffffff' } : { color: colors.primary },
              ]}
            >
              UR
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400).delay(100)}>
          {/* User Information Card */}
          {currentUser ? (
            <View style={[styles.userCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, isRtl && styles.rowReverse]}>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: themeColors.text }, isRtl && typography.alignRtl]}>
                  {currentUser.name || 'User'}
                </Text>
                <Text style={[styles.userEmail, { color: themeColors.textMuted }, isRtl && typography.alignRtl]}>
                  {currentUser.email}
                </Text>
              </View>

              <AnimatedPressable
                onPressIn={() => logoutScale.value = withSpring(0.9)}
                onPressOut={() => logoutScale.value = withSpring(1)}
                onPress={handleLogoutPress}
                style={[styles.logoutBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }, rLogoutStyle]}
              >
                <LogOut size={20} color={colors.danger || '#ef4444'} />
              </AnimatedPressable>
            </View>
          ) : (
            <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }, isRtl && styles.rowReverse]}>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: themeColors.text }, isRtl && typography.alignRtl]}>
                  Guest User
                </Text>
                <Text style={[styles.userEmail, { color: themeColors.textMuted }, isRtl && typography.alignRtl]}>
                  Sign in to access settings
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigate('Auth')}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* General Section */}
        <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textMuted }, isRtl && typography.alignRtl]}>
            General
          </Text>
          <SettingTile
            icon={<User size={20} color={colors.primary} />}
            title="Edit Profile"
            onPress={() => { }}
            isDark={false}
            isRtl={isRtl}
          />
          <SettingTile
            icon={<Lock size={20} color={colors.primary} />}
            title="Change Password"
            onPress={() => { }}
            isDark={false}
            isRtl={isRtl}
          />
          <SettingTile
            icon={<MessageSquare size={20} color={colors.primary} />}
            title="Feedback"
            onPress={() => { }}
            isDark={false}
            isRtl={isRtl}
          />
          <SettingTile
            icon={<ShieldCheck size={20} color={colors.primary} />}
            title="Privacy Policy"
            onPress={() => { }}
            isDark={false}
            isRtl={isRtl}
          />
        </Animated.View>

        {/* Super Admin Section (Conditional) */}
        {currentUser?.role === 'super_admin' && (
          <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textMuted }, isRtl && typography.alignRtl]}>
              Administration
            </Text>
            <SettingTile
              icon={<Shield size={20} color={colors.peach || '#f59e0b'} />}
              title="Super Admin Panel"
              onPress={() => navigate('SuperAdminPanel')}
              isDark={false}
              isRtl={isRtl}
            />
          </Animated.View>
        )}

        {/* Admin Panel Section (Conditional - for admin role) */}
        {currentUser?.role === 'admin' && (
          <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textMuted }, isRtl && typography.alignRtl]}>
              Administration
            </Text>
            <SettingTile
              icon={<Shield size={20} color={colors.primary} />}
              title="Admin Panel"
              onPress={() => navigate('AdminPanel')}
              isDark={false}
              isRtl={isRtl}
            />
          </Animated.View>
        )}

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.versionIcon}
            resizeMode="contain"
          />
          <Text style={[styles.versionText, { color: themeColors.textMuted }]}>
            Masjid Locator
          </Text>
          <Text style={[styles.versionSubtext, { color: themeColors.textMuted }]}>
            Version 1.0.0
          </Text>
        </View>

      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            {loggingOut ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: themeColors.text }]}>
                  Logging out...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Confirm Logout</Text>
                <Text style={[styles.modalBody, { color: themeColors.textMuted }]}>
                  Are you sure you want to log out of your account?
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                    onPress={() => setLogoutModalVisible(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: themeColors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.danger || '#ef4444' }]}
                    onPress={confirmLogout}
                  >
                    <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  switchContainer: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    padding: 2,
    alignItems: 'center',
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchTab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  switchTabText: {
    fontSize: 9,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  versionIcon: {
    width: 60,
    height: 60,
    marginBottom: spacing.sm,
  },
  versionText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  versionSubtext: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});
