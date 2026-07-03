import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useAuth } from '../../hooks/useAuth';

export const SplashScreen = () => {
  // Always use light theme for splash
  const themeColors = colors.light;

  const { navigate } = useNavigation();
  const { user, authLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && !authLoading) {
      if (user) {
        navigate('Home');
      } else {
        navigate('Welcome');
      }
    }
  }, [minTimeElapsed, authLoading, user, navigate]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Invisible Top Section to match WelcomeScreen layout position */}
      <View style={[styles.topSection, { opacity: 0 }]} pointerEvents="none">
        <Text style={styles.welcomeText}>Welcome to</Text>
        <View style={styles.appNameContainer}>
          <Text style={styles.appNameText}>Masjid Locator</Text>
        </View>
      </View>

      {/* Middle Section (Only logo is visible) */}
      <View style={styles.middleSection}>
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
        {/* Invisible description text to match WelcomeScreen layout position */}
        <Text style={[styles.descriptionText, { opacity: 0 }]} pointerEvents="none">
          Find nearby masjids, check prayer times, and connect with your local community with ease.
        </Text>
      </View>

      {/* Invisible Bottom Section to match WelcomeScreen layout position */}
      <View style={[styles.bottomSection, { opacity: 0 }]} pointerEvents="none">
        <View style={styles.button} />
        <View style={styles.button} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    paddingVertical: spacing.huge,
  },
  topSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  welcomeText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  appNameContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  appNameText: {
    fontSize: typography.sizes.huge + 4,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  middleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  illustrationImage: {
    width: 250,
    height: 250,
  },
  descriptionText: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed,
    paddingHorizontal: spacing.md,
  },
  bottomSection: {
    width: '100%',
    marginTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  button: {
    marginBottom: spacing.md,
    width: '100%',
    height: 56,
    borderRadius: spacing.borderRadiusRound,
  },
});
