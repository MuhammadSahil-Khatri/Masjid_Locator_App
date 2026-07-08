import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Copy, Share2, BookOpen, Quote, Bell, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { hadithService, Hadith } from '../../services/hadithService';
import { announcementService, Announcement } from '../../services/announcementService';
import { CacheService } from '../../services/cacheService';

export const HadeesScreen: React.FC = () => {
  const {
    highContrast: isDark,
    isRtl,
    translations,
    triggerToast,
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const [activeTab, setActiveTab] = useState<'hadees' | 'announcements'>('hadees');
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
  const [hadithError, setHadithError] = useState<string | null>(null);

  // ── Announcements State ──
  const [announcementList, setAnnouncementList] = useState<Announcement[]>(() => {
    const cached = CacheService.getAnnouncements(true);
    return cached || [];
  });
  const [annLoading, setAnnLoading] = useState(() => {
    if (CacheService.isAnnouncementsWarmed()) return false;
    const cached = CacheService.getAnnouncements(true);
    return !cached || cached.length === 0;
  });
  const [annError, setAnnError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch Functions ──
  const loadHadith = useCallback(async (force = false) => {
    if (!force && CacheService.isHadithWarmed()) {
      return;
    }

    const hasCache = (CacheService.getHadith(true) || []).length > 0;
    const isExpired = CacheService.isHadithExpired();

    if (!force && hasCache && !isExpired) {
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
      setHadithError(null);
      const data = await hadithService.fetchPublicHadith();
      CacheService.setHadith(data);
      setHadithList(data);
    } catch (e: any) {
      console.warn('[HadeesScreen] Hadith fetch failed:', e);
      if (!hasCache) {
        setHadithError(e?.message || 'Failed to load hadith');
      }
    } finally {
      setHadithLoading(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async (force = false) => {
    if (!force && CacheService.isAnnouncementsWarmed()) {
      return;
    }

    const hasCache = (CacheService.getAnnouncements(true) || []).length > 0;
    const isExpired = CacheService.isAnnouncementsExpired();

    if (!force && hasCache && !isExpired) {
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
      setAnnError(null);
      const data = await announcementService.fetchPublicAnnouncements();
      CacheService.setAnnouncements(data);
      setAnnouncementList(data);
    } catch (e: any) {
      console.warn('[HadeesScreen] Announcements fetch failed:', e);
      if (!hasCache) {
        setAnnError(e?.message || 'Failed to load announcements');
      }
    } finally {
      setAnnLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHadith();
    loadAnnouncements();
  }, [loadHadith, loadAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHadith(true), loadAnnouncements(true)]);
    setRefreshing(false);
  }, [loadHadith, loadAnnouncements]);

  // ── Hadith Actions ──
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

  // ── Render Hadith Card ──
  const renderHadithCard = (item: Hadith) => (
    <View
      key={item.id}
      style={[
        styles.hadithCard,
        {
          backgroundColor: currentTheme.card,
          borderColor: currentTheme.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={[styles.hadithHeader, isRtl && styles.rowReverse]}>
        <Quote size={18} color={colors.primary} />
        <Text style={[styles.hadithRefLabel, { color: currentTheme.textMuted }]}>
          {item.reference}
        </Text>
      </View>

      <Text style={styles.arabicHadith}>{item.arabic_text}</Text>
      <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />
      <Text style={[styles.translationHadith, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
        {isRtl ? item.urdu_translation : item.english_translation}
      </Text>

      <Text style={[styles.hadithRef, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
        📌 {translations.reference || 'Reference'}: {item.reference}
      </Text>

      <View style={[styles.hadithActionsRow, isRtl && styles.rowReverse]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleCopyHadees(item.arabic_text, isRtl ? item.urdu_translation : item.english_translation, item.reference)}
        >
          <Copy size={14} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            {isRtl ? 'کاپی' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleShareHadees(isRtl ? item.urdu_translation : item.english_translation, item.reference)}
        >
          <Share2 size={14} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            {isRtl ? 'شیئر' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render Announcement Card ──
  const renderAnnouncementCard = (ann: Announcement) => {
    const dateLabel = ann.event_date
      ? new Date(ann.event_date).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date(ann.created_at).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short' });

    return (
      <View
        key={ann.id}
        style={[
          styles.announcementCard,
          {
            backgroundColor: currentTheme.card,
            borderColor: currentTheme.border,
          },
        ]}
      >
        <View style={[styles.announcementHeader, isRtl && styles.rowReverse]}>
          <Text style={[styles.announcementMasjid, { color: colors.primary }]}>
            🕌 {ann.mosque_name || 'Masjid'}
          </Text>
          <Text style={[styles.announcementDate, { color: currentTheme.textMuted }]}>
            {dateLabel}
          </Text>
        </View>

        {ann.category_name && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{ann.category_name}</Text>
          </View>
        )}

        <Text
          numberOfLines={2}
          style={[styles.announcementTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}
        >
          {ann.title}
        </Text>

        <Text
          numberOfLines={3}
          style={[styles.announcementContent, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}
        >
          {ann.description}
        </Text>

        <View style={[styles.announcementFooter, isRtl && styles.rowReverse]}>
          <TouchableOpacity
            style={[styles.readMoreBtn, { borderColor: colors.primaryBorder }]}
            onPress={() => setSelectedAnnouncement(ann)}
          >
            <Text style={styles.readMoreText}>
              {isRtl ? 'مزید پڑھیں' : 'Read Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* ── Segmented Tab Header ── */}
      <View style={[styles.tabBar, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'hadees' && styles.activeTabItem]}
          onPress={() => setActiveTab('hadees')}
        >
          <BookOpen size={18} color={activeTab === 'hadees' ? colors.primary : currentTheme.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'hadees' ? colors.primary : currentTheme.textMuted }]}>
            {isRtl ? 'احادیث' : 'Hadees'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'announcements' && styles.activeTabItem]}
          onPress={() => setActiveTab('announcements')}
        >
          <Bell size={18} color={activeTab === 'announcements' ? colors.primary : currentTheme.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'announcements' ? colors.primary : currentTheme.textMuted }]}>
            {isRtl ? 'اعلانات' : 'Announcements'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >

        {/* ── HADEES TAB ── */}
        {activeTab === 'hadees' && (
          <View>
            {hadithLoading && hadithList.length === 0 ? (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.stateText, { color: currentTheme.textMuted }]}>
                  {isRtl ? 'احادیث لوڈ ہو رہی ہیں…' : 'Loading hadith…'}
                </Text>
              </View>
            ) : hadithError ? (
              <View style={[styles.errorCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                <AlertCircle size={36} color={colors.danger} />
                <Text style={[styles.stateText, { color: colors.danger }]}>{hadithError}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primaryLight }]} onPress={() => loadHadith(true)}>
                  <RefreshCw size={14} color={colors.primary} />
                  <Text style={[styles.retryBtnText, { color: colors.primary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : hadithList.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                <BookOpen size={48} color={currentTheme.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
                  {isRtl ? 'کوئی حدیث دستیاب نہیں' : 'No hadith available'}
                </Text>
              </View>
            ) : (
              hadithList.map((item) => (
                <View key={item.id} style={{ marginBottom: spacing.md }}>
                  {renderHadithCard(item)}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── ANNOUNCEMENTS TAB ── */}
        {activeTab === 'announcements' && (
          <View>
            {annLoading && announcementList.length === 0 ? (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.stateText, { color: currentTheme.textMuted }]}>
                  {isRtl ? 'اعلانات لوڈ ہو رہے ہیں…' : 'Loading announcements…'}
                </Text>
              </View>
            ) : annError ? (
              <View style={[styles.errorCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                <AlertCircle size={36} color={colors.danger} />
                <Text style={[styles.stateText, { color: colors.danger }]}>{annError}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primaryLight }]} onPress={() => loadAnnouncements(true)}>
                  <RefreshCw size={14} color={colors.primary} />
                  <Text style={[styles.retryBtnText, { color: colors.primary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : announcementList.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                <Bell size={48} color={currentTheme.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
                  {isRtl ? 'اس وقت کوئی اعلانات دستیاب نہیں ہیں۔' : 'No announcements available at this time.'}
                </Text>
              </View>
            ) : (
              announcementList.map((ann) => renderAnnouncementCard(ann))
            )}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Announcement Detail Modal ── */}
      {selectedAnnouncement && (
        <Modal
          animationType="slide"
          transparent
          visible={!!selectedAnnouncement}
          onRequestClose={() => setSelectedAnnouncement(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: currentTheme.surface }]}>
              <View style={[styles.modalHeader, isRtl && styles.rowReverse]}>
                <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                  <ArrowLeft size={24} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: currentTheme.text }]}>
                  {isRtl ? 'اعلان کی تفصیل' : 'Announcement Detail'}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalScrollContent}>
                <Text style={[styles.modalMasjid, { color: colors.primary }]}>
                  🕌 {selectedAnnouncement.mosque_name || 'Masjid'}
                </Text>

                {selectedAnnouncement.category_name && (
                  <View style={[styles.categoryBadge, { marginBottom: spacing.sm }]}>
                    <Text style={styles.categoryBadgeText}>{selectedAnnouncement.category_name}</Text>
                  </View>
                )}

                {selectedAnnouncement.event_date && (
                  <Text style={[styles.modalDate, { color: currentTheme.textMuted }]}>
                    📅 {isRtl ? 'تاریخ:' : 'Date:'}{' '}
                    {new Date(selectedAnnouncement.event_date).toLocaleDateString(isRtl ? 'ur-PK' : 'en-US', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                    {selectedAnnouncement.event_time && ` · ${selectedAnnouncement.event_time}`}
                  </Text>
                )}

                <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />

                <Text style={[styles.modalTitleText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  {selectedAnnouncement.title}
                </Text>

                <Text style={[styles.modalBodyText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  {selectedAnnouncement.description}
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.closeBtn, { borderColor: currentTheme.border }]}
                  onPress={() => setSelectedAnnouncement(null)}
                >
                  <Text style={[styles.closeBtnText, { color: currentTheme.text }]}>
                    {isRtl ? 'بند کریں' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    height: 50,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: { borderBottomColor: colors.primary },
  tabText: { fontSize: typography.sizes.sm, fontWeight: 'bold' },
  scrollContent: { padding: spacing.md },
  sectionTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  hadithCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hadithRefLabel: { fontSize: typography.sizes.xs, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: spacing.sm },
  arabicHadith: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 28,
    marginVertical: spacing.sm,
  },
  cardDivider: { height: 1, marginVertical: spacing.sm, opacity: 0.12 },
  translationHadith: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  hadithRef: { fontSize: typography.sizes.xs - 1, fontStyle: 'italic', marginBottom: spacing.sm },
  hadithActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: spacing.borderRadiusRound,
  },
  actionBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  announcementCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  announcementMasjid: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  announcementDate: { fontSize: typography.sizes.xs - 1 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  categoryBadgeText: { color: colors.primary, fontSize: 9, fontWeight: 'bold' },
  announcementTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  announcementContent: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  readMoreBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: spacing.borderRadiusRound,
    borderWidth: 1,
  },
  readMoreText: { color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  centeredState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  stateText: { fontSize: typography.sizes.sm, textAlign: 'center' },
  errorCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: spacing.borderRadiusRound,
  },
  retryBtnText: { fontSize: typography.sizes.xs, fontWeight: 'bold' },
  emptyCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyIcon: { marginBottom: spacing.md },
  emptyText: { fontSize: typography.sizes.sm, textAlign: 'center' },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: spacing.lg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  modalHeaderTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  modalScrollContent: { padding: spacing.lg },
  modalMasjid: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginBottom: 4 },
  modalDate: { fontSize: typography.sizes.xs, marginBottom: spacing.sm },
  modalTitleText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  modalBodyText: { fontSize: typography.sizes.sm + 1, lineHeight: 22, marginBottom: spacing.xl },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  closeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontWeight: 'bold' },
  rowReverse: { flexDirection: 'row-reverse' },
  bottomSpacer: { height: 80 },
});
