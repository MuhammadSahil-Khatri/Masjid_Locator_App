import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, ImageBackground, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Building2, BookOpen, Bell, Shield, Sparkles } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { mosqueService } from '../../services/mosqueService';

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

export const AdminPanel: React.FC = () => {
  const { navigate } = useNavigation();
  const insets = useSafeAreaInsets();
  const [hasMosque, setHasMosque] = useState<boolean | null>(null);

  useEffect(() => {
    mosqueService.fetchAdminMosque().then((mosque) => {
      setHasMosque(!!mosque);
    }).catch(() => {
      setHasMosque(false);
    });
  }, []);

  const options = [
    {
      key: 'AssignedMosque',
      title: 'Assigned Mosque',
      subtitle: 'View and manage your assigned mosque details',
      icon: <Building2 size={22} color="#F68B35" />,
      iconBg: 'rgba(246, 139, 53, 0.12)',
      route: 'AssignedMosque' as const,
      visible: hasMosque === true,
    },
    {
      key: 'ManageHadith',
      title: 'Manage Hadith',
      subtitle: 'Curate, translate, & manage daily hadith entries',
      icon: <BookOpen size={22} color="#10B981" />,
      iconBg: 'rgba(16, 185, 129, 0.12)',
      route: 'ManageHadith' as const,
      visible: true,
    },
    {
      key: 'ManageAnnouncements',
      title: 'Manage Announcements',
      subtitle: 'Publish community updates and broadcast alerts',
      icon: <Bell size={22} color="#9333EA" />,
      iconBg: 'rgba(147, 51, 234, 0.12)',
      route: 'ManageAnnouncements' as const,
      visible: true,
    },
  ];

  const visibleOptions = options.filter((o) => o.visible);

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <Animated.View style={styles.container} entering={FadeIn.duration(350)}>
        <SectionHeader title="Admin Panel" />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 85 }]}
          showsVerticalScrollIndicator={false}
        >

          {hasMosque === null ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.optionsList}>
              {visibleOptions.map((opt, index) => (
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
          )}
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(203, 158, 103, 0.25)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(203, 158, 103, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#CB9E67',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: typography.sizes.lg,
    color: '#1D3B6D',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: typography.sizes.sm,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
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

export default AdminPanel;
