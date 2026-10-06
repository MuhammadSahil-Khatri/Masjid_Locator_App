import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { duaService, DuaItem } from '../../services/duaService';
import { DuaCategoryCard } from './DuaCategoryCard';
import { DuaCard } from './DuaCard';
import { BackArrowIcon } from './DuaIcons';

export const DuaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { params, navigate, goBack } = useNavigation();
  const { isRtl } = useApp();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    params?.categoryId || null
  );

  // Sync internal state with navigation params so back navigation
  // (popping 'Duas' → 'Supplication') clears the category view
  React.useEffect(() => {
    setSelectedCategoryId(params?.categoryId || null);
  }, [params?.categoryId]);

  const categories = useMemo(() => duaService.getCategories(), []);

  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, categories]);

  // Handle header back press
  const handleBack = useCallback(() => {
    // When a category is open, go back in history (pops 'Duas' → 'Supplication')
    // When on category list, pop to wherever we came from (e.g. Home)
    goBack();
  }, [goBack]);

  // Duas for selected category
  const displayedDuas = useMemo(() => {
    if (selectedCategoryId) {
      return duaService.getDuasByCategory(selectedCategoryId);
    }
    return [];
  }, [selectedCategoryId]);

  // Screen Title
  const screenTitle = useMemo(() => {
    if (activeCategory) {
      return isRtl && activeCategory.titleUr ? activeCategory.titleUr : activeCategory.titleEn;
    }
    return isRtl ? 'دعائیں' : 'Supplication';
  }, [activeCategory, isRtl]);

  const renderDuaItem = useCallback(
    ({ item, index }: { item: DuaItem; index: number }) => (
      <DuaCard dua={item} index={index} isRtl={isRtl} />
    ),
    [isRtl]
  );

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.container}
      imageStyle={styles.backgroundImageStyle}
      resizeMode="stretch"
    >

      {/* ── Floating Pill Header ── */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        <View style={styles.pillContainer}>
          <TouchableOpacity
            style={styles.pillActionBtn}
            activeOpacity={0.7}
            onPress={handleBack}
            accessibilityLabel="Go Back"
          >
            <BackArrowIcon size={14} color="#1D3B6D" />
          </TouchableOpacity>

          <Text style={styles.pillTitle} numberOfLines={1}>
            {screenTitle}
          </Text>

          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      {/* ── Main Content Area ── */}
      <View style={styles.contentArea}>
        {/* VIEW 1: Categories List */}
        {!selectedCategoryId ? (
          <View style={styles.scrollContainer}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 75 },
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <DuaCategoryCard
                  category={item}
                  onPress={() => navigate('Duas', { categoryId: item.id })}
                  isRtl={isRtl}
                />
              )}
            />
          </View>
        ) : (
          /* VIEW 2: Duas for selected category */
          <View style={styles.scrollContainer}>
            <FlatList
              data={displayedDuas}
              keyExtractor={(item) => item.id}
              renderItem={renderDuaItem}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 75 },
              ]}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={5}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📖</Text>
                    <Text style={styles.emptyTitle}>
                      {isRtl ? 'کوئی دعا نہیں ملی' : 'No Supplications Found'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {isRtl
                        ? 'اس زمرے میں فی الحال کوئی دعا دستیاب نہیں ہے۔'
                        : 'No supplications available in this category.'}
                    </Text>
                  </View>
                </View>
              }
            />
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
  },
  headerWrapper: {
    paddingBottom: 16,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  pillActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'center',
    letterSpacing: 0.2,
    flex: 1,
  },
  pillActionPlaceholder: {
    width: 32,
    height: 32,
  },
  contentArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff1f',
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E8F3F5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#657786',
    textAlign: 'center',
    lineHeight: 20,
  },
  rowReverse: {
    // flexDirection: 'row-reverse',
  },
});
