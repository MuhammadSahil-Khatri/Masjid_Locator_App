import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { Announcement } from '../../types';

interface AnnouncementCardProps {
  announcement: Announcement;
  isDark: boolean;
  isRtl: boolean;
  translations: any;
  onRead: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  isDark,
  isRtl,
  translations,
  onRead,
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;
  const isHigh = announcement.priority === 'high';

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: currentTheme.card,
        borderColor: currentTheme.border,
      },
      !announcement.isRead && styles.unreadBorder
    ]}>
      <View style={[styles.headerRow, isRtl && styles.rowReverse]}>
        <View style={[
          styles.priorityBadge,
          isHigh ? styles.badgeHigh : styles.badgeNormal
        ]}>
          <Text style={[styles.badgeText, isHigh ? { color: colors.danger } : { color: colors.warning }]}>
            {isHigh ? translations.highPriority : translations.normalPriority}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: currentTheme.textMuted }]}>
          {announcement.date}
        </Text>
      </View>

      <Text style={[
        styles.title, 
        { color: currentTheme.text },
        isRtl && typography.alignRtl
      ]}>
        {isRtl ? announcement.titleUr : announcement.titleEn}
      </Text>

      <Text style={[
        styles.content, 
        { color: currentTheme.textMuted },
        isRtl && typography.alignRtl
      ]}>
        {isRtl ? announcement.contentUr : announcement.contentEn}
      </Text>

      <View style={[styles.footerRow, isRtl && styles.rowReverse]}>
        <Text style={[styles.masjidRef, { color: colors.primary }]}>
          🕌 {announcement.masjidName}
        </Text>

        {!announcement.isRead && (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={onRead}
          >
            <Bell size={10} color="#10b981" />
            <Text style={styles.markReadText}>{translations.markRead}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  unreadBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  badgeNormal: {
    backgroundColor: colors.warningLight,
  },
  badgeHigh: {
    backgroundColor: colors.dangerLight,
  },
  badgeText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
  },
  dateText: {
    fontSize: typography.sizes.xs,
  },
  title: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  content: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masjidRef: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.primaryLight,
  },
  markReadText: {
    color: colors.primary,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
