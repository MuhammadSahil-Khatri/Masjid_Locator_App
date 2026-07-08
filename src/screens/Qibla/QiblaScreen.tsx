import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useQibla } from '../../hooks/useQibla';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.95;

const getShortestAngle = (from: number, to: number) => {
  let diff = to - from;
  diff = ((diff + 180) % 360 + 360) % 360 - 180;
  return diff;
};

export const QiblaScreen: React.FC = () => {
  const {
    qiblaBearing,
    compassHeading,
    city,
    loading,
    error,
    refetch,
  } = useQibla();

  const theme = colors.light;

  const compassAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;

  const lastCompassHeading = useRef(0);
  const accumulatedCompassRotation = useRef(0);

  const lastNeedleHeading = useRef(0);
  const accumulatedNeedleRotation = useRef(0);

  useEffect(() => {
    const diff = getShortestAngle(lastCompassHeading.current, compassHeading);
    accumulatedCompassRotation.current -= diff;
    lastCompassHeading.current = compassHeading;

    Animated.spring(compassAnim, {
      toValue: accumulatedCompassRotation.current,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [compassHeading]);

  useEffect(() => {
    const targetNeedle = (qiblaBearing ?? 0) - compassHeading;
    const diff = getShortestAngle(lastNeedleHeading.current, targetNeedle);
    accumulatedNeedleRotation.current += diff;
    lastNeedleHeading.current = targetNeedle;

    Animated.spring(needleAnim, {
      toValue: accumulatedNeedleRotation.current,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [qiblaBearing, compassHeading]);

  const dialRotationStr = compassAnim.interpolate({
    inputRange: [-72000, 72000],
    outputRange: ['-72000deg', '72000deg'],
  });

  const needleRotationStr = needleAnim.interpolate({
    inputRange: [-72000, 72000],
    outputRange: ['-72000deg', '72000deg'],
  });

  // ── Loading State (Only if no cache exists and still loading) ──────────────
  if (loading && qiblaBearing === null) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, { color: theme.textMuted }]}>
          Calculating Qibla direction…
        </Text>
      </View>
    );
  }

  // ── Error State (Only if no cache exists and error occurred) ──────────────
  if (error && qiblaBearing === null) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <AlertTriangle size={48} color={colors.warning} style={{ marginBottom: spacing.md }} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          Unable to find Qibla
        </Text>
        <Text style={[styles.errorText, { color: theme.textMuted }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={refetch}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main Screen ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Qibla Direction</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Direction towards the Holy Kaaba{city ? ` • ${city}` : ''}
        </Text>
      </View>

      {/* Compass Container */}
      <View style={styles.compassWrapper}>
        {/* Rotating Compass Dial */}
        <Animated.Image
          source={require('../../../assets/compass.webp')}
          style={[
            styles.compassImage,
            {
              transform: [{ rotate: dialRotationStr }],
            },
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />


      </View>

      {/* Bearing Display */}
      <View style={styles.bearingContainer}>
        <Text style={[styles.bearingValue, { color: colors.primary }]}>
          {qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '0°'}
        </Text>
        <Text style={[styles.bearingLabel, { color: theme.textMuted }]}>
          Qibla Bearing
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl * 1.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: spacing.xl,
  },
  compassImage: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: 'absolute',
  },

  bearingContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bearingValue: {
    fontSize: typography.sizes.xxl * 1.2,
    fontWeight: typography.weights.bold,
  },
  bearingLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  statusText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.borderRadiusRound,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});
