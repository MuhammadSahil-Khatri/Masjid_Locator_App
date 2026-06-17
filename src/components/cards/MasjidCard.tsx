import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Shield, Navigation, Heart } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { Masjid } from '../../types';

interface MasjidCardProps {
  masjid: Masjid;
  isDark: boolean;
  isRtl: boolean;
  translations: any;
  onPress: () => void;
  onDirectionsPress?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export const MasjidCard: React.FC<MasjidCardProps> = ({
  masjid,
  isDark,
  isRtl,
  translations,
  onPress,
  onDirectionsPress,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.card,
          borderColor: currentTheme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: masjid.image }} style={styles.image} />
      
      {/* Verify & Favorite Floating Actions */}
      <View style={styles.floatingHeader}>
        {masjid.isVerified ? (
          <View style={styles.verifiedBadge}>
            <Shield size={10} color="#ffffff" fill="#10b981" />
            <Text style={styles.verifiedText}>{translations.verifiedBadge}</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{translations.notVerifiedBadge}</Text>
          </View>
        )}

        {onFavoriteToggle && (
          <TouchableOpacity 
            style={[styles.favoriteBtn, { backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)' }]}
            onPress={onFavoriteToggle}
          >
            <Heart size={14} color={isFavorite ? '#ef4444' : currentTheme.text} fill={isFavorite ? '#ef4444' : 'transparent'} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[
          styles.name, 
          { color: currentTheme.text },
          isRtl && typography.alignRtl
        ]}>
          {isRtl ? masjid.nameUr : masjid.nameEn}
        </Text>

        <Text style={[
          styles.address, 
          { color: currentTheme.textMuted },
          isRtl && typography.alignRtl
        ]}>
          {isRtl ? masjid.addressUr : masjid.addressEn}
        </Text>

        <View style={[styles.metaRow, isRtl && styles.rowReverse]}>
          <View style={[styles.metaItem, isRtl && styles.rowReverse]}>
            <Text style={[styles.metaLabel, { color: currentTheme.textMuted }]}>
              {translations.distance}:
            </Text>
            <Text style={[styles.metaValue, { color: currentTheme.text }]}>
              {masjid.distance} km
            </Text>
          </View>

          <View style={[styles.metaItem, isRtl && styles.rowReverse]}>
            <Text style={[styles.metaLabel, { color: currentTheme.textMuted }]}>
              {translations.capacity}:
            </Text>
            <Text style={[styles.metaValue, { color: currentTheme.text }]}>
              {masjid.capacity}
            </Text>
          </View>
        </View>

        {onDirectionsPress && (
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={onDirectionsPress}
          >
            <Navigation size={12} color="#ffffff" fill="#ffffff" />
            <Text style={styles.directionsText}>{translations.getDirections}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    height: 120,
    width: '100%',
  },
  floatingHeader: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
    gap: 4,
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  pendingText: {
    color: '#ffffff',
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
  },
  favoriteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.sizes.xs,
  },
  metaValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  directionsBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.touchTargetMin,
    borderRadius: spacing.borderRadiusSm,
    gap: spacing.sm,
  },
  directionsText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
