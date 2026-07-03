import React, { useState } from 'react';
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
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { MapPin, Clock, Copy, Share2, RefreshCw, AlertTriangle, Compass, Languages } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export const HomeScreen: React.FC = () => {
  const {
    currentUser,
    hadeesList,
    announcements,
    handleAnnounceRead,
    highContrast: isDark,
    isRtl,
    translations,
    triggerToast,
    language,
    setLanguage
  } = useApp();

  const currentTheme = colors.light;
  const { navigate } = useNavigation();

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
  } = usePrayerTimes();

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const handleShareHadees = async (text: string, ref: string, source: string) => {
    try {
      await Share.share({
        message: `"${text}"\nReference: ${ref} (${source})`,
      });
    } catch (error) {
      triggerToast('Error sharing Hadees');
    }
  };

  const handleCopyHadees = (textAr: string, textEn: string, ref: string) => {
    const shareText = `${textAr}\n\n${textEn}\n\nReference: ${ref}`;
    Clipboard.setString(shareText);
    triggerToast(translations.copiedText || 'Copied to clipboard!');
  };

  // Get daily Hadith
  const dailyHadith = hadeesList && hadeesList.length > 0 ? hadeesList[0] : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.offWhite }]}>

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

        {/* Loading skeleton */}
        {prayerLoading && !timings && (
          <View style={[styles.prayerCard, styles.prayerCardSkeleton]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.skeletonText, { color: currentTheme.textMuted }]}>
              Fetching prayer times…
            </Text>
          </View>
        )}

        {/* Error state */}
        {!timings && prayerError && (
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
        {timings && upcoming && (
          <ImageBackground
            source={require('../../../assets/prayer_time_card_bg.png')}
            style={styles.prayerCard}
            imageStyle={styles.prayerCardImage}
            resizeMode="cover"
          >
            {/* Dark overlay for readability */}
            <View style={styles.prayerCardOverlay}>

              {/* TOP ROW: Hijri Date (left) + Location (right) */}
              <View style={styles.prayerTopRow}>
                <View>
                  <Text style={styles.prayerHijriDate}>
                    {hijriDate.replace(' AH', '')}
                  </Text>
                  <Text style={styles.prayerGregorianDate}>
                    {gregorianDate}
                  </Text>
                </View>
                <View style={styles.locationChip}>
                  <MapPin size={11} color="#ffffff" />
                  <Text style={styles.locationChipText}>
                    {city || currentUser?.region || 'Locating…'}
                  </Text>
                </View>
              </View>

              {/* CENTER: Prayer Name + Time */}
              <View style={styles.prayerCenterBlock}>
                <Text style={styles.prayerNameLarge}>
                  {isRtl ? ((translations as any)[upcoming.name.toLowerCase()] || upcoming.name) : upcoming.name}
                </Text>
                <Text style={styles.prayerTimeLarge}>
                  {upcoming.time}
                </Text>
              </View>

              {/* BOTTOM TIMELINE */}
              <View style={styles.prayerTimeline}>
                {PRAYER_KEYS.map((name) => {
                  const key = name.toLowerCase();
                  const time = timings[name];
                  const isActive = upcoming.currentActive === name;
                  const displayName = isRtl ? ((translations as any)[key] || name) : name;

                  return (
                    <View key={key} style={styles.timelineCol}>
                      <Text style={[styles.tlName, isActive && styles.tlNameActive]}>
                        {displayName}
                      </Text>
                      <Text style={[styles.tlTime, isActive && styles.tlTimeActive]}>
                        {time}
                      </Text>
                      <View style={styles.tlDotWrap}>
                        {isActive && <View style={styles.tlDot} />}
                      </View>
                    </View>
                  );
                })}
              </View>

            </View>
          </ImageBackground>
        )}
      </View>

      {/* ── 3. ANNOUNCEMENTS SECTION ── */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
          📢 {isRtl ? 'اعلانات' : 'Updates'}
        </Text>

        {announcements && announcements.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.announcementsCarousel}
          >
            {announcements.map((ann) => {
              const isUnread = !ann.isRead;
              return (
                <View
                  key={ann.id}
                  style={[
                    styles.announcementCard,
                    {
                      backgroundColor: currentTheme.card,
                      borderColor: isUnread ? colors.primary : currentTheme.border,
                      borderLeftWidth: isUnread ? 4 : 1
                    }
                  ]}
                >
                  <View style={[styles.announcementHeader, isRtl && styles.rowReverse]}>
                    <Text style={[styles.announcementMasjid, { color: colors.primary }]}>
                      🕌 {ann.masjidName}
                    </Text>
                    <Text style={[styles.announcementDate, { color: currentTheme.textMuted }]}>
                      {ann.date}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[styles.announcementTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}
                  >
                    {isRtl ? ann.titleUr : ann.titleEn}
                  </Text>

                  <Text
                    numberOfLines={2}
                    style={[styles.announcementContent, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}
                  >
                    {isRtl ? ann.contentUr : ann.contentEn}
                  </Text>

                  <View style={[styles.announcementFooter, isRtl && styles.rowReverse]}>
                    <TouchableOpacity
                      style={[styles.readMoreBtn, { borderColor: colors.primaryBorder }]}
                      onPress={() => setSelectedAnnouncement(ann)}
                    >
                      <Text style={styles.readMoreText}>
                        {isRtl ? 'مزید پڑھیں' : 'Read More'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
          📖 {isRtl ? 'آج کی حدیث' : 'Daily Hadees'}
        </Text>

        {dailyHadith ? (
          <View style={[styles.hadithCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={styles.arabicHadith}>
              {dailyHadith.textAr}
            </Text>

            {/* Divider */}
            <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />

            <Text style={[styles.translationHadith, { color: currentTheme.text }]}>
              {isRtl ? dailyHadith.textUr : dailyHadith.textEn}
            </Text>

            <Text style={[styles.hadithRef, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
              📌 {translations.reference || 'Reference'}: {isRtl ? dailyHadith.referenceUr : dailyHadith.referenceEn} ({dailyHadith.source})
            </Text>

            {/* Hadith Actions */}
            <View style={[styles.hadithActionsRow, isRtl && styles.rowReverse]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleCopyHadees(dailyHadith.textAr, isRtl ? dailyHadith.textUr : dailyHadith.textEn, isRtl ? dailyHadith.referenceUr : dailyHadith.referenceEn)}
              >
                <Copy size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  {isRtl ? 'کاپی کریں' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleShareHadees(isRtl ? dailyHadith.textUr : dailyHadith.textEn, isRtl ? dailyHadith.referenceUr : dailyHadith.referenceEn, dailyHadith.source)}
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
              {isRtl ? 'حدیث آج دستیاب نہیں ہے۔' : 'Daily Hadith not loaded.'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSpacer} />

      {/* ── ANNOUNCEMENT READ MORE MODAL ── */}
      {selectedAnnouncement && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedAnnouncement}
          onRequestClose={() => setSelectedAnnouncement(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: currentTheme.surface }]}>
              <Text style={[styles.modalMasjidRef, { color: colors.primary }]}>
                🕌 {selectedAnnouncement.masjidName}
              </Text>

              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                {isRtl ? selectedAnnouncement.titleUr : selectedAnnouncement.titleEn}
              </Text>

              <Text style={[styles.modalDate, { color: currentTheme.textMuted }]}>
                {selectedAnnouncement.date}
              </Text>

              <ScrollView style={styles.modalContentScroll}>
                <Text style={[styles.modalBodyText, { color: currentTheme.text }]}>
                  {isRtl ? selectedAnnouncement.contentUr : selectedAnnouncement.contentEn}
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                {selectedAnnouncement.isRead === false && (
                  <TouchableOpacity
                    style={[styles.modalReadBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      handleAnnounceRead(selectedAnnouncement.id);
                      setSelectedAnnouncement(null);
                    }}
                  >
                    <Text style={styles.modalReadBtnText}>
                      {translations.markRead || 'Mark as Read'}
                    </Text>
                  </TouchableOpacity>
                )}
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
      )}
    </ScrollView>
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
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    marginTop: 2,
    marginBottom: 2,
    flexDirection: 'column',
    alignItems: 'baseline',
    gap: 10,
  },
  prayerNameLarge: {
    color: '#ffffff',
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  prayerTimeLarge: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.regular,
    letterSpacing: -0.5,
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
  prayerTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  timelineCol: {
    flex: 1,
    alignItems: 'center',
  },
  tlName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  tlNameActive: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  tlTime: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: typography.weights.medium,
  },
  tlTimeActive: {
    color: '#10b981',
    fontWeight: typography.weights.bold,
  },
  tlDotWrap: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  tlDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5757',
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
  announcementsCarousel: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  announcementCard: {
    width: SCREEN_WIDTH * 0.8,
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
    marginBottom: spacing.sm,
  },
  announcementMasjid: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  announcementDate: {
    fontSize: typography.sizes.xs,
  },
  announcementTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  announcementContent: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
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
