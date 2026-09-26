import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  ArrowLeft,
  Search,
  X,
  Plus,
  Save,
  Trash2,
  WifiOff,
  Filter,
  Edit3,
  Globe,
  Calendar,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { supabase } from '../../lib/supabase';
import { hadithService, Hadith } from '../../services/hadithService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmState {
  visible: boolean;
  hadithId: string | null;
  hadithTitle: string;
}

interface FilterState {
  status: 'all' | 'active' | 'inactive';
  sortBy: 'newest' | 'oldest';
}

// ─── Hadith Card (Consistent with MosqueBottomSheet) ─────────────────────────

interface ManageHadithCardProps {
  item: Hadith;
  onPress: () => void;
}

const ManageHadithCard: React.FC<ManageHadithCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.sheetCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Header Row: Badges */}
      <View style={styles.sheetCardHeader}>
        <View style={styles.sheetBadgesLeft}>
          {item.reference ? (
            <View style={styles.sheetBadge}>
              <Text style={styles.sheetBadgeText}>{item.reference}</Text>
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.badgeActive,
            {
              backgroundColor: item.is_active
                ? 'rgba(34,197,94,0.1)'
                : 'rgba(142,142,142,0.1)',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeActiveText,
              { color: item.is_active ? colors.success : colors.light.textMuted },
            ]}
          >
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Arabic Text */}
      {!!item.arabic_text && (
        <Text
          style={styles.sheetBodyArabic}
          numberOfLines={3}
        >
          {item.arabic_text}
        </Text>
      )}

      {/* English Translation */}
      {!!item.english_translation && (
        <Text
          style={[
            styles.sheetBodyText,
            styles.sheetBodyEnglish,
            !!item.arabic_text && { marginTop: 6 },
          ]}
          numberOfLines={3}
        >
          {item.english_translation}
        </Text>
      )}

      {/* Urdu Translation */}
      {!!item.urdu_translation && (
        <Text
          style={[
            styles.sheetBodyText,
            styles.sheetBodyUrdu,
            (!!item.arabic_text || !!item.english_translation) && { marginTop: 6 },
          ]}
          numberOfLines={3}
        >
          {item.urdu_translation}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageHadithScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { triggerToast } = useApp();

  // Data state
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');

  // Confirm delete
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    hadithId: null,
    hadithTitle: '',
  });

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formArabicText, setFormArabicText] = useState('');
  const [formUrduTranslation, setFormUrduTranslation] = useState('');
  const [formEnglishTranslation, setFormEnglishTranslation] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formCreatedAt, setFormCreatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    status: 'all',
    sortBy: 'newest',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    status: 'all',
    sortBy: 'newest',
  });

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const hadithsData = await hadithService.fetchAllHadith();
      setHadiths(hadithsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err?.message || 'Failed to load data from database.');
      setHadiths([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Filtering & Sorting ──────────────────────────────────────────────────

  const hasActiveFilters = useMemo(() => {
    return (
      appliedFilters.status !== 'all' ||
      appliedFilters.sortBy !== 'newest'
    );
  }, [appliedFilters]);

  const filteredData = useMemo(() => {
    let result = [...hadiths];

    // Search
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (h) =>
          h.arabic_text?.toLowerCase().includes(q) ||
          h.urdu_translation?.toLowerCase().includes(q) ||
          h.english_translation?.toLowerCase().includes(q) ||
          h.reference?.toLowerCase().includes(q) ||
          h.creator_name?.toLowerCase().includes(q)
      );
    }

    // Apply filters
    if (appliedFilters.status === 'active') {
      result = result.filter((h) => h.is_active);
    } else if (appliedFilters.status === 'inactive') {
      result = result.filter((h) => !h.is_active);
    }

    // Sort
    switch (appliedFilters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }

    return result;
  }, [hadiths, searchTerm, appliedFilters]);

  // ── Modal Handlers ──────────────────────────────────────────────────────

  const openAddModal = useCallback(() => {
    setEditMode(false);
    setEditId(null);
    setFormArabicText('');
    setFormUrduTranslation('');
    setFormEnglishTranslation('');
    setFormReference('');
    setFormIsActive(true);
    setFormCreatedAt(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Hadith) => {
    setEditMode(true);
    setEditId(item.id);
    setFormArabicText(item.arabic_text || '');
    setFormUrduTranslation(item.urdu_translation || '');
    setFormEnglishTranslation(item.english_translation || '');
    setFormReference(item.reference || '');
    setFormIsActive(item.is_active);
    setFormCreatedAt(item.created_at || null);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formArabicText.trim() || !formEnglishTranslation.trim() || !formReference.trim()) {
      triggerToast('Error: Arabic Text, English Translation, and Reference are required.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (editMode && editId) {
        await hadithService.updateHadith(editId, {
          arabic_text: formArabicText.trim(),
          urdu_translation: formUrduTranslation.trim() || '',
          english_translation: formEnglishTranslation.trim(),
          reference: formReference.trim(),
          is_active: formIsActive,
        });
        triggerToast('Hadith updated successfully.');
      } else {
        await hadithService.createHadith({
          arabic_text: formArabicText.trim(),
          urdu_translation: formUrduTranslation.trim() || '',
          english_translation: formEnglishTranslation.trim(),
          reference: formReference.trim(),
          created_by: userId || '',
        });
        triggerToast('Hadith created successfully.');
      }

      closeModal();
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to save hadith.'}`);
    } finally {
      setSaving(false);
    }
  }, [formArabicText, formUrduTranslation, formEnglishTranslation, formReference, formIsActive, editMode, editId, triggerToast, closeModal, loadData]);

  const handleEdit = useCallback((item: any) => {
    openEditModal(item);
  }, [openEditModal]);

  const handleDeleteFromModal = useCallback(() => {
    if (!editId) return;
    const title = formReference || formEnglishTranslation || formUrduTranslation || 'this hadith';
    setShowModal(false);
    setConfirm({
      visible: true,
      hadithId: editId,
      hadithTitle: title,
    });
  }, [editId, formReference, formEnglishTranslation, formUrduTranslation]);

  const handleDelete = useCallback((item: any) => {
    setConfirm({
      visible: true,
      hadithId: item.id,
      hadithTitle: item.reference || 'this hadith',
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirm.hadithId) return;
    setActionLoading(true);

    try {
      await hadithService.deleteHadith(confirm.hadithId);
      triggerToast('Hadith deleted successfully.');
      setConfirm({ visible: false, hadithId: null, hadithTitle: '' });
      closeModal();
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to delete hadith.'}`);
    } finally {
      setActionLoading(false);
    }
  }, [confirm.hadithId, triggerToast, closeModal, loadData]);

  const closeConfirm = useCallback(() => {
    if (actionLoading) return;
    setConfirm({ visible: false, hadithId: null, hadithTitle: '' });
  }, [actionLoading]);

  // ── Filter Handlers ────────────────────────────────────────────────────

  const openFilterModal = useCallback(() => {
    setFilterState({ ...appliedFilters });
    setShowFilterModal(true);
  }, [appliedFilters]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filterState });
    setShowFilterModal(false);
  }, [filterState]);

  const clearFilters = useCallback(() => {
    const cleared: FilterState = {
      status: 'all',
      sortBy: 'newest',
    };
    setFilterState(cleared);
    setAppliedFilters(cleared);
    setShowFilterModal(false);
  }, []);

  // ── Render States ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading hadith...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <WifiOff size={48} color={colors.danger} />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.refreshHint}>Pull down to retry</Text>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <SectionHeader title="Manage Hadith" />

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.light.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Arabic, Urdu, English text or reference..."
            placeholderTextColor={colors.light.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            clearButtonMode="while-editing"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearBtn}>
              <X size={14} color={colors.light.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilterModal} activeOpacity={0.7}>
          <Filter size={18} color={hasActiveFilters ? colors.primary : colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            Filters active · {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersBtn}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content area */}
      <View style={styles.contentArea}>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookOpen size={48} color={colors.primary} />
              <Text style={styles.emptyText}>
                {searchTerm || hasActiveFilters
                  ? 'No hadith match your search or filters.'
                  : 'No hadith found.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ManageHadithCard
              item={item}
              onPress={() => openEditModal(item)}
            />
          )}
        />
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Hadith</Text>
      </TouchableOpacity>

      {/* ── Add/Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Hadith' : 'Add Hadith'}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Active Toggle */}
              <View style={styles.activeToggleRow}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: colors.light.border, true: colors.primaryLight }}
                  thumbColor={formIsActive ? colors.primary : colors.light.textMuted}
                />
              </View>

              {/* Arabic Text */}
              <Text style={styles.fieldLabel}>Arabic Text *</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputArabic]}
                value={formArabicText}
                onChangeText={setFormArabicText}
                placeholder="اللَّهُمَّ اغْفِرْ لِي"
                placeholderTextColor={colors.light.textMuted}
                textAlign="right"
                multiline
                numberOfLines={3}
              />

              {/* Urdu Translation */}
              <Text style={styles.fieldLabel}>Urdu Translation</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={formUrduTranslation}
                onChangeText={setFormUrduTranslation}
                placeholder="اے اللہ! مجھے بخش دے"
                placeholderTextColor={colors.light.textMuted}
                textAlign="right"
                multiline
                numberOfLines={2}
              />

              {/* English Translation */}
              <Text style={styles.fieldLabel}>English Translation *</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={formEnglishTranslation}
                onChangeText={setFormEnglishTranslation}
                placeholder="O Allah, forgive me..."
                placeholderTextColor={colors.light.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Reference */}
              <Text style={styles.fieldLabel}>Reference *</Text>
              <TextInput
                style={styles.fieldInput}
                value={formReference}
                onChangeText={setFormReference}
                placeholder="Sahih Bukhari, Hadith #..."
                placeholderTextColor={colors.light.textMuted}
              />

              {/* Date of Creation */}
              {editMode && formCreatedAt ? (
                <View style={styles.createdAtContainer}>
                  <Calendar size={14} color={colors.light.textMuted} />
                  <Text style={styles.createdAtLabel}>Created:</Text>
                  <View style={styles.createdAtBadge}>
                    <Text style={styles.createdAtText}>
                      {new Date(formCreatedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Action buttons */}
              <View style={styles.modalActions}>
                {editMode ? (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.deleteBtn]}
                    onPress={handleDeleteFromModal}
                    activeOpacity={0.7}
                    disabled={saving}
                  >
                    <Trash2 size={16} color={colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.cancelBtn]}
                    onPress={closeModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.saveBtn]}
                  onPress={handleSave}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Save size={16} color="#ffffff" />
                      <Text style={styles.saveBtnText}>{editMode ? 'Update' : 'Add'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Filter Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterChipsRow}>
                {(['newest', 'oldest'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, filterState.sortBy === option && styles.filterChipSelected]}
                    onPress={() => setFilterState((prev) => ({ ...prev, sortBy: option }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipLabel, filterState.sortBy === option && styles.filterChipLabelSelected]}>
                      {option === 'newest' ? 'Newest' : 'Oldest'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status */}
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterChipsRow}>
                {(['all', 'active', 'inactive'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, filterState.status === option && styles.filterChipSelected]}
                    onPress={() => setFilterState((prev) => ({ ...prev, status: option }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipLabel, filterState.status === option && styles.filterChipLabelSelected]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action buttons */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.cancelBtn, { flex: 1 }]}
                  onPress={clearFilters}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.danger }]}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.saveBtn, { flex: 1 }]}
                  onPress={applyFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Delete Modal ─────────────────────────────────────────── */}
      <Modal visible={confirm.visible} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContainer}>
            {actionLoading ? (
              <View style={styles.modalLoadingContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>Deleting...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.smallModalTitle}>Delete Hadith</Text>
                <Text style={styles.modalBody}>
                  Are you sure you want to permanently delete this hadith? This action cannot be undone.
                </Text>
                <View style={styles.smallModalActions}>
                  <TouchableOpacity
                    style={[styles.smallModalBtn, styles.cancelBtn]}
                    onPress={closeConfirm}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallModalBtn, { backgroundColor: colors.danger }]}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={[styles.smallModalBtnText, { color: '#ffffff' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background,
  },

  // Loading / Error
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.light.background,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    marginTop: spacing.sm,
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.danger,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    textAlign: 'center',
  },
  refreshHint: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 139, 53, 0.1)',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.light.text,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },

  // Search + Filter row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.light.text,
    paddingVertical: 6,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
  },

  // Active filters bar
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

  // Content area
  contentArea: {
    flex: 1,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 150,
    gap: spacing.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },

  // Hadith Card (Consistent with MosqueBottomSheet)
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#D8F3FA',
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  sheetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetBadgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  sheetBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1F3F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sheetBadgeText: {
    color: '#153258',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeActive: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActiveText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sheetBodyArabic: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1B365D',
    textAlign: 'right',
    fontWeight: '600',
  },
  sheetBodyText: {
    color: '#1B365D',
    letterSpacing: 0.1,
  },
  sheetBodyEnglish: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'left',
  },
  sheetBodyUrdu: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },

  // Add Button
  addButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'flex-end',
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.light.text,
    flex: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Active toggle row
  activeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  // Form fields
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
  },
  fieldInputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  fieldInputArabic: {
    minHeight: 80,
    fontSize: typography.sizes.lg,
    textAlignVertical: 'top',
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelBtn: {
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  cancelBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.light.text,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.danger,
  },

  // Filter modal
  filterModalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.light.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.surface,
    marginBottom: spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.light.textMuted,
    maxWidth: 140,
  },
  filterChipLabelSelected: {
    color: '#ffffff',
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Small modal (confirm delete)
  smallModalContainer: {
    width: '100%',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  smallModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.light.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  smallModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  smallModalBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallModalBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  modalBody: {
    fontSize: typography.sizes.base,
    color: colors.light.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  modalLoadingContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  modalLoadingText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.light.text,
  },

  // Created At
  createdAtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  createdAtLabel: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    fontWeight: '600',
  },
  createdAtBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  createdAtText: {
    fontSize: typography.sizes.sm,
    color: colors.light.text,
    fontWeight: '600',
  },
});

export default ManageHadithScreen;