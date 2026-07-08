import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { MapPin, ChevronRight, Compass } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useSearchMosques } from '../../hooks/useSearchMosques';

export const NearestMosquesScreen: React.FC = () => {
  const { isRtl, highContrast: isDark } = useApp();
  const { navigate } = useNavigation();
  const themeColors = isDark ? colors.dark : colors.light;

  const { location } = useUserLocation();
  const { mosques } = useSearchMosques(location);

  const handleRowPress = (mosqueId: string) => {
    navigate('Search', { selectMasjidId: mosqueId });
  };

  const renderMosqueRow = ({ item }: { item: any }) => {
    const distanceText = typeof item.distance === 'number'
      ? `${item.distance.toFixed(1)} km`
      : '';

    return (
      <TouchableOpacity
        style={[
          styles.rowContainer,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
          isRtl && styles.rowReverse,
        ]}
        onPress={() => handleRowPress(item.id)}
        activeOpacity={0.7}
      >
        {/* Mosque Image or Placeholder */}
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.mosqueImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: 'rgba(246, 139, 53, 0.1)' }]}>
              <Text style={styles.placeholderEmoji}>🕌</Text>
            </View>
          )}
        </View>

        {/* Mosque Details */}
        <View style={[styles.detailsContainer, isRtl && styles.alignRight]}>
          <Text
            style={[styles.mosqueName, { color: themeColors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.mosqueAddress, { color: themeColors.textMuted }]}
            numberOfLines={1}
          >
            {item.address}
          </Text>
          <View style={[styles.metaRow, isRtl && styles.rowReverse]}>
            <Text style={[styles.mosqueCity, { color: themeColors.textMuted }]}>
              {item.city}
            </Text>
            {distanceText ? (
              <>
                <Text style={[styles.separator, { color: themeColors.textMuted }]}>•</Text>
                <View style={[styles.distancePill, isRtl && styles.rowReverse]}>
                  <MapPin size={10} color={colors.primary} />
                  <Text style={styles.distanceText}>{distanceText}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Action Button/Arrow */}
        <View style={styles.arrowContainer}>
          <ChevronRight
            size={18}
            color={themeColors.textMuted}
            style={isRtl && { transform: [{ rotate: '180deg' }] }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.offWhite }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }, isRtl && styles.rowReverse]}>
        <Text style={[styles.headerTitle, { color: '#000000' }]}>
          {isRtl ? 'قریبی مساجد' : 'Nearest Mosques'}
        </Text>
      </View>

      {mosques.length > 0 ? (
        <FlatList
          data={mosques.slice(0, 10)}
          keyExtractor={(item) => item.id}
          renderItem={renderMosqueRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Compass size={48} color={themeColors.textMuted} />
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            {isRtl
              ? 'کوئی قریبی مساجد کیش میں نہیں ملی۔ مقام معلوم کرنے کے لیے نقشہ کھولیں۔'
              : 'No nearby mosques in cache. Please open the Map tab to detect your location.'}
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    marginRight: spacing.sm,
  },
  mosqueImage: {
    width: 50,
    height: 50,
    borderRadius: spacing.borderRadiusMd,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: spacing.borderRadiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  mosqueName: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  mosqueAddress: {
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mosqueCity: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  separator: {
    fontSize: typography.sizes.xs,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 80,
  },
});
export default NearestMosquesScreen;
