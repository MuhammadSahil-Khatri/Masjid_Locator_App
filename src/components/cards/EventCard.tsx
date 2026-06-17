import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Users } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { MasjidEvent } from '../../types';

interface EventCardProps {
  event: MasjidEvent;
  isDark: boolean;
  isRtl: boolean;
  translations: any;
  onRsvpToggle: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isDark,
  isRtl,
  translations,
  onRsvpToggle,
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;
  const isGoing = event.rsvpStatus === 'going';

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: currentTheme.card,
        borderColor: currentTheme.border,
      }
    ]}>
      {/* Category header */}
      <View style={[styles.headerRow, isRtl && styles.rowReverse]}>
        <View style={[
          styles.badge,
          event.category === 'janaza' ? styles.badgeJanaza : styles.badgeNormal
        ]}>
          <Text style={styles.badgeText}>
            {event.category.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.masjidRef, { color: colors.primary }]}>
          🕌 {event.masjidName}
        </Text>
      </View>

      <Text style={[
        styles.title, 
        { color: currentTheme.text },
        isRtl && typography.alignRtl
      ]}>
        {isRtl ? event.titleUr : event.titleEn}
      </Text>

      <Text style={[
        styles.description, 
        { color: currentTheme.textMuted },
        isRtl && typography.alignRtl
      ]}>
        {isRtl ? event.descriptionUr : event.descriptionEn}
      </Text>

      {/* Date & RSVP counter */}
      <View style={[styles.detailsRow, isRtl && styles.rowReverse]}>
        <View style={[styles.detailItem, isRtl && styles.rowReverse]}>
          <Calendar size={12} color={currentTheme.textMuted} />
          <Text style={[styles.detailText, { color: currentTheme.text }]}>
            {event.date} • {event.time}
          </Text>
        </View>

        <View style={[styles.detailItem, isRtl && styles.rowReverse]}>
          <Users size={12} color={currentTheme.textMuted} />
          <Text style={[styles.detailText, { color: currentTheme.text }]}>
            {event.rsvpCount} going
          </Text>
        </View>
      </View>

      {/* RSVP Action Button */}
      <TouchableOpacity
        style={[
          styles.rsvpBtn,
          isGoing ? styles.rsvpActive : { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 }
        ]}
        onPress={onRsvpToggle}
      >
        <Text style={[
          styles.rsvpText,
          isGoing ? { color: '#ffffff' } : { color: colors.primary }
        ]}>
          {isGoing ? translations.rsvpGoing : translations.rsvpBtn}
        </Text>
      </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  badgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeJanaza: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  masjidRef: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm - 1,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.sizes.xs,
  },
  rsvpBtn: {
    height: spacing.touchTargetMin,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpActive: {
    backgroundColor: colors.primary,
  },
  rsvpText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
