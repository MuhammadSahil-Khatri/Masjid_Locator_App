import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Keyboard
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Search, MapPin, CheckCircle, Navigation } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import MapComponent from '../../components/MapComponent';
import { useNavigation } from '../../navigation/NavigationContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { getDistance } from 'geolib';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';
import { AnimatedBottomSheet } from '../../components/ui/AnimatedBottomSheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export const SearchScreen: React.FC = () => {
  const { 
    masjids, 
    highContrast: isDark, 
    isRtl, 
    translations,
    language
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const { navigate } = useNavigation();
  const { location, refreshLocation } = useUserLocation();
  const insets = useSafeAreaInsets();

  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterLadiesSpace, setFilterLadiesSpace] = useState(false);
  const [filterJanazaServices, setFilterJanazaServices] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);

  // Bottom Sheet State
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  // Animations
  const searchFocused = useSharedValue(0);

  const filteredMasjids = useMemo(() => {
    if (!location) return [];

    const filtered = masjids.filter(m => {
      const matchSearch = 
        m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nameUr.includes(searchTerm) ||
        m.addressEn.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchLadies = filterLadiesSpace ? m.genderHalls === true : true;
      const matchJanaza = filterJanazaServices ? m.janazaFacility === true : true;
      const matchVerified = filterVerifiedOnly ? m.isVerified === true : true;
      const matchOpen = filterOpenNow ? m.id !== 'm4' : true; // mock open status

      return matchSearch && matchLadies && matchJanaza && matchVerified && matchOpen;
    });

    const withDistance = filtered.map(m => {
      const distance = getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: m.lat, longitude: m.lng }
      );
      return { ...m, distance };
    });

    withDistance.sort((a, b) => a.distance - b.distance);
    return withDistance.slice(0, 10);
  }, [masjids, searchTerm, filterOpenNow, filterLadiesSpace, filterJanazaServices, filterVerifiedOnly, location]);

  const selectedMasjid = useMemo(() => {
    return filteredMasjids.find(m => m.id === selectedMasjidId) || null;
  }, [selectedMasjidId, filteredMasjids]);

  const handleSelectMasjid = (m: any) => {
    setSelectedMasjidId(m.id);
    setBottomSheetVisible(true);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    searchFocused.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.exp) });
  };

  const handleBlur = () => {
    searchFocused.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.exp) });
  };

  const rSearchContainerStyle = useAnimatedStyle(() => {
    return {
      elevation: withTiming(searchFocused.value ? 10 : 4),
      shadowOpacity: withTiming(searchFocused.value ? 0.3 : 0.1),
      borderColor: searchFocused.value ? colors.primary : currentTheme.border,
      borderWidth: searchFocused.value ? 1.5 : 1,
    };
  });

  const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.filterChip,
          { 
            backgroundColor: active ? colors.primary : currentTheme.card,
            borderColor: active ? colors.primary : currentTheme.border
          }
        ]}
      >
        <Text style={[styles.filterChipText, { color: active ? '#ffffff' : currentTheme.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Full Screen Map */}
      <View style={StyleSheet.absoluteFillObject}>
        {location ? (
          <MapComponent 
            masjids={filteredMasjids} 
            selectedMasjid={selectedMasjid} 
            onSelectMasjid={handleSelectMasjid}
            userLocation={location}
            language={language}
            showRoutePreview={false}
            onCurrentLocationPress={() => refreshLocation()}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', backgroundColor: currentTheme.background }]}>
            <Text style={{ color: currentTheme.textMuted, fontSize: typography.sizes.sm }}>Acquiring GPS location...</Text>
          </View>
        )}
      </View>

      {/* 2. Floating Top UI (Search + Filters) */}
      <View style={[styles.floatingUI, { top: insets.top + spacing.md }]}>
        <Animated.View style={[
          styles.searchBarWrapper, 
          { backgroundColor: currentTheme.card }, 
          rSearchContainerStyle,
          isRtl && styles.rowReverse
        ]}>
          <Search size={20} color={currentTheme.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder={translations.searchPlaceholder || "Search Masjid..."}
            placeholderTextColor={currentTheme.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input, 
              { color: currentTheme.text },
              isRtl && typography.alignRtl
            ]}
          />
        </Animated.View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersScrollContent, isRtl && styles.rowReverse]}>
            <FilterChip 
              label={translations.nowOpen || "Nearest"} 
              active={filterOpenNow} 
              onPress={() => setFilterOpenNow(!filterOpenNow)} 
            />
            <FilterChip 
              label={translations.jummah || "Jumu'ah"} 
              active={filterVerifiedOnly} // Mocking Jumu'ah mapping
              onPress={() => setFilterVerifiedOnly(!filterVerifiedOnly)} 
            />
            <FilterChip 
              label={translations.genderHall || "Female Prayer"} 
              active={filterLadiesSpace} 
              onPress={() => setFilterLadiesSpace(!filterLadiesSpace)} 
            />
            <FilterChip 
              label={translations.janazaFacility || "Janaza Services"} 
              active={filterJanazaServices} 
              onPress={() => setFilterJanazaServices(!filterJanazaServices)} 
            />
          </ScrollView>
        </View>
      </View>

      {/* 3. Custom Animated Bottom Sheet */}
      <AnimatedBottomSheet 
        isVisible={isBottomSheetVisible} 
        onClose={() => {
          setBottomSheetVisible(false);
          setSelectedMasjidId(null);
        }}
        backgroundColor={currentTheme.card}
        snapPoint={320}
      >
        {selectedMasjid && (
          <View style={styles.sheetContent}>
            <View style={[styles.sheetHeader, isRtl && styles.rowReverse]}>
              <View style={styles.sheetTitleContainer}>
                <Text style={[styles.sheetTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]} numberOfLines={1}>
                  {isRtl ? selectedMasjid.nameUr : selectedMasjid.nameEn}
                </Text>
                <Text style={[styles.sheetDistance, { color: colors.primary }, isRtl && typography.alignRtl]}>
                  {(selectedMasjid.distance / 1000).toFixed(1)} km away
                </Text>
              </View>
              {selectedMasjid.isVerified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={14} color={colors.primary} />
                </View>
              )}
            </View>

            <Text style={[styles.sheetAddress, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]} numberOfLines={2}>
              {isRtl ? selectedMasjid.addressUr : selectedMasjid.addressEn}
            </Text>

            <View style={[styles.sheetFeatures, isRtl && styles.rowReverse]}>
              {selectedMasjid.genderHalls && (
                <View style={[styles.featureTag, { backgroundColor: currentTheme.surface }]}>
                  <Text style={[styles.featureTagText, { color: currentTheme.text }]}>{isRtl ? 'خواتین کی جگہ' : 'Female Space'}</Text>
                </View>
              )}
              {selectedMasjid.janazaFacility && (
                <View style={[styles.featureTag, { backgroundColor: currentTheme.surface }]}>
                  <Text style={[styles.featureTagText, { color: currentTheme.text }]}>{isRtl ? 'جنازہ' : 'Janaza'}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.directionsBtn, { backgroundColor: colors.primary }, isRtl && styles.rowReverse]}
              onPress={() => {
                setBottomSheetVisible(false);
                navigate('MosqueDetails', { masjidId: selectedMasjid.id });
              }}
              activeOpacity={0.8}
            >
              <Navigation size={18} color="#ffffff" />
              <Text style={styles.directionsBtnText}>
                {translations.getDirections || 'Get Directions & Details'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingUI: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    height: 52,
    borderRadius: spacing.borderRadiusLg,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-Regular',
  },
  filtersContainer: {
    marginTop: spacing.sm,
  },
  filtersScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm, // space for shadow
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
  },
  sheetContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  sheetTitleContainer: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  sheetDistance: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  verifiedBadge: {
    marginLeft: spacing.sm,
    padding: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  sheetAddress: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  sheetFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  featureTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusSm,
  },
  featureTagText: {
    fontSize: typography.sizes.xs,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: spacing.borderRadiusLg,
    gap: spacing.sm,
  },
  directionsBtnText: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
