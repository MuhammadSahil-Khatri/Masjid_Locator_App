import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Text } from '../ui/Text';
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
  isSelected?: boolean;
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
  isSelected = false,
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : currentTheme.card,
          borderColor: isSelected ? colors.primary : currentTheme.border,
          borderWidth: isSelected ? 2 : 1,
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
            <Text style={[styles.metaValue, { color: currentTheme.text, fontSize: typography.sizes.sm }]}>
              {masjid.distance < 1000 
                ? `${masjid.distance} m` 
                : `${(masjid.distance / 1000).toFixed(1)} km`}
              {' • '}
              {Math.max(1, Math.ceil(masjid.distance / 80))} min walk
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <TouchableOpacity
            style={[styles.directionsBtn, { flex: 1, backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
            onPress={() => Linking.openURL(`google.navigation:q=${masjid.lat},${masjid.lng}`)}
          >
            <Navigation size={12} color={currentTheme.text} />
            <Text style={[styles.directionsText, { color: currentTheme.text }]}>Directions</Text>
          </TouchableOpacity>

          {onDirectionsPress && (
            <TouchableOpacity
              style={[styles.directionsBtn, { flex: 1 }]}
              onPress={onDirectionsPress}
            >
              <Text style={styles.directionsText}>More Info</Text>
            </TouchableOpacity>
          )}
        </View>
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
