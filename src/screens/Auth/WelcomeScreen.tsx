import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { useNavigation } from '../../navigation/NavigationContext';

export const WelcomeScreen = () => {
  // Always use light theme
  const themeColors = colors.light;
  const { navigate } = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={[styles.welcomeText, { color: themeColors.text }]}>
          Welcome to
        </Text>
        <View style={styles.appNameContainer}>
          <Text style={styles.appNameText}>
            Masjid Locator
          </Text>
        </View>
      </View>

      {/* Middle Section */}
      <View style={styles.middleSection}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.descriptionText, { color: themeColors.textMuted }]}>
          Find nearby masjids, check prayer times, and connect with your local community with ease.
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Button
          title="Login"
          onPress={() => {
            navigate('Auth', { isSignUp: false });
          }}
          style={styles.button}
          textStyle={styles.buttonText}
          variant="primary"
        />
        <Button
          title="Sign Up"
          onPress={() => {
            navigate('Auth', { isSignUp: true });
          }}
          style={styles.button}
          textStyle={styles.buttonText}
          variant="outline"
        />
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
  buttonText: {
    fontSize: typography.sizes.lg,
  },
});
