import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
  Modal,
  Clipboard,
  ActivityIndicator,
  ImageBackground,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { MapPin, Copy, Share2, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { hadithService, Hadith } from '../../services/hadithService';
import { announcementService, Announcement } from '../../services/announcementService';
import { CacheService } from '../../services/cacheService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRAYER_KEYS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

// Skeleton Component
const Skeleton = ({ width, height, borderRadius = 4, style }: any) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const HomeScreen: React.FC = () => {
  const {
    currentUser,
    highContrast: isDark,
    isRtl,
    translations,
    triggerToast,
    language,
    setLanguage
  } = useApp();

  const currentTheme = colors.light;
  const { navigate } = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // ── Live prayer times from AlAdhan API ──
  const {
    timings,
    hijriDate,
    gregorianDate,
    city,
    upcoming,
    loading: prayerLoading,
    error: prayerError,
    refetch: refetchPrayer,
  } = usePrayerTimes(language);

  // ── Day / Night detection (Fajr → Maghrib = day) ──
  const isDaytime = useMemo(() => {
    if (!timings) return true; // default to day if no data yet
    try {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const toMin = (t: string) => {
        const parts = t.trim().split(' ');
        const [h, m] = parts[0].split(':').map(Number);
        let hours = h;
        if (parts[1]) {
          const p = parts[1].toUpperCase();
          if (p === 'AM' && hours === 12) hours = 0;
          if (p === 'PM' && hours !== 12) hours += 12;
        }
        return hours * 60 + m;
      };
      const fajrMin = toMin(timings.Fajr);
      const maghribMin = toMin(timings.Maghrib);
      return currentMin >= fajrMin && currentMin < maghribMin;
    } catch {
      return true;
    }
  }, [timings]);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // ── Hadith State ──
  const [hadithList, setHadithList] = useState<Hadith[]>(() => {
    const cached = CacheService.getHadith(true);
    return cached || [];
  });
  const [hadithLoading, setHadithLoading] = useState(() => {
    if (CacheService.isHadithWarmed()) return false;
    const cached = CacheService.getHadith(true);
    return !cached || cached.length === 0;
  });

  // ── Announcements State ──
  const [announcementList, setAnnouncementList] = useState<Announcement[]>(() => {
    const cached = CacheService.getAnnouncements(true);
    return cached ? cached.slice(0, 3) : [];
  });
  const [annLoading, setAnnLoading] = useState(() => {
    if (CacheService.isAnnouncementsWarmed()) return false;
    const cached = CacheService.getAnnouncements(true);
    return !cached || cached.length === 0;
  });

  // Fetch Hadith independently
  const loadHadithData = useCallback(async (forceFetch = false) => {
    if (!forceFetch && CacheService.isHadithWarmed()) return;

    const hasCache = (CacheService.getHadith(true) || []).length > 0;
    const isExpired = CacheService.isHadithExpired();

    if (!forceFetch && hasCache && !isExpired) {
      const cached = CacheService.getHadith(true);
      if (cached) {
        CacheService.setHadith(cached);
      }
      return;
    }

    try {
      if (!hasCache) {
        setHadithLoading(true);
      }
      const data = await hadithService.fetchPublicHadith();
      CacheService.setHadith(data);
      setHadithList(data);
    } catch (e) {
      console.warn('[HomeScreen] Hadith fetch failed:', e);
    } finally {
      setHadithLoading(false);
    }
  }, []);

  // Fetch Announcements independently
  const loadAnnouncementsData = useCallback(async (forceFetch = false) => {
    if (!forceFetch && CacheService.isAnnouncementsWarmed()) return;

    const hasCache = (CacheService.getAnnouncements(true) || []).length > 0;
    const isExpired = CacheService.isAnnouncementsExpired();

    if (!forceFetch && hasCache && !isExpired) {
      const cached = CacheService.getAnnouncements(true);
      if (cached) {
        CacheService.setAnnouncements(cached);
      }
      return;
    }

    try {
      if (!hasCache) {
        setAnnLoading(true);
      }
      const data = await announcementService.fetchPublicAnnouncements();
      CacheService.setAnnouncements(data);
      setAnnouncementList(data.slice(0, 3));
    } catch (e) {
      console.warn('[HomeScreen] Announcements fetch failed:', e);
    } finally {
      setAnnLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHadithData();
    loadAnnouncementsData();
  }, [loadHadithData, loadAnnouncementsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPrayer(),
        loadHadithData(true),
        loadAnnouncementsData(true)
      ]);
    } catch (error) {
      console.warn('[HomeScreen] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchPrayer, loadHadithData, loadAnnouncementsData]);

  const handleShareHadees = async (text: string, ref: string) => {
    try {
      await Share.share({ message: `"${text}"\n\nReference: ${ref}` });
    } catch {
      triggerToast('Error sharing Hadees');
    }
  };

  const handleCopyHadees = (textAr: string, textEn: string, ref: string) => {
    Clipboard.setString(`${textAr}\n\n${textEn}\n\nReference: ${ref}`);
    triggerToast(translations.copiedText || 'Copied to clipboard!');
  };

  // Get daily Hadith from Supabase data
  const dailyHadith = hadithList.length > 0 ? hadithList[0] : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.offWhite }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >

      {/* ── 1. GREETING SECTION ── */}
      <View style={[styles.headerSection, isRtl && styles.rowReverse]}>
        <View>
          <Text style={[styles.greetingLabel, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
            {isRtl ? 'السلام علیکم،' : 'Assalamualaikum,'}
          </Text>
          <Text style={[styles.userName, isRtl && typography.alignRtl]}>
            {currentUser?.name || 'Worshipper'}
          </Text>
        </View>

        {/* Top Header Actions */}
        <View style={[styles.headerActions, isRtl && styles.rowReverse]}>
          <TouchableOpacity
            onPress={() => navigate('Qibla')}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../assets/qibla_direction_icon.png')}
              style={styles.qiblaIconFullImage}
            />
          </TouchableOpacity>

          <View style={[styles.switchContainer, { borderColor: colors.primary }]}>
            <TouchableOpacity
              style={[
                styles.switchTab,
                language === 'en' ? { backgroundColor: colors.primary } : null,
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchTabText,
                  language === 'en' ? { color: '#ffffff' } : { color: colors.primary },
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switchTab,
                language === 'ur' ? { backgroundColor: colors.primary } : null,
              ]}
              onPress={() => setLanguage('ur')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchTabText,
                  language === 'ur' ? { color: '#ffffff' } : { color: colors.primary },
                ]}
              >
                UR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 2. PRAYER TIME CARD ── */}
      <View style={styles.prayerCardContainer}>

        {/* Error state */}
        {!prayerLoading && !timings && prayerError && (
          <View style={[styles.prayerCard, styles.prayerCardError]}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={[styles.errorCardText, { color: colors.brown }]}>
              Could not load prayer times
            </Text>
            <TouchableOpacity
              style={[styles.retryPill, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}
              onPress={refetchPrayer}
            >
              <RefreshCw size={13} color={colors.primary} />
              <Text style={[styles.retryPillText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Live prayer card */}
        {(prayerLoading || refreshing || (timings && upcoming)) && (
          <ImageBackground
            source={
              isDaytime
                ? require('../../../assets/prayer_time_daycard_bg.webp')
                : require('../../../assets/prayer_time_nightcard_bg.webp')
            }
            style={styles.prayerCard}
            imageStyle={styles.prayerCardImage}
            resizeMode="stretch"
          >
            {/* Dark overlay for readability */}
            <View style={styles.prayerCardOverlay}>

              {/* TOP ROW: Hijri Date (left) + Location (right) */}
              <View style={styles.prayerTopRow}>
                <View>
                  {((prayerLoading && !timings) || refreshing) ? (
                    <View style={{ gap: 4 }}>
                      <Skeleton width={100} height={16} />
                      <Skeleton width={80} height={12} />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.prayerHijriDate}>
                        {hijriDate.replace(' AH', '')}
                      </Text>
                      <Text style={styles.prayerGregorianDate}>
                        {gregorianDate}
                      </Text>
                    </>
                  )}
                </View>
                <View style={styles.locationChip}>
                  <MapPin size={11} color="#000000" />
                  <Text style={[styles.locationChipText, { color: '#000000ff' }]}>

                    {prayerLoading && !city ? 'Locating…' : (city || currentUser?.region || 'Locating…')}
                  </Text>
                </View>
              </View>

              {/* CENTER: Prayer Name + Time */}
              <View style={styles.prayerCenterBlock}>
                {((prayerLoading && !timings) || refreshing) ? (
                  <>
                    <Skeleton width={140} height={32} style={{ marginBottom: 10 }} />
                    <Skeleton width={100} height={32} />
                  </>
                ) : (
                  <>
                    <Text style={styles.prayerNameLarge}>
                      {isRtl ? ((translations as any)[upcoming?.currentActive?.toLowerCase() || ''] || upcoming?.currentActive) : upcoming?.currentActive}
                    </Text>
                    <Text style={styles.prayerTimeLarge}>
                      {timings![upcoming?.currentActive as keyof typeof timings]}
                    </Text>
                    <Text style={styles.nextPrayerLabel}>
                      {isRtl ? ((translations as any)[upcoming?.name.toLowerCase() || ''] || upcoming?.name) : upcoming?.name} in {upcoming?.remainingTime}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </ImageBackground>
        )}
      </View>

      {/* ── VERTICAL PRAYER TIMES ── */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
          {isRtl ? 'نماز کے اوقات' : 'Prayer Times'}
        </Text>
        <View style={styles.verticalPrayerList}>
          {((prayerLoading && !timings) || refreshing) ? (
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={40} height={12} />
                  </View>
                  <Skeleton width={60} height={16} />
                </View>
              ))}
            </View>
          ) : (
            timings && upcoming && PRAYER_KEYS.map((name) => {
              const key = name.toLowerCase();
              const time = timings[name];
              if (!time) return null; // In case Sunrise isn't returned

              // Only highlight the 'next' prayer or active prayer depending on logic
              const isActive = upcoming.name === name;
              const displayName = name === 'Sunrise' ? 'Shuruq' : (isRtl ? ((translations as any)[key] || name) : name);

              // Map English subtitles
              const subtitles: Record<string, string> = {
                'fajr': 'Dawn',
                'sunrise': 'Sunrise',
                'dhuhr': 'Noon',
                'asr': 'Afternoon',
                'maghrib': 'Sunset',
                'isha': 'Night',
              };
              const subtitle = subtitles[key];

              const icons: Record<string, any> = {
                'fajr': require('../../../assets/Prayer_Time_Icons/fajr.webp'),
                'sunrise': require('../../../assets/Prayer_Time_Icons/shuruq.webp'),
                'dhuhr': require('../../../assets/Prayer_Time_Icons/dhuhr.webp'),
                'asr': require('../../../assets/Prayer_Time_Icons/asr.webp'),
                'maghrib': require('../../../assets/Prayer_Time_Icons/maghrib.webp'),
                'isha': require('../../../assets/Prayer_Time_Icons/isha.webp'),
              };
              const iconSource = icons[key];

              return (
                <View key={key} style={[styles.verticalPrayerRow, isActive && styles.verticalPrayerRowActive]}>
                  <View style={styles.prayerRowLeft}>
                    {iconSource && <Image source={iconSource} style={styles.prayerRowIcon} resizeMode="contain" />}
                    <View>
                      <Text style={[styles.verticalPrayerName, isActive && styles.verticalPrayerNameActive]}>
                        {displayName}
                      </Text>
                      <Text style={[styles.verticalPrayerSubtitle, isActive && styles.verticalPrayerSubtitleActive]}>
                        {subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.prayerRowRight}>
                    <Text style={[styles.verticalPrayerTime, isActive && styles.verticalPrayerTimeActive]}>
                      {time}
                    </Text>
                    {/* <View style={[styles.prayerCheckIcon, isActive && styles.prayerCheckIconActive]}>
                      {isActive && <MapPin size={10} color="#ffffff" />}
                    </View> */}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* ── 3. ANNOUNCEMENTS SECTION ── */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
          {isRtl ? 'اعلانات' : 'Updates'}
        </Text>

        {((annLoading && announcementList.length === 0) || refreshing) ? (
          <View style={styles.announcementsListContainer}>
            <View style={[styles.announcementCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <View style={[styles.announcementHeader, isRtl && styles.rowReverse]}>
                <Skeleton width={120} height={16} />
                <Skeleton width={60} height={12} />
              </View>
              <Skeleton width="100%" height={14} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="80%" height={14} style={{ marginBottom: spacing.md }} />
            </View>
          </View>
        ) : announcementList.length > 0 ? (
          <View style={styles.announcementsListContainer}>
            {announcementList.map((ann) => {
              const dateLabel = ann.event_date
                ? new Date(ann.event_date).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short' })
                : new Date(ann.created_at).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short' });
              return (
                <View
                  key={ann.id}
                  style={[
                    styles.announcementCard,
                    { backgroundColor: currentTheme.card, borderColor: currentTheme.border }
                  ]}
                >
                  <View style={[styles.announcementHeader, isRtl && styles.rowReverse]}>
                    <Text style={[styles.announcementTitle, { color: currentTheme.text, flex: 1 }, isRtl && typography.alignRtl]} numberOfLines={1}>
                      {ann.title}
                    </Text>
                    <Text style={[styles.announcementDateTop, { color: currentTheme.textMuted }]}>
                      {dateLabel}
                    </Text>
                  </View>

                  <Text
                    style={[styles.announcementContent, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}
                  >
                    {ann.description}
                  </Text>

                  <View style={styles.announcementFooterDetails}>
                    <Text style={[styles.announcementMasjid, { color: colors.primary }]}>
                      {ann.mosque_name || 'Masjid'}
                    </Text>
                    <Text style={[styles.announcementDateTime, { color: currentTheme.textMuted }]}>
                      {ann.event_date
                        ? new Date(ann.event_date).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date(ann.created_at).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {ann.event_time && ` at ${ann.event_time}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
              {isRtl ? 'اس وقت کوئی اعلانات دستیاب نہیں ہیں۔' : 'No announcements available at this time.'}
            </Text>
          </View>
        )}
      </View>

      {/* ── 4. DAILY HADITH SECTION ── */}
      <View style={[styles.sectionContainer, { marginBottom: spacing.huge }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
          {isRtl ? 'آج کی حدیث' : 'Daily Hadees'}
        </Text>

        {((hadithLoading && !dailyHadith) || refreshing) ? (
          <View style={[styles.hadithCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Skeleton width="90%" height={26} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />
            <Skeleton width="70%" height={26} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />
            <Skeleton width="100%" height={14} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : dailyHadith ? (
          <View style={[styles.hadithCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={styles.arabicHadith}>
              {dailyHadith.arabic_text}
            </Text>

            <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />

            <Text style={[styles.translationHadith, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              {isRtl ? dailyHadith.urdu_translation : dailyHadith.english_translation}
            </Text>

            <Text style={[styles.hadithRef, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
              📌 {translations.reference || 'Reference'}: {dailyHadith.reference}
            </Text>

            <View style={[styles.hadithActionsRow, isRtl && styles.rowReverse]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleCopyHadees(dailyHadith.arabic_text, isRtl ? dailyHadith.urdu_translation : dailyHadith.english_translation, dailyHadith.reference)}
              >
                <Copy size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  {isRtl ? 'کاپی کریں' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleShareHadees(isRtl ? dailyHadith.urdu_translation : dailyHadith.english_translation, dailyHadith.reference)}
              >
                <Share2 size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  {isRtl ? 'شیر کریں' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
              {isRtl ? 'حدیث آج دستیاب نہیں ہے۔' : 'No hadith available.'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSpacer} />

      {/* ── ANNOUNCEMENT READ MORE MODAL ── */}
      {
        selectedAnnouncement && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={!!selectedAnnouncement}
            onRequestClose={() => setSelectedAnnouncement(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { backgroundColor: currentTheme.surface }]}>
                <Text style={[styles.modalMasjidRef, { color: colors.primary }]}>
                  🕌 {selectedAnnouncement.mosque_name || 'Masjid'}
                </Text>

                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  {selectedAnnouncement.title}
                </Text>

                <Text style={[styles.modalDate, { color: currentTheme.textMuted }]}>
                  {selectedAnnouncement.event_date
                    ? new Date(selectedAnnouncement.event_date).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date(selectedAnnouncement.created_at).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {selectedAnnouncement.event_time && ` · ${selectedAnnouncement.event_time}`}
                </Text>

                <ScrollView style={styles.modalContentScroll}>
                  <Text style={[styles.modalBodyText, { color: currentTheme.text }]}>
                    {selectedAnnouncement.description}
                  </Text>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { borderColor: currentTheme.border }]}
                    onPress={() => setSelectedAnnouncement(null)}
                  >
                    <Text style={[styles.modalCloseText, { color: currentTheme.text }]}>
                      {isRtl ? 'بند کریں' : 'Close'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )
      }
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    // letterSpacing: 0.2,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    marginTop: spacing.xs - 2,
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qiblaIconFullImage: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  switchContainer: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    padding: 2,
    alignItems: 'center',
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchTab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  switchTabText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dateIcon: {
    marginRight: spacing.xs,
  },
  dateText: {
    fontSize: typography.sizes.sm,
  },
  prayerCardContainer: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.peach,
  },
  prayerCard: {
    width: '100%',
  },
  prayerCardImage: {
    width: '100%',
    height: '100%',
  },
  prayerCardOverlay: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  prayerCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 80,
  },
  skeletonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  prayerCardError: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  errorCardText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  retryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: spacing.borderRadiusRound,
    borderWidth: 1,
  },
  retryPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  prayerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  prayerHijriDate: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  prayerGregorianDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.xs - 1,
    marginTop: 1,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.79)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  locationChipText: {
    color: '#ffffff',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  prayerCenterBlock: {
    marginTop: 10,
    marginBottom: 2,
    flexDirection: 'column',
    alignItems: 'baseline',
    gap: 2,
  },
  prayerNameLarge: {
    color: '#ffffff',
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: 0,
  },
  prayerTimeLarge: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
    marginBottom: spacing.md,
  },
  countdownPillText: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  currentPrayerLabel: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
    opacity: 0.9,
  },
  nextPrayerLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  verticalPrayerList: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  verticalPrayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    borderRadius: 16,
  },
  verticalPrayerRowActive: {
    backgroundColor: 'rgba(161, 213, 201, 0.8)', // teal-ish highlight
  },
  prayerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  prayerRowIcon: {
    width: 32,
    height: 32,
  },
  verticalPrayerName: {
    fontSize: typography.sizes.sm,
    color: '#374151',
    fontWeight: typography.weights.bold,
  },
  verticalPrayerNameActive: {
    color: colors.primary,
  },
  verticalPrayerSubtitle: {
    fontSize: typography.sizes.xs - 1,
    color: '#6b7280',
    marginTop: 2,
  },
  verticalPrayerSubtitleActive: {
    color: colors.primary,
    opacity: 0.8,
  },
  prayerRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verticalPrayerTime: {
    fontSize: typography.sizes.sm,
    color: '#111827',
    fontWeight: typography.weights.bold,
  },
  verticalPrayerTimeActive: {
    color: colors.primary,
  },
  prayerCheckIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#a1a1aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerCheckIconActive: {
    backgroundColor: '#f97316', // orange check mark
    borderColor: '#f97316',
  },
  sectionContainer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  announcementsListContainer: {
    gap: spacing.md,
  },
  announcementCard: {
    width: '100%',
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  announcementTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  announcementDateTop: {
    fontSize: typography.sizes.xs,
    marginLeft: spacing.sm,
  },
  announcementContent: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  announcementFooterDetails: {
    flexDirection: 'column',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 4,
  },
  announcementMasjid: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  announcementDateTime: {
    fontSize: typography.sizes.xs,
  },
  markReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm - 2,
    borderRadius: spacing.borderRadiusSm,
    gap: 4,
  },
  markReadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  readMoreBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadiusRound,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  readMoreText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  hadithCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  arabicHadith: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  cardDivider: {
    height: 1,
    marginVertical: spacing.md,
    opacity: 0.1,
  },
  translationHadith: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  hadithRef: {
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  hadithActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadiusRound,
    gap: spacing.xs,
  },
  actionBtnText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  emptyCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalMasjidRef: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  modalDate: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.md,
  },
  modalContentScroll: {
    maxHeight: 200,
    marginBottom: spacing.lg,
  },
  modalBodyText: {
    fontSize: typography.sizes.sm + 1,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalReadBtn: {
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.borderRadiusRound,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalReadBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  modalCloseBtn: {
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.borderRadiusRound,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
