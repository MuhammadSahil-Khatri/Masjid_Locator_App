import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  RefreshControl,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import {
  FajrIcon,
  ShuruqIcon,
  DhuhrIcon,
  AsrIcon,
  MaghribIcon,
  IshaIcon,
} from '../../components/icons/PrayerIcons';
import {
  ActionPrayerTimeIcon,
  ActionHadithIcon,
  ActionQiblaIcon,
} from '../../components/icons/HomeActionIcons';
import { AnnouncementCard } from '../../components/cards/AnnouncementCard';
import {
  ANNOUNCEMENT_CATEGORIES,
  type AnnouncementCategory,
} from '../Announcements/AnnouncementsScreen';
import { useAnnouncementCategoriesQuery } from '../../queries/useAnnouncementsQueries';

const PRAYER_LIST = [
  { key: 'Fajr' as const, label: 'Fajr', labelUr: 'فجر', Icon: FajrIcon },
  { key: 'Sunrise' as const, label: 'Shuruk', labelUr: 'شروق', Icon: ShuruqIcon },
  { key: 'Dhuhr' as const, label: 'Dhuhr', labelUr: 'ظہر', Icon: DhuhrIcon },
  { key: 'Asr' as const, label: 'Asr', labelUr: 'عصر', Icon: AsrIcon },
  { key: 'Maghrib' as const, label: 'Maghrib', labelUr: 'مغرب', Icon: MaghribIcon },
  { key: 'Isha' as const, label: 'Isha', labelUr: 'عشاء', Icon: IshaIcon },
];



export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { currentUser, language, setLanguage, isRtl } = useApp();
  const { navigate } = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // ── Announcement categories from TanStack Query (offline-persisted) ──
  const { data: remoteCategories, refetch: refetchCategories } = useAnnouncementCategoriesQuery();

  const categories: AnnouncementCategory[] = useMemo(() => {
    if (remoteCategories && remoteCategories.length > 0) {
      return remoteCategories.map((c: any) => {
        const staticMatch = ANNOUNCEMENT_CATEGORIES.find(
          (s) => s.id === c.id || s.name_en?.toLowerCase() === (c.name_en || c.name || '').toLowerCase()
        );
        return {
          id: c.id,
          name_en: c.name_en || c.name || staticMatch?.name_en || '',
          name_ur: c.name_ur || staticMatch?.name_ur || '',
        };
      });
    }
    return ANNOUNCEMENT_CATEGORIES;
  }, [remoteCategories]);

  const handleCategoryPress = (category: AnnouncementCategory) => {
    navigate('CategoryAnnouncements', {
      categoryId: category.id,
      categoryName: category.name_en,
      categoryNameEn: category.name_en,
      categoryNameUr: category.name_ur,
    });
  };

  // ── Live prayer times from AlAdhan API ──
  const {
    timings,
    hijriDate,
    gregorianDate,
    upcoming,
    refetch: refetchPrayer,
  } = usePrayerTimes(language);

  // ── Live Clock Time State ──
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hStr = hours < 10 ? `0${hours}` : `${hours}`;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hStr}:${mStr} ${ampm}`;
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const hStr = hours < 10 ? `0${hours}` : `${hours}`;
      const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setCurrentTime(`${hStr}:${mStr} ${ampm}`);
    };

    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Loading overlay fade animation
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: refreshing ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [refreshing, overlayOpacity]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Force fresh API fetch (bypasses cache)
      await refetchPrayer();
    } catch (err) {
      console.warn('[HomeScreen] Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchPrayer]);

  // Format 12-hour clean time (e.g. "05:20" or "00:00")
  const formatPrayerTime = (timeStr?: string) => {
    if (!timeStr) return '00:00';
    const parts = timeStr.trim().split(' ');
    const [h, m] = parts[0].split(':');
    const hNum = parseInt(h, 10);
    const hPad = hNum < 10 ? `0${hNum}` : `${hNum}`;
    return `${hPad}:${m || '00'}`;
  };

  // Format Gregorian date string
  const formattedGregorian = useMemo(() => {
    if (gregorianDate) return gregorianDate;
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }, [gregorianDate]);

  // Format Hijri date string
  const formattedHijri = useMemo(() => {
    if (hijriDate) return hijriDate.replace(' AH', '');
    return '28 Muharram 1448';
  }, [hijriDate]);

  // Next prayer countdown text
  const countdownText = useMemo(() => {
    if (upcoming && upcoming.name && upcoming.remainingTime) {
      if (isRtl) {
        const urNames: Record<string, string> = {
          Fajr: 'فجر', Sunrise: 'شروق', Dhuhr: 'ظہر',
          Asr: 'عصر', Maghrib: 'مغرب', Isha: 'عشاء',
        };
        const urName = urNames[upcoming.name] ?? upcoming.name;
        return `${upcoming.remainingTime} ${urName}`;
      }
      return `${upcoming.name} in ${upcoming.remainingTime}`;
    }
    return isRtl ? 'فجر ۳ گھنٹے ۱۱ منٹ میں' : 'Fajr in 3h 11m';
  }, [upcoming, isRtl]);

  const activePrayerName = upcoming?.currentActive || upcoming?.name || 'Fajr';

  // First 3 categories for the home section
  const homeCategories = categories.slice(0, 3);

  const actionTileWidth = (screenWidth - 132) / 4;

  // Scale fonts proportionally on larger phones (ref = 375px).
  // Clamped: never shrinks below 1.0, never grows beyond 1.2.
  const fontScale = Math.min(Math.max(screenWidth / 375, 1.0), 1.2);

  return (
    <>
      {/* ── REFRESH LOADING OVERLAY ── */}
      <Modal
        visible={refreshing}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View
          style={[styles.loadingOverlay, { opacity: overlayOpacity }]}
          pointerEvents="box-only"
        >
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {isRtl ? 'لوڈ ہو رہا ہے...' : 'Updating...'}
            </Text>
          </View>
        </Animated.View>
      </Modal>

      <View pointerEvents={refreshing ? 'none' : 'auto'} style={styles.screenWrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* ── TOP DAY CARD SECTION ── */}
          <ImageBackground
            source={require('../../../assets/prayer_time_daycard_bg.png')}
            style={[styles.headerCard, { paddingTop: Math.max(insets.top, 16) }]}
            imageStyle={[
              styles.headerCardImage,
              isRtl && { transform: [{ scaleX: -1 }] },
            ]}
            resizeMode="stretch"
          >
            {/* Top Controls Row — flipped in RTL */}
            <View style={[styles.topControlsRow, isRtl && { flexDirection: 'row-reverse' }]}>

              {/* Text Block (left in EN, right in UR) */}
              <View style={[styles.topLeftTextBlock, isRtl && { alignItems: 'flex-end', paddingLeft: 0, paddingRight: 12 }]}>
                <Text style={[styles.greetingText, { fontSize: Math.round(10 * fontScale) }, isRtl && { textAlign: 'right' }]}>
                  {isRtl ? 'السلام علیکم' : 'Assalam-o-Alaikum'}
                </Text>
                <Text style={[styles.userNameText, { fontSize: Math.round(18 * fontScale) }, isRtl && { textAlign: 'right' }]}>
                  {currentUser?.name || 'User Name'}
                </Text>
                <Text style={[styles.hijriDateText, { fontSize: Math.round(14 * fontScale) }, isRtl && { textAlign: 'right' }]}>{formattedHijri}</Text>
                <Text style={[styles.gregorianDateText, { fontSize: Math.round(14 * fontScale) }, isRtl && { textAlign: 'right' }]}>{formattedGregorian}</Text>
                <Text style={[styles.liveClockText, { fontSize: Math.round(26 * fontScale) }, isRtl && { textAlign: 'right' }]}>{currentTime}</Text>
                <Text style={[styles.countdownText, { fontSize: Math.round(14 * fontScale) }, isRtl && { textAlign: 'right' }]}>{countdownText}</Text>
              </View>

              {/* Action Controls (right in EN, left in UR) */}
              <View style={[styles.topRightControls, isRtl && { paddingRight: 0, paddingLeft: 10 }]}>
                {/* Qibla Direction Button */}
                <TouchableOpacity
                  onPress={() => navigate('Qibla')}
                  activeOpacity={0.8}
                  style={styles.qiblaRoundButton}
                >
                  <Image
                    source={require('../../../assets/qibla_direction_icon.png')}
                    style={styles.qiblaIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Language Switcher Pill */}
                <View style={styles.langPillContainer}>
                  <TouchableOpacity
                    style={[
                      styles.langTab,
                      language === 'en' ? styles.langTabActive : styles.langTabInactive,
                    ]}
                    onPress={() => setLanguage('en')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.langTabText,
                        language === 'en' ? styles.langTabTextActive : styles.langTabTextInactive,
                      ]}
                    >
                      EN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.langTab,
                      language === 'ur' ? styles.langTabActive : styles.langTabInactive,
                    ]}
                    onPress={() => setLanguage('ur')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.langTabText,
                        language === 'ur' ? styles.langTabTextActive : styles.langTabTextInactive,
                      ]}
                    >
                      UR
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Prayer Times Row Card — reversed in RTL */}
            <TouchableOpacity
              style={[styles.prayerTimesPanel, isRtl && { flexDirection: 'row-reverse' }]}
              activeOpacity={0.9}
              onPress={() => navigate('PrayerTimes')}
              accessibilityLabel="View full Prayer Times"
            >
              {PRAYER_LIST.map((prayer, index) => {
                const isActive =
                  prayer.key === activePrayerName ||
                  (prayer.key === 'Fajr' && !upcoming);
                const prayerTimeVal = timings ? timings[prayer.key] : undefined;
                const formattedTime = formatPrayerTime(prayerTimeVal);
                const displayLabel = isRtl ? prayer.labelUr : prayer.label;

                return (
                  <View
                    key={prayer.key}
                    style={[
                      styles.prayerColumn,
                      isActive && styles.activePrayerCard,
                      !isActive && index < PRAYER_LIST.length - 1 && styles.prayerDivider,
                    ]}
                  >
                    <Text
                      style={[
                        styles.prayerNameText,
                        isActive && styles.activePrayerNameText,
                        { fontSize: Math.round(12 * fontScale) },
                        // isRtl && { fontFamily: undefined },
                      ]}
                    >
                      {displayLabel}
                    </Text>

                    <View style={styles.prayerIconWrapper}>
                      <prayer.Icon size={26} color="#1B365D" />
                    </View>

                    <Text
                      style={[
                        styles.prayerTimeText,
                        isActive && styles.activePrayerTimeText,
                        { fontSize: Math.round(11 * fontScale) },
                      ]}
                    >
                      {formattedTime}
                    </Text>
                  </View>
                );
              })}
            </TouchableOpacity>
          </ImageBackground>

          {/* ── QUICK ACTION BUTTONS ROW ── */}
          <View style={styles.actionRowContainer}>
            {/* Pray Time */}
            <View style={styles.actionItemWrapper}>
              <TouchableOpacity
                style={[styles.actionTile, { width: actionTileWidth, height: actionTileWidth }]}
                activeOpacity={0.8}
                onPress={() => navigate('PrayerTimes')}
              >
                <ActionPrayerTimeIcon size={35} color="#153258" />
              </TouchableOpacity>
              <Text style={styles.actionTileLabel}>{isRtl ? 'نماز اوقات' : 'Pray Time'}</Text>
            </View>

            {/* Hadith */}
            <View style={styles.actionItemWrapper}>
              <TouchableOpacity
                style={[styles.actionTile, { width: actionTileWidth, height: actionTileWidth }]}
                activeOpacity={0.8}
                onPress={() => navigate('Hadees')}
              >
                <ActionHadithIcon size={35} color="#153258" />
              </TouchableOpacity>
              <Text style={styles.actionTileLabel}>{isRtl ? 'احادیث' : 'Hadith'}</Text>
            </View>

            {/* Qibla */}
            <View style={styles.actionItemWrapper}>
              <TouchableOpacity
                style={[styles.actionTile, { width: actionTileWidth, height: actionTileWidth }]}
                activeOpacity={0.8}
                onPress={() => navigate('Qibla')}
              >
                <ActionQiblaIcon size={35} color="#153258" />
              </TouchableOpacity>
              <Text style={styles.actionTileLabel}>{isRtl ? 'قبلہ' : 'Qibla'}</Text>
            </View>

            {/* Madarsa */}
            <View style={styles.actionItemWrapper}>
              <TouchableOpacity
                style={[styles.actionTile, { width: actionTileWidth, height: actionTileWidth }]}
                activeOpacity={0.8}
                onPress={() => {
                  const madarsaCategory = categories.find(
                    (c) => c.id === 'ee65eb1f-037e-464c-a196-4e7bdc008e76' ||
                      c.name_en?.toLowerCase().includes('madarsa')
                  );
                  if (madarsaCategory) {
                    navigate('CategoryAnnouncements', {
                      categoryId: madarsaCategory.id,
                      categoryName: madarsaCategory.name_en,
                      categoryNameEn: madarsaCategory.name_en,
                      categoryNameUr: madarsaCategory.name_ur,
                    });
                  } else {
                    navigate('Announcements');
                  }
                }}
              >
                <Image
                  source={require('../../../assets/madarsa.webp')}
                  style={{ width: actionTileWidth * 0.75, height: actionTileWidth * 0.75 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.actionTileLabel}>{isRtl ? 'مدرسہ' : 'Madarsa'}</Text>
            </View>
          </View>

          {/* ── ANNOUNCEMENT SECTION ── */}
          <View style={styles.announcementSection}>
            {/* Header with Title and "See All" */}
            <View style={[styles.announcementHeader, isRtl && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.announcementSectionTitle, isRtl && { marginLeft: 0, marginRight: 10, textAlign: 'right' }]}>
                {isRtl ? 'اعلانات' : 'Announcement'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigate('Announcements')}
              >
                <Text style={[styles.seeAllText, isRtl && { marginRight: 0, marginLeft: 10 }]}>
                  {isRtl ? 'سب دیکھیں' : 'See All'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of Announcement Cards */}
            <View style={styles.announcementList}>
              {homeCategories.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  id={item.id}
                  title={isRtl ? (item.name_ur || item.name_en || '') : (item.name_en || '')}
                  onPress={() => handleCategoryPress(item)}
                  isRtl={isRtl}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFEFF',
    position: 'relative',
  },
  screenWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* Top Day Card */
  headerCard: {
    width: '100%',
    justifyContent: 'space-between',
  },
  headerCardImage: {
    width: '100%',
    height: '100%',
  },
  topControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  topLeftTextBlock: {
    paddingLeft: 8,
    flex: 1,
    paddingRight: 10,
  },
  greetingText: {
    color: '#8E7343',
    fontSize: 10,
    fontWeight: '500',
  },
  userNameText: {
    color: '#1B365D',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  hijriDateText: {
    color: '#1B365D',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  gregorianDateText: {
    color: '#1B365D',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  liveClockText: {
    color: '#1B365D',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    // marginBottom: 2,
  },
  countdownText: {
    color: '#1B365D',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Right Controls */
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    // marginTop: 4,
  },
  qiblaRoundButton: {
    width: 30,
    height: 30,
    borderRadius: 19,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qiblaIconImage: {
    width: 30,
    height: 30,
  },
  langPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1B365D',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    padding: 2,
  },
  langTab: {
    paddingHorizontal: 6,
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langTabActive: {
    backgroundColor: '#1B365D',
  },
  langTabInactive: {
    backgroundColor: 'transparent',
  },
  langTabText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  langTabTextActive: {
    color: '#FFFFFF',
  },
  langTabTextInactive: {
    color: '#1B365D',
  },

  /* Prayer Times Row Card */
  prayerTimesPanel: {
    backgroundColor: 'rgba(216, 243, 250, 1)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#a7e7f8ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    gap: 2,
    marginHorizontal: 8,
    marginBottom: 10,
    marginTop: 20
  },
  prayerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  activePrayerCard: {
    backgroundColor: '#ffffffff',
    borderRadius: 12,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
    }),
  },
  prayerDivider: {
    borderRightWidth: 1,
    borderStyle: 'solid',
    borderRightColor: '#f9fafaff',
  },
  prayerNameText: {
    color: '#1B365D',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  activePrayerNameText: {
    color: '#1B365D',
    fontWeight: '800',
  },
  prayerIconWrapper: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  prayerTimeText: {
    color: '#1B365D',
    fontSize: 11,
    fontWeight: '600',
  },
  activePrayerTimeText: {
    color: '#1B365D',
    fontWeight: '700',
  },

  /* Quick Action Buttons Row */
  actionRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  actionItemWrapper: {
    alignItems: 'center',
  },
  actionTile: {
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#BFE7F2',
    backgroundColor: '#D1F3F9',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#52CDE3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#52CDE3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
    }),
  },
  actionTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#153258',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyActionTile: {
    width: '100%',
    height: '100%',
  },

  /* Announcement Section */
  announcementSection: {
    paddingHorizontal: 7,
    marginTop: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementSectionTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#1B365D',
    // letterSpacing: 0.2,
  },
  seeAllText: {
    marginRight: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1B365D',
  },
  announcementList: {
    width: '100%',
  },

  /* Refresh Loading Overlay */
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    // backgroundColor: '#FFFFFF',
    // borderRadius: 20,
    // paddingVertical: 28,
    // paddingHorizontal: 40,
    alignItems: 'center',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fefeffff',
    marginTop: 4,
  },
});

export default HomeScreen;
