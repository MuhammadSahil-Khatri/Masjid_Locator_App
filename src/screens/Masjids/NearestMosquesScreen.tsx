import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ChevronLeft, ChevronRight, X, Compass } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useNearestMosques } from '../../hooks/useNearestMosques';
import { AnimatedBottomSheet } from '../../components/ui/AnimatedBottomSheet';
import { MosqueBottomSheet } from '../../components/mosque/MosqueBottomSheet';

// ─── SVG Control Icons ─────────────────────────────────────────────────────────

const LocationPinIcon = ({ color = '#03BECD', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (14 / 10)} viewBox="0 0 10 14" fill="none">
    <Path
      d="M5 0C2.23858 0 0 2.23858 0 5C0 8.75 5 14 5 14C5 14 10 8.75 10 5C10 2.23858 7.76142 0 5 0ZM5 6.75C4.0335 6.75 3.25 5.9665 3.25 5C3.25 4.0335 4.0335 3.25 5 3.25C5.9665 3.25 6.75 4.0335 6.75 5C6.75 5.9665 5.9665 6.75 5 6.75Z"
      fill={color}
    />
  </Svg>
);

export const NearestMosquesScreen: React.FC = () => {
  const { isRtl } = useApp();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = colors.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMosque, setSelectedMosque] = useState<any | null>(null);
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  const { location } = useUserLocation();
  // Fetch and cache strictly the top 10 nearest mosques
  const { mosques, loading, refetch } = useNearestMosques(location);

  const handleRowPress = useCallback((mosque: any) => {
    setSelectedMosque(mosque);
    setBottomSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setBottomSheetVisible(false);
    setSelectedMosque(null);
  }, []);

  const handleOpenMaps = useCallback(async () => {
    if (!selectedMosque) return;
    const { latitude: lat, longitude: lng } = selectedMosque;
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?q=${lat},${lng}&daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    try {
      const supported = await Linking.canOpenURL(googleMapsUrl);
      await Linking.openURL(supported ? googleMapsUrl : fallbackUrl);
    } catch {
      Linking.openURL(fallbackUrl);
    }
  }, [selectedMosque]);

  // Filtered mosques based on search query (within top 10)
  const filteredMosques = useMemo(() => {
    if (!searchQuery.trim()) return mosques;
    const q = searchQuery.toLowerCase().trim();
    return mosques.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q),
    );
  }, [mosques, searchQuery]);

  const renderMosqueCard = ({ item }: { item: any }) => {
    const distanceText =
      typeof item.distance === 'number' ? `${item.distance.toFixed(1)}km` : '';

    return (
      <TouchableOpacity
        style={[styles.card]}
        onPress={() => handleRowPress(item)}
        activeOpacity={0.85}
      >
        {/* Mosque Thumbnail */}
        <View style={styles.imageWrapper}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.mosqueImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderWrapper}>
              <Text style={styles.placeholderEmoji}>🕌</Text>
            </View>
          )}
        </View>

        {/* Mosque Details */}
        <View style={[styles.infoWrapper, isRtl && styles.alignRight]}>
          <Text style={styles.mosqueName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.mosqueAddress} numberOfLines={1}>
            {item.address || 'Mosque Area'}
          </Text>

          <View style={[styles.metaRow]}>
            <Text style={styles.cityName} numberOfLines={1}>
              {item.city || 'Detected City'}
            </Text>

            {distanceText ? (
              <View style={[styles.distanceBadge]}>
                <LocationPinIcon size={11} color={colors.primary} />
                <Text style={styles.distanceText}>{distanceText}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Chevron Right */}
        <View style={styles.chevronWrapper}>
          <ChevronRight
            size={22}
            color="#1D3B6D"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Top Header Section with Floating Search Pill ── */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        <View style={styles.pillContainer}>
          {/* Back Arrow */}
          <TouchableOpacity style={styles.searchIconBtn} onPress={goBack}>
            <ChevronLeft size={36} color="#1D3B6D" />
          </TouchableOpacity>

          {/* Search Input */}
          <TextInput
            style={[styles.searchInput, isRtl && styles.textRtl]}
            placeholder={isRtl ? 'قریبی مساجد تلاش کریں' : 'Nearby Masjid'}
            placeholderTextColor="#afb0b185"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />

          {/* Clear or Filter Button */}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#1D3B6D" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Main Rounded Container with List ── */}
      <View style={styles.mainContainer}>
        {loading && mosques.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Finding nearby mosques…</Text>
          </View>
        ) : filteredMosques.length > 0 ? (
          <FlatList
            data={filteredMosques}
            keyExtractor={(item) => item.id}
            renderItem={renderMosqueCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={loading}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Compass size={44} color="#8C9199" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Mosques Found' : 'No Nearby Mosques'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try searching with a different mosque name or area.'
                : 'Unable to find mosques near your location. Please check your GPS location.'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Dimmed Backdrop Overlay when Bottom Sheet is active ── */}
      {isBottomSheetVisible && (
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={handleCloseSheet}
          accessibilityLabel="Dismiss bottom sheet"
        />
      )}

      {/* ── Mosque Details Bottom Sheet ── */}
      <AnimatedBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={handleCloseSheet}
        backgroundColor={theme.surface}
        snapPoint={560}
      >
        {selectedMosque && (
          <MosqueBottomSheet
            mosque={selectedMosque}
            isRtl={isRtl}
            theme={theme}
            onOpenMaps={handleOpenMaps}
            onClose={handleCloseSheet}
          />
        )}
      </AnimatedBottomSheet>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // ── Header & Search Bar ──────────────────────────────────────────────────────
  headerWrapper: {
    paddingBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 50,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  searchIconBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    letterSpacing: 0.2,
    paddingVertical: 0,
  },
  textRtl: {
    textAlign: 'right',
  },
  filterBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  // ── Main White Container ───────────────────────────────────────────────────
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff1f',
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 5,
    overflow: 'hidden',
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: spacing.xxl,
    gap: 12,
  },

  // ── Mosque Card ──────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#88E2EB',
    padding: 12,
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#03BECD',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#03BECD',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
    }),
  },
  alignRight: {
    alignItems: 'flex-end',
  },

  // ── Thumbnail ────────────────────────────────────────────────────────────────
  imageWrapper: {
    marginRight: 12,
  },
  mosqueImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  placeholderWrapper: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: 'rgba(3, 190, 205, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 24,
  },

  // ── Info Details ─────────────────────────────────────────────────────────────
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  mosqueName: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: '#1D3B6D',
    marginBottom: 2,
  },
  mosqueAddress: {
    fontSize: typography.sizes.xs,
    color: '#8C9199',
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityName: {
    fontSize: typography.sizes.xs,
    color: '#1D3B6D',
    fontWeight: typography.weights.semibold,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },

  // ── Chevron ──────────────────────────────────────────────────────────────────
  chevronWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },

  // ── State Screens ────────────────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: '#8C9199',
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: '#1D3B6D',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: '#8C9199',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },

  // ── Dimmed Backdrop for Bottom Sheet ─────────────────────────────────────────
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 50,
  },
});

export default NearestMosquesScreen;
