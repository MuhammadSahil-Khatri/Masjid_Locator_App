import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../components/ui/Text';
import { colors, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { useUserLocation } from '../../hooks/useUserLocation';
import { fetchPrayerTimes, PrayerTimesResult } from '../../services/prayerTimesService';
import {
  FajrIcon,
  ShuruqIcon,
  DhuhrIcon,
  AsrIcon,
  MaghribIcon,
  IshaIcon,
} from '../../components/icons/PrayerIcons';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const BackArrowIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#1D3B6D',
  size = 14,
}) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DateNavArrow: React.FC<{ color?: string; size?: number; isNext?: boolean }> = ({
  color = '#FFFFFF',
  size = 10,
  isNext = false,
}) => (
  <Svg
    width={size}
    height={size * (21 / 13)}
    viewBox="0 0 13 21"
    fill="none"
    style={isNext ? undefined : { transform: [{ rotate: '180deg' }] }}
  >
    <Path d="M1 20L12 10.5L1 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Prayer Item Definitions ──────────────────────────────────────────────────
interface PrayerItemConfig {
  key: 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  label: string;
  labelUr: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  defaultPeriod: 'AM' | 'PM';
}

const PRAYERS_CONFIG: PrayerItemConfig[] = [
  { key: 'Fajr', label: 'Fajr', labelUr: 'فجر', Icon: FajrIcon, defaultPeriod: 'AM' },
  { key: 'Sunrise', label: 'Shuruk', labelUr: 'شروق', Icon: ShuruqIcon, defaultPeriod: 'AM' },
  { key: 'Dhuhr', label: 'Dhuhr', labelUr: 'ظہر', Icon: DhuhrIcon, defaultPeriod: 'PM' },
  { key: 'Asr', label: 'Asr', labelUr: 'عصر', Icon: AsrIcon, defaultPeriod: 'PM' },
  { key: 'Maghrib', label: 'Maghrib', labelUr: 'مغرب', Icon: MaghribIcon, defaultPeriod: 'PM' },
  { key: 'Isha', label: 'Isha', labelUr: 'عشاء', Icon: IshaIcon, defaultPeriod: 'PM' },
];

const MIN_DAY_OFFSET = -7;
const MAX_DAY_OFFSET = 7;

export const PrayerTimesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();
  const { language, isRtl } = useApp();
  const { location } = useUserLocation();

  const {
    timings: todayTimings,
    hijriDate: todayHijriDate,
    gregorianDate: todayGregorianDate,
    city,
    upcoming,
  } = usePrayerTimes(language);

  // ── Date offset for day navigation (-7 to +7) ──
  const [dayOffset, setDayOffset] = useState(0);
  const [offsetCache, setOffsetCache] = useState<Record<number, PrayerTimesResult>>({});
  const [loadingOffset, setLoadingOffset] = useState(false);

  // Save today's data into offsetCache[0] once loaded
  useEffect(() => {
    if (todayTimings && todayHijriDate && todayGregorianDate) {
      setOffsetCache((prev) => {
        if (prev[0]) return prev;
        return {
          ...prev,
          0: {
            timings: todayTimings,
            hijriDate: todayHijriDate,
            gregorianDate: todayGregorianDate,
            city: city || '',
          },
        };
      });
    }
  }, [todayTimings, todayHijriDate, todayGregorianDate, city]);

  // Fetch selected day when changed (if not in cache)
  useEffect(() => {
    if (dayOffset === 0) return;
    if (offsetCache[dayOffset]) return;

    if (location) {
      setLoadingOffset(true);
      const target = new Date();
      target.setDate(target.getDate() + dayOffset);

      fetchPrayerTimes(
        location.lat,
        location.lng,
        1,
        language,
        target,
        city || undefined
      )
        .then((res) => {
          setOffsetCache((prev) => ({ ...prev, [dayOffset]: res }));
        })
        .catch((err) => {
          console.warn(`[PrayerTimesScreen] Error loading dayOffset ${dayOffset}:`, err);
        })
        .finally(() => {
          setLoadingOffset(false);
        });
    }
  }, [dayOffset, location, language, city, offsetCache]);

  // Background prefetch all -7 to +7 days once location is known
  const prefetchStartedRef = useRef(false);
  useEffect(() => {
    if (location && !prefetchStartedRef.current) {
      prefetchStartedRef.current = true;
      const offsets = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
      (async () => {
        for (const off of offsets) {
          const target = new Date();
          target.setDate(target.getDate() + off);
          try {
            const res = await fetchPrayerTimes(
              location.lat,
              location.lng,
              1,
              language,
              target,
              city || undefined
            );
            setOffsetCache((prev) => ({ ...prev, [off]: res }));
          } catch {
            // ignore prefetch errors
          }
        }
      })();
    }
  }, [location, language, city]);

  const handlePrevDay = useCallback(() => {
    setDayOffset((prev) => Math.max(prev - 1, MIN_DAY_OFFSET));
  }, []);

  const handleNextDay = useCallback(() => {
    setDayOffset((prev) => Math.min(prev + 1, MAX_DAY_OFFSET));
  }, []);

  const currentResult: PrayerTimesResult | null = useMemo(() => {
    if (dayOffset === 0) {
      if (offsetCache[0]) return offsetCache[0];
      if (todayTimings) {
        return {
          timings: todayTimings,
          hijriDate: todayHijriDate,
          gregorianDate: todayGregorianDate,
          city: city || '',
        };
      }
      return null;
    }
    return offsetCache[dayOffset] || null;
  }, [dayOffset, offsetCache, todayTimings, todayHijriDate, todayGregorianDate, city]);

  // ── Formatted Gregorian Date ──
  const displayGregorian = useMemo(() => {
    if (currentResult?.gregorianDate) {
      return currentResult.gregorianDate;
    }
    const target = new Date();
    if (dayOffset !== 0) {
      target.setDate(target.getDate() + dayOffset);
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${dayNames[target.getDay()]}, ${target.getDate()} ${monthNames[target.getMonth()]} ${target.getFullYear()}`;
  }, [currentResult, dayOffset]);

  // ── Formatted Hijri Date ──
  const displayHijri = useMemo(() => {
    if (currentResult?.hijriDate) {
      return currentResult.hijriDate.replace(' AH', '').trim();
    }
    if (dayOffset === 0 && todayHijriDate) {
      return todayHijriDate.replace(' AH', '').trim();
    }
    return '';
  }, [currentResult, dayOffset, todayHijriDate]);

  // ── Parse & format prayer time string into { time, period } ──
  const formatTimeParts = (timeStr?: string, defaultPeriod: 'AM' | 'PM' = 'AM') => {
    if (!timeStr) {
      return { time: '--:--', period: defaultPeriod };
    }
    const cleanStr = timeStr.trim();
    const parts = cleanStr.split(' ');
    const timePortion = parts[0];
    const explicitPeriod = parts[1]?.toUpperCase() as 'AM' | 'PM' | undefined;

    const [hStr, mStr] = timePortion.split(':');
    let hNum = parseInt(hStr, 10);
    const m = mStr || '00';

    if (isNaN(hNum)) {
      return { time: '--:--', period: defaultPeriod };
    }

    if (explicitPeriod) {
      return { time: `${hNum}:${m}`, period: explicitPeriod };
    }

    // 24-hour format conversion
    const calculatedPeriod: 'AM' | 'PM' = hNum >= 12 ? 'PM' : 'AM';
    hNum = hNum % 12 || 12;
    return { time: `${hNum}:${m}`, period: calculatedPeriod };
  };

  const isPrevDisabled = dayOffset <= MIN_DAY_OFFSET;
  const isNextDisabled = dayOffset >= MAX_DAY_OFFSET;

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.container}
      imageStyle={styles.backgroundImageStyle}
      resizeMode="stretch"
    >
      {/* ── Top Header Section with Floating Pill ── */}
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
            {isRtl ? 'نماز کے اوقات' : 'Prayer Times'}
          </Text>

          {/* Balance layout */}
          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      {/* ── Date Navigator Section (Islamic Arch Area) ── */}
      <View style={[styles.dateNavigatorRow, isRtl && styles.rowReverse]}>
        <TouchableOpacity
          onPress={isRtl ? handleNextDay : handlePrevDay}
          style={[styles.dateArrowBtn, (isRtl ? isNextDisabled : isPrevDisabled) && styles.dateArrowBtnDisabled]}
          activeOpacity={0.7}
          disabled={isRtl ? isNextDisabled : isPrevDisabled}
          accessibilityLabel="Previous Day"
        >
          <DateNavArrow size={10} color="#FFFFFF" isNext={isRtl} />
        </TouchableOpacity>

        <View style={styles.dateTextWrapper}>
          <Text style={styles.gregorianDateText} numberOfLines={1}>
            {displayGregorian}
          </Text>
          {displayHijri ? (
            <Text style={styles.hijriDateText} numberOfLines={1}>
              {displayHijri}
            </Text>
          ) : (
            <Text style={styles.hijriDateText} numberOfLines={1}>
              {' '}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={isRtl ? handlePrevDay : handleNextDay}
          style={[styles.dateArrowBtn, (isRtl ? isPrevDisabled : isNextDisabled) && styles.dateArrowBtnDisabled]}
          activeOpacity={0.7}
          disabled={isRtl ? isPrevDisabled : isNextDisabled}
          accessibilityLabel="Next Day"
        >
          <DateNavArrow size={10} color="#FFFFFF" isNext={!isRtl} />
        </TouchableOpacity>
      </View>

      {/* ── Main White Container with Prayer Cards ── */}
      <View style={styles.mainCardContainer}>
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {PRAYERS_CONFIG.map((prayer) => {
            const rawTime = currentResult?.timings ? (currentResult.timings as any)[prayer.key] : undefined;
            const { time, period } = formatTimeParts(rawTime, prayer.defaultPeriod);
            const isHighlighted =
              dayOffset === 0 &&
              (upcoming?.name === prayer.key || (!upcoming && prayer.key === 'Fajr'));

            return (
              <View
                key={prayer.key}
                style={[
                  styles.prayerCard,
                  isHighlighted ? styles.prayerCardHighlighted : styles.prayerCardNormal,
                  isRtl && styles.rowReverse,
                ]}
              >
                {/* Icon */}
                <View style={[styles.iconContainer, isRtl && { marginRight: 0, marginLeft: 14 }]}>
                  <prayer.Icon size={32} color="#1D3B6D" />
                </View>

                {/* Prayer Name */}
                <Text style={[styles.prayerNameText, isRtl && { textAlign: 'right' }]}>
                  {isRtl ? prayer.labelUr : prayer.label}
                </Text>

                {/* Prayer Time + AM/PM */}
                <View style={[styles.timeContainer]}>
                  {loadingOffset && !rawTime ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Text style={styles.timeNumberText}>
                        {time}{' '}
                      </Text>
                      <Text style={styles.timePeriodText}>
                        {period}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
  },
  headerWrapper: {
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

  /* ── Date Navigator ── */
  dateNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  dateArrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowBtnDisabled: {
    opacity: 0.35,
  },
  dateTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gregorianDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  hijriDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  /* ── Main White Rounded Container ── */
  mainCardContainer: {
    flex: 1,
    backgroundColor: '#ffffff1f',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    marginTop: 6,
    marginHorizontal: 8,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 12,
  },

  /* ── Prayer Item Cards ── */
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  prayerCardNormal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#73DBE6',
  },
  prayerCardHighlighted: {
    backgroundColor: '#E0F7FA',
    borderColor: '#00BECD',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  prayerNameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D3B6D',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D3B6D',
  },
  timePeriodText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D3B6D',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
