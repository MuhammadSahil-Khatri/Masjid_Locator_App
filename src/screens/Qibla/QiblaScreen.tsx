import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StatusBar,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../components/ui/Text';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useQibla } from '../../hooks/useQibla';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';

// ── Back-arrow SVG matching app standard ──────────────────────────────────────
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

export const QiblaScreen: React.FC = () => {
  const { language, isRtl } = useApp();
  const {
    qiblaBearing,
    city,
    loading,
    error,
    refetch,
    animatedCompassRotation,
    animatedQiblaRotation,
    calibrationNeeded,
    calibrationMessage,
    isAligned,
  } = useQibla(language);
  const [retrying, setRetrying] = useState(false);
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();

  const handleTryAgain = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus, canAskAgain } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          if (!canAskAgain && Platform.OS !== 'web') {
            Alert.alert(
              isRtl ? 'لوکیشن کی اجازت درکار ہے' : 'Location Permission Required',
              isRtl
                ? 'قبلہ کی درست سمت معلوم کرنے کے لیے لوکیشن کی اجازت درکار ہے۔ براہ کرم سیٹنگز میں جا کر اجازت دیں۔'
                : 'Location permission is required to determine the Qibla direction. Please enable it in device settings.',
              [
                { text: isRtl ? 'منسوخ کریں' : 'Cancel', style: 'cancel' },
                {
                  text: isRtl ? 'سیٹنگز کھولیں' : 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
          return;
        }
      }
      await refetch();
    } catch (err) {
      console.warn('Error requesting location permission:', err);
    } finally {
      setRetrying(false);
    }
  };

  // ── Reanimated Animated Styles for 60/120fps UI Thread Animation ─────────────
  const compassAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animatedCompassRotation.value}deg` }],
    };
  });

  const qiblaIndicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animatedQiblaRotation.value}deg` }],
    };
  });

  // ── Haptic Feedback when Aligned with Qibla (±3°) ───────────────────────────
  const hasTriggeredHaptic = useRef(false);
  useEffect(() => {
    if (isAligned && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch { }
    } else if (!isAligned) {
      hasTriggeredHaptic.current = false;
    }
  }, [isAligned]);

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
          <TouchableOpacity
            style={[styles.retryButton, retrying && { opacity: 0.8 }]}
            onPress={handleTryAgain}
            disabled={retrying}
            activeOpacity={0.8}
          >
            {retrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <RefreshCw size={16} color="#fff" />
            )}
            <Text style={styles.retryButtonText}>
              {isRtl ? 'دوبارہ کوشش کریں' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  const bearing = qiblaBearing !== null ? Math.round(qiblaBearing) : 0;

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

      {/* Calibration / Warning Notice */}
      {calibrationNeeded && calibrationMessage && (
        <View style={styles.calibrationBanner}>
          <AlertTriangle size={15} color="#FBBF24" />
          <Text style={styles.calibrationText}>{calibrationMessage}</Text>
        </View>
      )}

      {/* Compass with Reanimated Dial & Qibla Indicator */}
      <View style={styles.compassWrapper}>
        {/* Rotating Compass Rose Dial */}
        <Animated.Image
          source={require('../../../assets/compass.png')}
          style={[styles.compassImage, compassAnimatedStyle]}
          resizeMode="contain"
          fadeDuration={0}
        />

        {/* Rotating Qibla Indicator (Shortest-path tracked via Reanimated) */}
        <Animated.View
          style={[styles.qiblaIndicatorContainer, qiblaIndicatorAnimatedStyle]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.qiblaBadge,
              isAligned ? styles.qiblaBadgeAligned : styles.qiblaBadgeNormal,
            ]}
          >
            <Text style={styles.kaabaBadgeIcon}>🕋</Text>
          </View>
        </Animated.View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <ImageBackground
          source={require('../../../assets/background_double_sided.png')}
          style={styles.backgroundImage}
          resizeMode="stretch"
        >
          {isAligned ? (
            <View style={styles.alignedStatusRow}>
              <CheckCircle2 size={18} color="#10B981" />
              <Text style={styles.alignedStatusText}>
                {isRtl ? 'آپ قبلہ کی درست سمت میں ہیں' : 'Aligned with Holy Kaaba'}
              </Text>
            </View>
          ) : (
            <Text style={styles.infoHint}>
              {isRtl ? 'اپنا فون قبلہ کی طرف گھمائیں' : 'Rotate phone towards Qibla'}
            </Text>
          )}

          <Text style={styles.bearingValue}>{bearing}°</Text>

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

  // ── Calibration Banner ──────────────────────────────────────────────────────
  calibrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  calibrationText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Compass ─────────────────────────────────────────────────────────────────
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassImage: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
  },
  qiblaIndicatorContainer: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  qiblaBadge: {
    marginTop: -14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  qiblaBadgeNormal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4AF37', // Refined gold
  },
  qiblaBadgeAligned: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981', // Emerald green
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  kaabaBadgeIcon: {
    fontSize: 18,
    lineHeight: 22,
  },

  // ── Info Card ────────────────────────────────────────────────────────────────
  infoCard: {
    width: '100%',
    height: 200,
    borderTopRightRadius: 36,
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  backgroundImage: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 36,
    width: '100%',
    height: '100%',
  },
  alignedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alignedStatusText: {
    color: '#34D399',
    fontSize: typography.sizes.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoHint: {
    color: 'rgba(255,255,255,0.85)',
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
    marginBottom: 2,
    marginTop: spacing.xs,
  },
  cityText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});
