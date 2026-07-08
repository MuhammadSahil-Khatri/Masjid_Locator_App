import React from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Building2, Users, ShieldCheck, BookOpen, Bell, UserCheck } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AdminOptionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  index: number;
}

const AdminOptionRow: React.FC<AdminOptionProps> = ({ icon, title, subtitle, onPress, index }) => {
  const themeColors = colors.light;
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 60).duration(350)}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      style={[
        styles.tileContainer,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        rStyle,
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: 'rgba(246, 139, 53, 0.1)' }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.tileTitle, { color: themeColors.text }]} weight="bold">
          {title}
        </Text>
        <Text style={[styles.tileSubtitle, { color: themeColors.textMuted }]}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color={themeColors.textMuted} />
    </AnimatedPressable>
  );
};

export const SuperAdminPanel: React.FC = () => {
  const { navigate } = useNavigation();
  const insets = useSafeAreaInsets();
  const themeColors = colors.light;

  const options = [
    {
      key: 'ManageMosques',
      title: 'Manage Mosques',
      subtitle: 'Add, verify, edit, or delete mosque listings',
      icon: <Building2 size={22} color={colors.primary} />,
      route: 'ManageMosques' as const,
    },
    {
      key: 'ManageWorshipers',
      title: 'Manage Worshipers',
      subtitle: 'Audit user accounts, toggle blocks, or remove accounts',
      icon: <Users size={22} color={colors.primary} />,
      route: 'ManageWorshipers' as const,
    },
    {
      key: 'ManageAdmins',
      title: 'Manage Admins',
      subtitle: 'Configure local sub-admins & verify access requests',
      icon: <UserCheck size={22} color={colors.primary} />,
      route: 'ManageAdmins' as const,
    },
    {
      key: 'ManageSuperAdmins',
      title: 'Manage Super Admins',
      subtitle: 'Assign root administrators & security roles',
      icon: <ShieldCheck size={22} color={colors.primary} />,
      route: 'ManageSuperAdmins' as const,
    },
    {
      key: 'ManageHadith',
      title: 'Manage Hadith',
      subtitle: 'Curate, translate, & schedule the Hadith of the day',
      icon: <BookOpen size={22} color={colors.primary} />,
      route: 'ManageHadith' as const,
    },
    {
      key: 'ManageAnnouncements',
      title: 'Manage Announcements',
      subtitle: 'Publish community updates and urgent broadcast alerts',
      icon: <Bell size={22} color={colors.primary} />,
      route: 'ManageAnnouncements' as const,
    },
  ];

  return (
    // <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.offWhite }]} edges={['top']}>
    <Animated.View style={styles.container} entering={FadeIn.duration(400)}>
      <SectionHeader title="Super Admin Panel" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome/Banner Section */}
        <Animated.View entering={FadeInDown.duration(350).delay(50)} style={[styles.bannerCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.bannerTitle, { color: themeColors.text }]} weight="bold">
            Root Administration
          </Text>
          <Text style={[styles.bannerSubtitle, { color: themeColors.textMuted }]}>
            Access system configuration, control data tables, audit moderators, and broadcast messages globally.
          </Text>
        </Animated.View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {options.map((opt, index) => (
            <AdminOptionRow
              key={opt.key}
              icon={opt.icon}
              title={opt.title}
              subtitle={opt.subtitle}
              index={index}
              onPress={() => navigate(opt.route)}
            />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
    // </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  bannerCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1.5,
  },
  bannerTitle: {
    fontSize: typography.sizes.md + 1,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  optionsList: {
    gap: spacing.md,
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  tileTitle: {
    fontSize: typography.sizes.base + 1,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 16,
  },
});
export default SuperAdminPanel;
