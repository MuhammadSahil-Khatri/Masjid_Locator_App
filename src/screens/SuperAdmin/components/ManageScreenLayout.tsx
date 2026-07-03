import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../../theme';
import SectionHeader from './SectionHeader';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';
import AddButton from './AddButton';
import EmptyState from './EmptyState';
import ManagementCard, { CardType } from './ManagementCard';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ManageScreenLayoutProps {
  title: string;
  placeholderSearch: string;
  addButtonLabel?: string;
  hideAddButton?: boolean;
  emptyStateMessage: string;
  emptyStateIcon: React.ReactNode;
  mockData: any[];
  cardType: CardType;
  filterFields: string[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onBlockToggle?: (item: any) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ManageScreenLayout: React.FC<ManageScreenLayoutProps> = ({
  title,
  placeholderSearch,
  addButtonLabel,
  hideAddButton = false,
  emptyStateMessage,
  emptyStateIcon,
  mockData,
  cardType,
  filterFields,
  onEdit,
  onDelete,
  onBlockToggle,
  onRefresh,
  refreshing = false,
}) => {
  const insets = useSafeAreaInsets();
  const themeColors = colors.light;

  const [searchTerm, setSearchTerm] = useState('');

  // Local filtering logic based on filter fields
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return mockData;
    const lowerSearch = searchTerm.toLowerCase();

    return mockData.filter((item) => {
      return filterFields.some((field) => {
        const val = item[field];
        if (!val) return false;
        return String(val).toLowerCase().includes(lowerSearch);
      });
    });
  }, [searchTerm, mockData, filterFields]);

  const handleEdit = (item: any) => {
    Alert.alert('Edit Item', `Triggered edit flow for: ${item.nameEn || item.name || item.title || item.id}`);
  };

  const handleDelete = (item: any) => {
    Alert.alert('Delete Item', `Triggered delete confirmation for: ${item.nameEn || item.name || item.title || item.id}`);
  };

  const handleAddPress = () => {
    Alert.alert('Add Item', `Triggered create flow for: ${addButtonLabel}`);
  };

  const handleFilterPress = () => {
    Alert.alert('Filter Options', 'Opened advanced filter options overlay.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.offWhite }]} edges={['top']}>
      <Animated.View style={styles.container} entering={FadeIn.duration(400)}>
        {/* Screen Header */}
        <SectionHeader title={title} />

        {/* Search and Filter Row */}
        <View style={styles.searchRow}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={placeholderSearch}
          />
          <FilterButton onPress={handleFilterPress} />
        </View>

        {/* List of Data */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => item.id || item.email || String(index)}
          renderItem={({ item, index }) => (
            <ManagementCard
              item={item}
              type={cardType}
              index={index}
              onEdit={onEdit || handleEdit}
              onDelete={onDelete || handleDelete}
              onBlockToggle={onBlockToggle}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState message={emptyStateMessage} icon={emptyStateIcon} />
          }
        />

        {/* Floating Add Action Button */}
        {!hideAddButton && addButtonLabel && (
          <AddButton label={addButtonLabel} onPress={handleAddPress} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingTop: spacing.sm,
  },
});
export default ManageScreenLayout;
