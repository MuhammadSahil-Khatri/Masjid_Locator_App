import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {
  Search,
  SlidersHorizontal,
  X,
  Compass,
  MapPin,
  Map,
  Users,
  RefreshCw,
} from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useAuth } from '../../hooks/useAuth';
import { AnimatedBottomSheet } from '../../components/ui/AnimatedBottomSheet';
import { useSearchMosques } from '../../hooks/useSearchMosques';

// ─── Constants outside component to avoid recreation every render ──────────────

const SCREEN_WIDTH = Dimensions.get('window').width;

const customMapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

const DEFAULT_REGION_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };
const MOSQUE_ZOOM_DELTA = { latitudeDelta: 0.005, longitudeDelta: 0.005 };
const USER_ZOOM_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

interface FilterState {
  cities: string[];
  capacityMin: string;
  capacityMax: string;
}

const EMPTY_FILTER: FilterState = { cities: [], capacityMin: '', capacityMax: '' };

// ─── UserLocationMarker ────────────────────────────────────────────────────────
const UserLocationMarker = memo(() => (
  <View style={styles.userMarker}>
    <View style={styles.userMarkerPulse} />
    <View style={styles.userMarkerCore} />
  </View>
));

// ─── MasjidMarker ──────────────────────────────────────────────────────────────
interface MasjidMarkerProps {
  id: string;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const MasjidMarker = memo(
  ({ id, latitude, longitude, isSelected, onPress }: MasjidMarkerProps) => {
    // Dynamic tracksViewChanges state for performance & Android rendering correctness
    const [tracksView, setTracksView] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => setTracksView(false), 500);
      return () => clearTimeout(timer);
    }, []);

    const coordinate = useMemo(
      () => ({ latitude, longitude }),
      [latitude, longitude]
    );

    const handlePress = useCallback(() => {
      onPress(id);
    }, [id, onPress]);

    return (
      <Marker
        coordinate={coordinate}
        onPress={handlePress}
        zIndex={isSelected ? 10 : 1}
        tracksViewChanges={tracksView}
      >
        <View style={styles.mosqueMarkerContainer}>
          <View
            style={[
              styles.mosqueMarker,
              isSelected ? styles.mosqueMarkerSelected : styles.mosqueMarkerNormal,
            ]}
          >
            <Text style={styles.mosqueMarkerEmoji}>🕌</Text>
          </View>
        </View>
      </Marker>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.id === next.id &&
    prev.latitude === next.latitude &&
    prev.longitude === next.longitude
);

// ─── MosqueBottomSheet ─────────────────────────────────────────────────────────
interface MosqueBottomSheetProps {
  mosque: any;
  isRtl: boolean;
  theme: typeof colors.light;
  onOpenMaps: () => void;
}

const MosqueBottomSheet = memo(
  ({ mosque, isRtl, theme, onOpenMaps }: MosqueBottomSheetProps) => (
    <View style={styles.sheetWrapper}>
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.mosqueDetailsContainer}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            {mosque.name}
          </Text>

          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={[styles.addressText, { color: theme.textMuted }]}>
              {mosque.address}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Map size={16} color={colors.brown} style={styles.infoIcon} />
            <Text style={[styles.cityText, { color: theme.text }]}>
              {mosque.city}
            </Text>
          </View>

          {mosque.capacity ? (
            <View style={styles.capacitySection}>
              <View style={styles.infoRow}>
                <Users size={16} color={colors.primary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.text, fontWeight: '600' }]}>
                  {isRtl ? 'نمازیوں کی گنجائش' : 'Capacity'}
                </Text>
              </View>
              <Text style={[styles.capacityValue, { color: theme.textMuted }]}>
                {isRtl ? `${mosque.capacity} افراد` : `${mosque.capacity} People`}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.openMapsBtn}
            onPress={onOpenMaps}
            activeOpacity={0.8}
            accessibilityLabel="Open mosque coordinates in Google Maps"
          >
            <Text style={styles.openMapsBtnText}>
              {isRtl ? 'گوگل میپس میں کھولیں' : 'Open in Google Maps'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
);

// ─── SearchScreen ──────────────────────────────────────────────────────────────
export const SearchScreen: React.FC = () => {
  const { isRtl } = useApp();
  const theme = colors.light;
  const { location, loading: locationLoading, refreshLocation } = useUserLocation();
  const mapRef = useRef<MapView | null>(null);

  const locationRef = useRef(location);
  useEffect(() => { locationRef.current = location; }, [location]);

  // ── States ───────────────────────────────────────────────────────────────────
  const { mosques, loading, error, refetch } = useSearchMosques();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER);
  const [tempFilters, setTempFilters] = useState<FilterState>(EMPTY_FILTER);
  const [selectedMosque, setSelectedMosque] = useState<any | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  // ── Debounce search input locally ─────────────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchText]);

  // ── Center map on user's GPS location whenever it resolves/updates ────────────
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.lat,
          longitude: location.lng,
          ...USER_ZOOM_DELTA,
        },
        600
      );
    }
  }, [location?.lat, location?.lng]);


  // ── Distinct cities ────────────────────────────────────────────────────────────
  const distinctCities = useMemo(() => {
    const citiesSet = new Set(mosques.map((m) => m.city).filter(Boolean));
    return Array.from(citiesSet).sort();
  }, [mosques]);

  // ── Filtered mosque list (Local Search & Filtering) ───────────────────────────
  const filteredMosques = useMemo(() => {
    console.time('[PERF] filteredMosques');
    let result = mosques;

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(term) ||
          m.address?.toLowerCase().includes(term) ||
          m.city?.toLowerCase().includes(term)
      );
    }

    if (filters.cities.length > 0) {
      result = result.filter((m) => m.city && filters.cities.includes(m.city));
    }

    const capMin = filters.capacityMin ? parseInt(filters.capacityMin, 10) : NaN;
    const capMax = filters.capacityMax ? parseInt(filters.capacityMax, 10) : NaN;
    if (!isNaN(capMin)) result = result.filter((m) => m.capacity != null && m.capacity >= capMin);
    if (!isNaN(capMax)) result = result.filter((m) => m.capacity != null && m.capacity <= capMax);

    console.timeEnd('[PERF] filteredMosques');
    return result;
  }, [mosques, debouncedSearch, filters]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleClearSearch = useCallback(() => setSearchText(''), []);
  const handleRetryFetch = useCallback(() => refetch(), [refetch]);

  const handleMarkerPress = useCallback((mosqueId: string) => {
    console.time('[PERF] markerPress→sheetOpen');
    const mosque = mosques.find((m) => m.id === mosqueId);
    if (!mosque) return;

    if (selectedMosque && selectedMosque.id !== mosqueId) {
      setBottomSheetVisible(false);
      setTimeout(() => {
        setSelectedMosque(mosque);
        setBottomSheetVisible(true);
        mapRef.current?.animateToRegion(
          {
            latitude: mosque.latitude,
            longitude: mosque.longitude,
            ...MOSQUE_ZOOM_DELTA,
          },
          400
        );
      }, 100);
    } else {
      setSelectedMosque(mosque);
      setBottomSheetVisible(true);
      mapRef.current?.animateToRegion(
        {
          latitude: mosque.latitude,
          longitude: mosque.longitude,
          ...MOSQUE_ZOOM_DELTA,
        },
        400
      );
    }
    console.timeEnd('[PERF] markerPress→sheetOpen');
  }, [mosques, selectedMosque]);

  const handleRecenter = useCallback(() => {
    refreshLocation();
    const loc = locationRef.current;
    if (loc && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: loc.lat, longitude: loc.lng, ...USER_ZOOM_DELTA },
        400
      );
    }
  }, [refreshLocation]);

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

  const openFilterModal = useCallback(() => {
    setTempFilters({ ...filters });
    setShowFilterModal(true);
  }, [filters]);

  const toggleFilterCity = useCallback((city: string) => {
    setTempFilters((prev) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city],
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters({ ...tempFilters });
    setShowFilterModal(false);
  }, [tempFilters]);

  const clearFilters = useCallback(() => {
    setTempFilters(EMPTY_FILTER);
    setFilters(EMPTY_FILTER);
    setShowFilterModal(false);
  }, []);

  const closeFilterModal = useCallback(() => setShowFilterModal(false), []);

  const hasActiveFilters = useMemo(
    () =>
      filters.cities.length > 0 ||
      filters.capacityMin !== '' ||
      filters.capacityMax !== '',
    [filters]
  );

  const initialRegion = useMemo(
    () =>
      location
        ? {
          latitude: location.lat,
          longitude: location.lng,
          ...DEFAULT_REGION_DELTA,
        }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.lat, location?.lng]
  );

  const userCoordinate = useMemo(
    () => (location ? { latitude: location.lat, longitude: location.lng } : null),
    [location?.lat, location?.lng]
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
        >
          <Search size={16} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={
              isRtl
                ? 'مسجد، شہر یا پتہ تلاش کریں...'
                : 'Search mosque, city or address...'
            }
            placeholderTextColor={theme.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            clearButtonMode="while-editing"
            accessibilityLabel="Search input field"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearBtn}
              accessibilityLabel="Clear search input"
            >
              <X size={14} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          activeOpacity={0.8}
          onPress={openFilterModal}
          accessibilityLabel="Filter options button"
        >
          <SlidersHorizontal
            size={20}
            color={hasActiveFilters ? '#ffffff' : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Active Filters Bar ── */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            {isRtl ? 'فلٹر فعال ہیں' : 'Filters Active'} · {filteredMosques.length}{' '}
            {isRtl ? 'نتائج ملے' : filteredMosques.length === 1 ? 'Result' : 'Results'}
          </Text>
          <TouchableOpacity onPress={clearFilters} accessibilityLabel="Clear all filters">
            <Text style={styles.clearFiltersBtn}>{isRtl ? 'صاف کریں' : 'Clear'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Map Block (Permanently Mounted) ── */}
      <View style={styles.mapBlock}>
        {initialRegion ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            customMapStyle={customMapStyle}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
          >
            {/* User location marker */}
            {userCoordinate && (
              <Marker coordinate={userCoordinate} tracksViewChanges={true}>
                <UserLocationMarker />
              </Marker>
            )}

            {/* Mosque markers rendered only after loading finishes and no error */}
            {!loading && !error && filteredMosques.map((mosque) => (
              <MasjidMarker
                key={mosque.id}
                id={mosque.id}
                latitude={mosque.latitude}
                longitude={mosque.longitude}
                isSelected={selectedMosque?.id === mosque.id}
                onPress={handleMarkerPress}
              />
            ))}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.centered, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              {isRtl ? 'مقام حاصل کیا جا رہا ہے...' : 'Acquiring GPS location...'}
            </Text>
          </View>
        )}

        {/* Absolute loader overlay */}
        {loading && (
          <View style={[styles.overlayCentered, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted, fontWeight: '600' }]}>
              {isRtl ? 'لوڈ ہو رہا ہے...' : 'Loading mosques...'}
            </Text>
          </View>
        )}

        {/* Absolute error overlay */}
        {error && (
          <View style={[styles.overlayCentered, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={{ color: colors.danger, fontWeight: '600', fontSize: typography.sizes.base, textAlign: 'center', marginHorizontal: 30, marginBottom: 12 }}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={handleRetryFetch}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>
                {isRtl ? 'دوبارہ کوشش کریں' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Refresh mosques button – top right */}
        {initialRegion && (
          <TouchableOpacity
            style={[
              styles.refreshBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleRetryFetch}
            activeOpacity={0.8}
            accessibilityLabel="Refresh mosque data"
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size={18} color={colors.primary} />
              : <RefreshCw size={20} color={colors.primary} />}
          </TouchableOpacity>
        )}

        {/* Recenter button (only visible when Map is loaded) */}
        {initialRegion && (
          <TouchableOpacity
            style={[
              styles.recenterBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleRecenter}
            activeOpacity={0.8}
            accessibilityLabel="Recenter map to your location"
          >
            <Compass size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Mosque Details Bottom Sheet ── */}
      <AnimatedBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={handleCloseSheet}
        backgroundColor={theme.surface}
        snapPoint={440}
      >
        {selectedMosque && (
          <MosqueBottomSheet
            mosque={selectedMosque}
            isRtl={isRtl}
            theme={theme}
            onOpenMaps={handleOpenMaps}
          />
        )}
      </AnimatedBottomSheet>

      {/* ── Filter Modal ── */}
      {showFilterModal && (
        <Modal
          visible={showFilterModal}
          transparent
          animationType="fade"
          onRequestClose={closeFilterModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalContainer}>
              <View style={styles.detailModalHeader}>
                <Text style={styles.detailModalTitle}>
                  {isRtl ? 'فلٹرز' : 'Filters'}
                </Text>
                <TouchableOpacity
                  onPress={closeFilterModal}
                  style={styles.detailCloseBtn}
                  accessibilityLabel="Close filter modal"
                >
                  <X size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.filterScroll}
                showsVerticalScrollIndicator={false}
              >
                {distinctCities.length > 0 && (
                  <>
                    <Text style={styles.filterSectionTitle}>
                      {isRtl ? 'شہر' : 'City'}
                    </Text>
                    <View style={styles.filterChipsRow}>
                      {distinctCities.map((city) => {
                        const isSelected = tempFilters.cities.includes(city);
                        return (
                          <TouchableOpacity
                            key={city}
                            style={[
                              styles.filterChip,
                              isSelected && styles.filterChipSelected,
                            ]}
                            onPress={() => toggleFilterCity(city)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.filterChipLabel,
                                isSelected && styles.filterChipLabelSelected,
                              ]}
                            >
                              {city}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                <Text style={styles.filterSectionTitle}>
                  {isRtl ? 'گنجائش کی حد (اختیاری)' : 'Capacity Range (optional)'}
                </Text>
                <View style={styles.detailRow}>
                  <View style={styles.detailHalfField}>
                    <TextInput
                      style={styles.capacityInput}
                      placeholder={isRtl ? 'کم سے کم' : 'Min'}
                      placeholderTextColor={theme.textMuted}
                      value={tempFilters.capacityMin}
                      onChangeText={(t) =>
                        setTempFilters((prev) => ({ ...prev, capacityMin: t }))
                      }
                      keyboardType="numeric"
                      accessibilityLabel="Minimum capacity filter"
                    />
                  </View>
                  <Text style={styles.capacitySeparator}>-</Text>
                  <View style={styles.detailHalfField}>
                    <TextInput
                      style={styles.capacityInput}
                      placeholder={isRtl ? 'زیادہ سے زیادہ' : 'Max'}
                      placeholderTextColor={theme.textMuted}
                      value={tempFilters.capacityMax}
                      onChangeText={(t) =>
                        setTempFilters((prev) => ({ ...prev, capacityMax: t }))
                      }
                      keyboardType="numeric"
                      accessibilityLabel="Maximum capacity filter"
                    />
                  </View>
                </View>

                <View style={styles.filterActions}>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.modalBtnCancel, { flex: 1 }]}
                    onPress={clearFilters}
                    accessibilityLabel="Clear all selected filters"
                  >
                    <Text style={styles.clearBtnText}>
                      {isRtl ? 'فلٹرز صاف کریں' : 'Reset Filters'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.saveBtn, { flex: 1 }]}
                    onPress={applyFilters}
                    activeOpacity={0.7}
                    accessibilityLabel="Apply filters"
                  >
                    <Text style={styles.saveBtnText}>
                      {isRtl ? 'فلٹر لاگو کریں' : 'Apply Filters'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 8 : 2,
  },
  searchIcon: { marginRight: spacing.xs },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    paddingVertical: 6,
  },
  clearBtn: { padding: 4 },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(246, 139, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: colors.primary },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  activeFiltersText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  clearFiltersBtn: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: '600',
  },
  mapBlock: { flex: 1, marginTop: spacing.xs },
  overlayCentered: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(246, 139, 53, 0.3)',
  },
  userMarkerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderColor: '#ffffff',
    borderWidth: 1.5,
  },
  mosqueMarkerContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  mosqueMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  mosqueMarkerNormal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  mosqueMarkerSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E97A24',
    backgroundColor: '#EDCFB9',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
  },
  mosqueMarkerEmoji: { fontSize: 14 },
  refreshBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
  },
  retryBtnText: { color: '#ffffff', fontWeight: '600' },
  sheetWrapper: { flex: 1, position: 'relative' },
  sheetScroll: { width: '100%' },
  sheetScrollContent: { paddingBottom: 40, paddingTop: 10 },
  mosqueDetailsContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  sheetTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoIcon: { marginRight: spacing.sm },
  infoText: { fontSize: typography.sizes.sm, flex: 1 },
  addressText: { fontSize: typography.sizes.sm, flex: 1, lineHeight: 18 },
  cityText: { fontSize: typography.sizes.sm, flex: 1, fontWeight: '600' },
  capacitySection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(237, 207, 185, 0.4)',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  capacityValue: { fontSize: typography.sizes.sm, paddingLeft: 24 },
  openMapsBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: spacing.borderRadiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  openMapsBtnText: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  filterModalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(237, 207, 185, 0.4)',
  },
  detailModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    flex: 1,
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  filterScroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  filterSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDCFB9',
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  filterChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  filterChipLabelSelected: { color: '#FFFFFF' },
  detailRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  detailHalfField: { flex: 1 },
  capacityInput: {
    borderWidth: 1,
    borderColor: '#EDCFB9',
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: '#1E1E1E',
    backgroundColor: '#FFFFFF',
  },
  capacitySeparator: {
    fontSize: typography.sizes.lg,
    color: '#8E8E8E',
    paddingHorizontal: spacing.xs,
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  detailActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: spacing.borderRadiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F8EBD7',
    borderWidth: 1,
    borderColor: '#E2B196',
  },
  saveBtn: { backgroundColor: colors.primary },
  clearBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.danger,
  },
  saveBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SearchScreen;
