import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, ImageBackground, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Building2,
  Users,
  ShieldCheck,
  BookOpen,
  Bell,
  UserCheck,
} from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '../../navigation/NavigationContext';
import { spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AdminOptionProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  index: number;
}

const AdminOptionRow: React.FC<AdminOptionProps> = ({ icon, iconBg, title, subtitle, onPress, index }) => {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[styles.tileContainer, rStyle]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.tileTitle} weight="bold">
            {title}
          </Text>
          <Text style={styles.tileSubtitle}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.chevronWrapper}>
          <ChevronRight size={18} color="#1D3B6D" />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

export const SuperAdminPanel: React.FC = () => {
  const { navigate } = useNavigation();
  const insets = useSafeAreaInsets();

  const options = [
    {
      key: 'ManageMosques',
      title: 'Manage Mosques',
      subtitle: 'Add, verify, edit, or delete mosque listings',
      icon: <Building2 size={22} color="#F68B35" />,
      iconBg: 'rgba(246, 139, 53, 0.12)',
      route: 'ManageMosques' as const,
    },
    {
      key: 'ManageWorshipers',
      title: 'Manage Worshipers',
      subtitle: 'Audit user accounts, toggle blocks, or remove accounts',
      icon: <Users size={22} color="#2E75B6" />,
      iconBg: 'rgba(46, 117, 182, 0.12)',
      route: 'ManageWorshipers' as const,
    },
    {
      key: 'ManageAdmins',
      title: 'Manage Admins',
      subtitle: 'Configure local mosque admins & verify requests',
      icon: <UserCheck size={22} color="#CB9E67" />,
      iconBg: 'rgba(203, 158, 103, 0.15)',
      route: 'ManageAdmins' as const,
    },
    {
      key: 'ManageSuperAdmins',
      title: 'Manage Super Admins',
      subtitle: 'Assign root administrators & security roles',
      icon: <ShieldCheck size={22} color="#DC2626" />,
      iconBg: 'rgba(220, 38, 38, 0.12)',
      route: 'ManageSuperAdmins' as const,
    },
    {
      key: 'ManageHadith',
      title: 'Manage Hadith',
      subtitle: 'Curate, translate, & schedule the Hadith of the day',
      icon: <BookOpen size={22} color="#10B981" />,
      iconBg: 'rgba(16, 185, 129, 0.12)',
      route: 'ManageHadith' as const,
    },
    {
      key: 'ManageAnnouncements',
      title: 'Manage Announcements',
      subtitle: 'Publish community updates and broadcast alerts',
      icon: <Bell size={22} color="#9333EA" />,
      iconBg: 'rgba(147, 51, 234, 0.12)',
      route: 'ManageAnnouncements' as const,
    },
  ];

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <Animated.View style={styles.container} entering={FadeIn.duration(350)}>
        <SectionHeader title="Super Admin Panel" />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 85 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Options List */}
          <View style={styles.optionsList}>
            {options.map((opt, index) => (
              <AdminOptionRow
                key={opt.key}
                icon={opt.icon}
                iconBg={opt.iconBg}
                title={opt.title}
                subtitle={opt.subtitle}
                index={index}
                onPress={() => navigate(opt.route)}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  optionsList: {
    gap: 12,
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(29, 59, 109, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
    }),
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    fontSize: typography.sizes.base,
    color: '#1D3B6D',
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 59, 109, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminPanel;

