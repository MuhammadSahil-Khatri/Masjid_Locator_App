import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Modal 
} from 'react-native';
import { Search, SlidersHorizontal, Map as MapIcon, List as ListIcon, CheckCircle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { MasjidCard } from '../../components/cards/MasjidCard';
import MapComponent from '../../components/MapComponent';
import { useNavigation } from '../../navigation/NavigationContext';
import { USER_DEFAULT_LOCATION } from '../../data/mockData';

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

  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterLadiesSpace, setFilterLadiesSpace] = useState(false);
  const [filterJanazaServices, setFilterJanazaServices] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const filteredMasjids = useMemo(() => {
    return masjids.filter(m => {
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
  }, [masjids, searchTerm, filterOpenNow, filterLadiesSpace, filterJanazaServices, filterVerifiedOnly]);

  const activeFiltersCount = 
    (filterOpenNow ? 1 : 0) + 
    (filterLadiesSpace ? 1 : 0) + 
    (filterJanazaServices ? 1 : 0) + 
    (filterVerifiedOnly ? 1 : 0);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Search Input and Filter Bar */}
      <View style={[styles.searchBar, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }, isRtl && styles.rowReverse]}>
        <View style={[styles.searchInputContainer, { backgroundColor: currentTheme.input, borderColor: currentTheme.border }, isRtl && styles.rowReverse]}>
          <Search size={16} color={currentTheme.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder={translations.searchPlaceholder}
            placeholderTextColor={currentTheme.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[
              styles.input, 
              { color: currentTheme.text },
              isRtl && typography.alignRtl
            ]}
          />
        </View>

        <TouchableOpacity 
          style={[styles.filterBtn, { borderColor: activeFiltersCount > 0 ? colors.primary : currentTheme.border, backgroundColor: activeFiltersCount > 0 ? colors.primaryLight : 'transparent' }]}
          onPress={() => setShowFilterDrawer(true)}
        >
          <SlidersHorizontal size={18} color={activeFiltersCount > 0 ? colors.primary : currentTheme.text} />
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Segment Selector View Toggle (Map vs List) */}
      <View style={[styles.segmentContainer, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }, isRtl && styles.rowReverse]}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'map' && styles.segmentBtnActive, isRtl && styles.rowReverse]}
          onPress={() => setActiveTab('map')}
        >
          <MapIcon size={14} color={activeTab === 'map' ? '#ffffff' : currentTheme.textMuted} />
          <Text style={[styles.segmentText, activeTab === 'map' ? styles.textActive : { color: currentTheme.textMuted }]}>
            {translations.findNearbyMasjid}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'list' && styles.segmentBtnActive, isRtl && styles.rowReverse]}
          onPress={() => setActiveTab('list')}
        >
          <ListIcon size={14} color={activeTab === 'list' ? '#ffffff' : currentTheme.textMuted} />
          <Text style={[styles.segmentText, activeTab === 'list' ? styles.textActive : { color: currentTheme.textMuted }]}>
            {translations.masjidList} ({filteredMasjids.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render map component or listings list */}
      {activeTab === 'map' ? (
        <View style={styles.flexOne}>
          <MapComponent 
            masjids={filteredMasjids} 
            selectedMasjid={null} 
            onSelectMasjid={(m) => {
              if (m) navigate('MosqueDetails', { masjidId: m.id });
            }}
            userLocation={USER_DEFAULT_LOCATION}
            language={language}
            showRoutePreview={false}
          />
        </View>
      ) : (
        <FlatList
          data={filteredMasjids}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MasjidCard
              masjid={item}
              isDark={isDark}
              isRtl={isRtl}
              translations={translations}
              onPress={() => navigate('MosqueDetails', { masjidId: item.id })}
              onDirectionsPress={() => navigate('MosqueDetails', { masjidId: item.id })}
            />
          )}
        />
      )}

      {/* Filter drawer Drawer Modal */}
      <Modal visible={showFilterDrawer} transparent={true} animationType="slide" onRequestClose={() => setShowFilterDrawer(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterDrawer(false)}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card, borderTopColor: currentTheme.border }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Filters</Text>
            
            <View style={styles.divider} />

            {[
              { label: translations.nowOpen, state: filterOpenNow, setState: setFilterOpenNow },
              { label: translations.genderHall, state: filterLadiesSpace, setState: setFilterLadiesSpace },
              { label: translations.janazaFacility, state: filterJanazaServices, setState: setFilterJanazaServices },
              { label: translations.verifiedOnly, state: filterVerifiedOnly, setState: setFilterVerifiedOnly }
            ].map((item, idx) => (
              <TouchableOpacity 
                key={idx}
                style={[styles.filterRow, isRtl && styles.rowReverse]}
                onPress={() => item.setState(!item.state)}
              >
                <Text style={[styles.filterLabel, { color: currentTheme.text }]}>{item.label}</Text>
                <View style={[styles.checkbox, item.state ? styles.checkboxChecked : { borderColor: currentTheme.border }]}>
                  {item.state && <CheckCircle size={14} color="#ffffff" fill={colors.primary} />}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilterDrawer(false)}
            >
              <Text style={styles.closeBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.bottomSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.touchTargetMin,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.sm,
    height: '100%',
  },
  filterBtn: {
    width: spacing.touchTargetMin,
    height: spacing.touchTargetMin,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  segmentBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  segmentText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  textActive: {
    color: colors.primary,
  },
  flexOne: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: spacing.borderRadiusLg * 1.5,
    borderTopRightRadius: spacing.borderRadiusLg * 1.5,
    padding: spacing.xl,
    borderTopWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  filterLabel: {
    fontSize: typography.sizes.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  closeBtn: {
    height: spacing.touchTargetMin + 4,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  bottomSpacer: {
    height: 80,
  },
});
