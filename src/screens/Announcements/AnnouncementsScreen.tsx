import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Bell, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';

export const AnnouncementsScreen: React.FC = () => {
  const {
    announcements,
    handleAnnounceRead,
    highContrast: isDark,
    isRtl,
    translations,
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

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
      <View style={[styles.header, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          📢 {isRtl ? translations.announcements : 'Announcements Feed'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
      </ScrollView>

      {/* Detail Modal */}
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
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: spacing.md,
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
  cardDivider: {
    height: 1,
    marginVertical: spacing.md,
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
