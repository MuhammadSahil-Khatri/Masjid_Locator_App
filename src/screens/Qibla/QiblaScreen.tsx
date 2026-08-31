import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useUserLocation } from '../../hooks/useUserLocation';
import { Text } from '../../components/ui/Text';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useQibla } from '../../hooks/useQibla';
import { useNavigation } from '../../navigation/NavigationContext';

// ── Same back-arrow SVG as PrayerTimesScreen ──────────────────────────────────
const BackArrowIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#1D3B6D',
  size = 14,
}) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.78;

const getShortestAngle = (from: number, to: number) => {
  let diff = to - from;
  diff = ((diff + 180) % 360 + 360) % 360 - 180;
  return diff;
};

// Compute great-circle distance in km between two lat/lng points
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';

export const QiblaScreen: React.FC = () => {
  const { language, isRtl } = useApp();
  const {
    qiblaBearing,
    compassHeading,
    city,
    loading,
    error,
    refetch,
  } = useQibla(language);

  const { location } = useUserLocation();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();

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

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading && qiblaBearing === null) {
    return (
      <ImageBackground
        source={require('../../../assets/background_image_vertical.png')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {isRtl ? 'قبلہ کا رخ معلوم کیا جا رہا ہے...' : 'Calculating Qibla direction…'}
          </Text>
        </View>
      </ImageBackground>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error && qiblaBearing === null) {
    return (
      <ImageBackground
        source={require('../../../assets/background_image_vertical.png')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.centerContainer}>
          <AlertTriangle size={48} color={colors.warning} style={{ marginBottom: spacing.md }} />
          <Text style={styles.errorTitle}>
            {isRtl ? 'قبلہ کا رخ نہیں مل سکا' : 'Unable to find Qibla'}
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.retryButtonText}>
              {isRtl ? 'دوبارہ کوشش کریں' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  const effectiveLocation = location || storageService.getCachedLocation();
  const bearing = qiblaBearing !== null ? Math.round(qiblaBearing) : 0;
  const distanceKm = effectiveLocation
    ? getDistanceKm(effectiveLocation.lat, effectiveLocation.lng, KAABA_LAT, KAABA_LON)
    : 3800; // sensible fallback distance

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header — pill style matching PrayerTimesScreen */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        <View style={[styles.pillContainer]}>
          <TouchableOpacity
            style={styles.pillActionBtn}
            activeOpacity={0.7}
            onPress={goBack}
            accessibilityLabel="Go Back"
          >
            <BackArrowIcon size={14} color="#1D3B6D" />
          </TouchableOpacity>
          <Text style={styles.pillTitle}>
            {isRtl ? 'قبلہ کا رخ' : 'Qibla Direction'}
          </Text>
          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      {/* Compass */}
      <View style={styles.compassWrapper}>
        <Animated.Image
          source={require('../../../assets/compass.png')}
          style={[
            styles.compassImage,
            { transform: [{ rotate: dialRotationStr }] },
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <ImageBackground source={require('../../../assets/background_double_sided.png')} style={styles.backgroundImage} resizeMode="stretch">
          <Text style={styles.infoHint}>
            {isRtl ? 'اپنا فون گھمائیں' : 'Rotate your phone on'}
          </Text>
          <Text style={styles.bearingValue}>{bearing}°</Text>
          {/* {isRtl ? (
            <Text style={styles.distanceText}>
              سے قبلہ تک کا فاصلہ {city}
              <Text style={styles.distanceBold}>{distanceKm.toLocaleString()} کلومیٹر</Text>
            </Text>
          ) : (
            <Text style={styles.distanceText}>
              There are{' '}
              <Text style={styles.distanceBold}>{distanceKm.toLocaleString()} km</Text>
              {' '}from {city} to Qibla
            </Text>
          )} */}
        </ImageBackground>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: '#fff',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#fff',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    color: 'rgba(255,255,255,0.75)',
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
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },

  // ── Header — pill style (mirrors PrayerTimesScreen) ─────────────────────────
  headerWrapper: {
    width: '100%',
    paddingBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 50,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  pillActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActionPlaceholder: {
    width: 32,
    height: 32,
  },
  pillTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Compass ─────────────────────────────────────────────────────────────────
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassImage: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
  },

  // ── Info Card ────────────────────────────────────────────────────────────────
  infoCard: {
    width: '100%',
    height: 200,
    borderTopRightRadius: 36,
    // paddingVertical: spacing.xl * 1.2,
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  backgroundImage: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 36,
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
    width: '100%',
    height: '100%',
    // zIndex: -1,
    // borderRadius: 36,
  },
  infoHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  bearingValue: {
    color: colors.white,
    fontSize: typography.sizes.xxl * 1.6,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.xxl * 1.8,
    textAlign: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    // marginTop: 6,
  },
  distanceBold: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
