import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
  Modal,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Copy, Share2, BookOpen, Quote, Bell, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';

export const HadeesScreen: React.FC = () => {
  const {
    hadeesList,
    announcements,
    handleAnnounceRead,
    highContrast: isDark,
    isRtl,
    translations,
    triggerToast,
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const [activeTab, setActiveTab] = useState<'hadees' | 'announcements'>('hadees');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  // --- HADEES FUNCTIONS ---
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

  const featuredHadith = hadeesList && hadeesList.length > 0 ? hadeesList[0] : null;
  const otherHadiths = hadeesList && hadeesList.length > 1 ? hadeesList.slice(1) : [];

  const renderHadithItem = ({ item }: { item: typeof hadeesList[0] }) => (
    <View style={[styles.hadithCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
      <View style={[styles.hadithHeader, isRtl && styles.rowReverse]}>
        <Quote size={20} color={colors.primary} />
        <Text style={[styles.hadithRefLabel, { color: currentTheme.textMuted }]}>
          {item.source}
        </Text>
      </View>

      <Text style={styles.arabicHadith}>{item.textAr}</Text>
      <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />
      <Text style={[styles.translationHadith, { color: currentTheme.text }]}>
        {isRtl ? item.textUr : item.textEn}
      </Text>

      <Text style={[styles.hadithRef, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
        📌 {translations.reference || 'Reference'}: {isRtl ? item.referenceUr : item.referenceEn}
      </Text>

      <View style={[styles.hadithActionsRow, isRtl && styles.rowReverse]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleCopyHadees(item.textAr, isRtl ? item.textUr : item.textEn, isRtl ? item.referenceUr : item.referenceEn)}
        >
          <Copy size={14} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            {isRtl ? 'کاپی' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleShareHadees(isRtl ? item.textUr : item.textEn, isRtl ? item.referenceUr : item.referenceEn, item.source)}
        >
          <Share2 size={14} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            {isRtl ? 'شیر' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- ANNOUNCEMENT RENDER ---
  const renderAnnouncementCard = (ann: typeof announcements[0]) => {
    const isUnread = !ann.isRead;
    const isHighPriority = ann.priority === 'high';

    return (
      <View
        key={ann.id}
        style={[
          styles.announcementCard,
          {
            backgroundColor: currentTheme.card,
            borderColor: isUnread ? colors.primary : currentTheme.border,
            borderLeftWidth: isUnread ? 4 : 1,
          },
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

        <View style={[styles.titleRow, isRtl && styles.rowReverse]}>
          {isHighPriority && (
            <View style={[styles.priorityBadge, { backgroundColor: colors.dangerLight }]}>
              <AlertCircle size={10} color={colors.danger} />
              <Text style={[styles.priorityText, { color: colors.danger }]}>
                {isRtl ? translations.highPriority : 'Urgent'}
              </Text>
            </View>
          )}
          <Text
            numberOfLines={1}
            style={[styles.announcementTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}
          >
            {isRtl ? ann.titleUr : ann.titleEn}
          </Text>
        </View>

        <Text
          numberOfLines={2}
          style={[styles.announcementContent, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}
        >
          {isRtl ? ann.contentUr : ann.contentEn}
        </Text>

        <View style={[styles.announcementFooter, isRtl && styles.rowReverse]}>
          {isUnread && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadText}>New</Text>
            </View>
          )}
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
      {/* Segmented Tab Header */}
      <View style={[styles.tabBar, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'hadees' && styles.activeTabItem]}
          onPress={() => setActiveTab('hadees')}
        >
          <BookOpen size={18} color={activeTab === 'hadees' ? colors.primary : currentTheme.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'hadees' ? colors.primary : currentTheme.textMuted }]}>
            {translations.hadeesTab || 'Hadees'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'announcements' && styles.activeTabItem]}
          onPress={() => setActiveTab('announcements')}
        >
          <Bell size={18} color={activeTab === 'announcements' ? colors.primary : currentTheme.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'announcements' ? colors.primary : currentTheme.textMuted }]}>
            {translations.announcementsTab || 'Announcements'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'hadees' ? (
          /* --- HADEES TAB CONTENT --- */
          <View>
            {featuredHadith && (
              <View style={styles.featuredSection}>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  🌟 {isRtl ? 'آج کی منتخب حدیث' : 'Hadith of the Day'}
                </Text>
                {renderHadithItem({ item: featuredHadith })}
              </View>
            )}

            {otherHadiths.length > 0 && (
              <View style={styles.listSection}>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  📚 {isRtl ? 'مزید احادیث مبارکہ' : 'Explore More Ahadees'}
                </Text>
                {otherHadiths.map((item) => (
                  <View key={item.id} style={{ marginBottom: spacing.md }}>
                    {renderHadithItem({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* --- ANNOUNCEMENTS TAB CONTENT --- */
          <View>
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => renderAnnouncementCard(ann))
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                <Bell size={48} color={currentTheme.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
                  {isRtl ? 'اس وقت کوئی اعلانات دستیاب نہیں ہیں۔' : 'No announcements available at this time.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal for Announcements */}
      {selectedAnnouncement && (
        <Modal
          animationType="slide"
          transparent={true}
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
                  🕌 {selectedAnnouncement.masjidName}
                </Text>
                <Text style={[styles.modalDate, { color: currentTheme.textMuted }]}>
                  Posted: {selectedAnnouncement.date}
                </Text>

                <View style={[styles.cardDivider, { backgroundColor: currentTheme.border }]} />

                <Text style={[styles.modalTitleText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  {isRtl ? selectedAnnouncement.titleUr : selectedAnnouncement.titleEn}
                </Text>

                <Text style={[styles.modalBodyText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  {isRtl ? selectedAnnouncement.contentUr : selectedAnnouncement.contentEn}
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                {selectedAnnouncement.isRead === false && (
                  <TouchableOpacity
                    style={[styles.markReadBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      handleAnnounceRead(selectedAnnouncement.id);
                      setSelectedAnnouncement(null);
                    }}
                  >
                    <Text style={styles.markReadBtnText}>
                      {translations.markRead || 'Mark as Read'}
                    </Text>
                  </TouchableOpacity>
                )}
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
      <View style={styles.bottomSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  activeTabItem: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.md,
  },
  featuredSection: {
    marginBottom: spacing.lg,
  },
  listSection: {
    marginBottom: spacing.huge,
  },
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
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hadithRefLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  arabicHadith: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 26,
    marginVertical: spacing.sm,
  },
  cardDivider: {
    height: 1,
    marginVertical: spacing.sm,
    opacity: 0.1,
  },
  translationHadith: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  hadithRef: {
    fontSize: typography.sizes.xs - 1,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
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
  actionBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  announcementCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  announcementMasjid: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  announcementDate: {
    fontSize: typography.sizes.xs - 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  announcementTitle: {
    flex: 1,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  announcementContent: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  readMoreBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: spacing.borderRadiusRound,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  readMoreText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  emptyCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  modalHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  modalScrollContent: {
    padding: spacing.lg,
  },
  modalMasjid: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  modalDate: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.sm,
  },
  modalTitleText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  modalBodyText: {
    fontSize: typography.sizes.sm + 1,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  markReadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  closeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontWeight: 'bold',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  bottomSpacer: {
    height: 80,
  },
});
