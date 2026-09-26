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
  Bell,
  ArrowLeft,
  Search,
  X,
  Plus,
  Save,
  Trash2,
  WifiOff,
  Building2,
  Tag,
  Filter,
  Calendar,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { supabase } from '../../lib/supabase';
import { announcementService, Announcement, AnnouncementCategory } from '../../services/announcementService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmState {
  visible: boolean;
  announcementId: string | null;
  announcementTitle: string;
}

interface FilterState {
  status: 'all' | 'active' | 'inactive';
  categoryIds: string[];
  sortBy: 'newest' | 'oldest';
}

// ─── Announcement Card (Consistent with MosqueBottomSheet) ───────────────────

interface ManageAnnouncementCardProps {
  item: Announcement;
  onPress: () => void;
}

const ManageAnnouncementCard: React.FC<ManageAnnouncementCardProps> = ({ item, onPress }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const englishText = item.description_en || item.description || '';
  const urduText = item.description_ur || '';
  const hasBoth = Boolean(englishText && urduText);

  const rawDate = item.event_date || item.created_at;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '';

  const totalLength = englishText.length + urduText.length;
  const isLongText =
    totalLength > 140 ||
    (englishText.match(/\n/g) || []).length > 2 ||
    (urduText.match(/\n/g) || []).length > 2;

  const categoryLabel = item.category_name_en || item.category_name || item.category_name_ur;

  return (
    <TouchableOpacity
      style={styles.sheetAnnouncementCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Header Row: Badges */}
      <View style={styles.sheetCardHeader}>
        <View style={styles.sheetBadgesLeft}>
          {categoryLabel ? (
            <View style={styles.sheetAnnounceBadge}>
              <Text style={styles.sheetAnnounceBadgeText}>{categoryLabel}</Text>
            </View>
          ) : null}
          {item.mosque_name ? (
            <View style={styles.sheetMosqueBadge}>
              <Building2 size={11} color="#03BECD" />
              <Text style={styles.sheetMosqueBadgeText} numberOfLines={1}>
                {item.mosque_name}
              </Text>
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

      {/* English Description */}
      {!!englishText && (
        <Text
          style={[styles.sheetAnnounceBodyText, styles.sheetAnnounceBodyEnglish]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {englishText}
        </Text>
      )}

      {/* Urdu Description */}
      {!!urduText && (
        <Text
          style={[
            styles.sheetAnnounceBodyText,
            styles.sheetAnnounceBodyUrdu,
            hasBoth && { marginTop: 6 },
          ]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {urduText}
        </Text>
      )}


    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageAnnouncementsScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { triggerToast } = useApp();

  // Data state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [mosques, setMosques] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');

  // Confirm delete
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    announcementId: null,
    announcementTitle: '',
  });

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formDescriptionEn, setFormDescriptionEn] = useState('');
  const [formDescriptionUr, setFormDescriptionUr] = useState('');
  const [formMosqueId, setFormMosqueId] = useState<string | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formCreatedAt, setFormCreatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mosqueInput, setMosqueInput] = useState('');
  const [mosqueError, setMosqueError] = useState<string | null>(null);
  const [mosqueName, setMosqueName] = useState<string | null>(null);

  // Category creation modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryCreating, setCategoryCreating] = useState(false);

  // Filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    status: 'all',
    categoryIds: [],
    sortBy: 'newest',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    status: 'all',
    categoryIds: [],
    sortBy: 'newest',
  });

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [announcementsData, categoriesData, mosquesData] = await Promise.all([
        announcementService.fetchAllAnnouncements(),
        announcementService.fetchCategories(),
        announcementService.fetchMosques(),
      ]);
      setAnnouncements(announcementsData);
      setCategories(categoriesData);
      setMosques(mosquesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err?.message || 'Failed to load data from database.');
      setAnnouncements([]);
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
      appliedFilters.categoryIds.length > 0 ||
      appliedFilters.sortBy !== 'newest'
    );
  }, [appliedFilters]);

  const filteredData = useMemo(() => {
    let result = [...announcements];

    // Search
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (a) =>
          a.description_en?.toLowerCase().includes(q) ||
          a.description_ur?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.title?.toLowerCase().includes(q) ||
          a.category_name?.toLowerCase().includes(q) ||
          a.mosque_name?.toLowerCase().includes(q)
      );
    }

    // Apply filters
    if (appliedFilters.status === 'active') {
      result = result.filter((a) => a.is_active);
    } else if (appliedFilters.status === 'inactive') {
      result = result.filter((a) => !a.is_active);
    }
    if (appliedFilters.categoryIds.length > 0) {
      result = result.filter((a) => a.category_id && appliedFilters.categoryIds.includes(a.category_id));
    }

    // Sort
    result.sort((a, b) => {
      if (appliedFilters.sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return result;
  }, [announcements, searchTerm, appliedFilters]);

  // ── Modal Handlers ──────────────────────────────────────────────────────

  const openAddModal = useCallback(() => {
    setEditMode(false);
    setEditId(null);
    setFormDescriptionEn('');
    setFormDescriptionUr('');
    setFormMosqueId(null);
    setFormCategoryId('');
    setFormIsActive(true);
    setFormCreatedAt(null);
    setMosqueInput('');
    setMosqueError(null);
    setMosqueName(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Announcement) => {
    setEditMode(true);
    setEditId(item.id);
    setFormDescriptionEn(item.description_en || item.description || '');
    setFormDescriptionUr(item.description_ur || '');
    setFormMosqueId(item.mosque_id || null);
    setFormCategoryId(item.category_id || '');
    setFormIsActive(item.is_active);
    setFormCreatedAt(item.created_at || null);
    // Pre-fill mosque input from existing mosque_id
    const existing = mosques.find((m) => m.id === item.mosque_id);
    setMosqueInput(existing?.name || '');
    setMosqueName(existing?.name || null);
    setMosqueError(null);
    setShowModal(true);
  }, [mosques]);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleMosqueLookup = useCallback(() => {
    const query = mosqueInput.trim();
    if (!query) {
      // Empty means None
      setFormMosqueId(null);
      setMosqueName(null);
      setMosqueError(null);
      return;
    }
    const match = mosques.find(
      (m) => m.name.toLowerCase() === query.toLowerCase()
    ) || mosques.find(
      (m) => m.name.toLowerCase().includes(query.toLowerCase())
    );
    if (match) {
      setFormMosqueId(match.id);
      setMosqueName(match.name);
      setMosqueError(null);
      setMosqueInput(match.name);
    } else {
      setFormMosqueId(null);
      setMosqueName(null);
      setMosqueError(`No mosque found matching "${query}"`);
    }
  }, [mosqueInput, mosques]);

  const handleSave = useCallback(async () => {
    if (!formDescriptionEn.trim() && !formDescriptionUr.trim()) {
      triggerToast('Error: Description (English or Urdu) is required.');
      return;
    }
    if (!formCategoryId) {
      triggerToast('Error: Category is required.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (editMode && editId) {
        await announcementService.updateAnnouncement(editId, {
          description_en: formDescriptionEn.trim(),
          description_ur: formDescriptionUr.trim(),
          mosque_id: formMosqueId || null,
          category_id: formCategoryId,
          is_active: formIsActive,
        });
        triggerToast('Announcement updated successfully.');
      } else {
        await announcementService.createAnnouncement({
          mosque_id: formMosqueId || null,
          category_id: formCategoryId,
          description_en: formDescriptionEn.trim(),
          description_ur: formDescriptionUr.trim(),
          created_by: userId || '',
          is_active: formIsActive,
        });
        triggerToast('Announcement created successfully.');
      }

      closeModal();
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to save announcement.'}`);
    } finally {
      setSaving(false);
    }
  }, [formDescriptionEn, formDescriptionUr, formMosqueId, formCategoryId, formIsActive, editMode, editId, triggerToast, closeModal, loadData]);

  const handleEdit = useCallback((item: any) => {
    openEditModal(item);
  }, [openEditModal]);

  const handleDeleteFromModal = useCallback(() => {
    if (!editId) return;
    const title = formDescriptionEn || formDescriptionUr || 'Announcement';
    setShowModal(false);
    setConfirm({
      visible: true,
      announcementId: editId,
      announcementTitle: title,
    });
  }, [editId, formDescriptionEn, formDescriptionUr]);

  const handleDelete = useCallback((item: any) => {
    setConfirm({
      visible: true,
      announcementId: item.id,
      announcementTitle: item.title,
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirm.announcementId) return;
    setActionLoading(true);

    try {
      await announcementService.deleteAnnouncement(confirm.announcementId);
      triggerToast('Announcement deleted successfully.');
      setConfirm({ visible: false, announcementId: null, announcementTitle: '' });
      closeModal();
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to delete announcement.'}`);
    } finally {
      setActionLoading(false);
    }
  }, [confirm.announcementId, triggerToast, closeModal, loadData]);

  const closeConfirm = useCallback(() => {
    if (actionLoading) return;
    setConfirm({ visible: false, announcementId: null, announcementTitle: '' });
  }, [actionLoading]);

  // ── Category Creation ──────────────────────────────────────────────────

  const handleCreateCategory = useCallback(async () => {
    const name = newCategoryName.trim();
    if (!name) {
      triggerToast('Please enter a category name.');
      return;
    }

    setCategoryCreating(true);
    try {
      const newCategory = await announcementService.createCategory(name);
      setCategories((prev) => [...prev, newCategory]);
      setFormCategoryId(newCategory.id);
      setNewCategoryName('');
      setShowCategoryModal(false);
      const catDisplayName = newCategory.name_en || newCategory.name || newCategory.name_ur || name;
      triggerToast(`Category "${catDisplayName}" created.`);
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to create category.'}`);
    } finally {
      setCategoryCreating(false);
    }
  }, [newCategoryName, triggerToast]);

  // ── Filter Handlers ────────────────────────────────────────────────────

  const openFilterModal = useCallback(() => {
    setFilterState({ ...appliedFilters });
    setShowFilterModal(true);
  }, [appliedFilters]);

  const toggleFilterCategory = useCallback((catId: string) => {
    setFilterState((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((c) => c !== catId)
        : [...prev.categoryIds, catId],
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filterState });
    setShowFilterModal(false);
  }, [filterState]);

  const clearFilters = useCallback(() => {
    const cleared: FilterState = {
      status: 'all',
      categoryIds: [],
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
        <Text style={styles.loadingText}>Loading announcements...</Text>
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
      <SectionHeader title="Manage Announcements" />

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.light.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, description, category, mosque..."
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
              <Bell size={48} color={colors.primary} />
              <Text style={styles.emptyText}>
                {searchTerm || hasActiveFilters
                  ? 'No announcements match your search or filters.'
                  : 'No announcements found.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ManageAnnouncementCard
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
        <Text style={styles.addButtonText}>Add Announcement</Text>
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
                {editMode ? 'Edit Announcement' : 'Add Announcement'}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* 1. Active Toggle */}
              <View style={styles.activeToggleRow}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: colors.light.border, true: colors.primaryLight }}
                  thumbColor={formIsActive ? colors.primary : colors.light.textMuted}
                />
              </View>

              {/* 2. English Description */}
              <Text style={styles.fieldLabel}>Description (English) *</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={formDescriptionEn}
                onChangeText={setFormDescriptionEn}
                placeholder="Enter announcement description in English"
                placeholderTextColor={colors.light.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* 3. Urdu Description */}
              <Text style={styles.fieldLabel}>Description (Urdu) *</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline, { textAlign: 'right' }]}
                value={formDescriptionUr}
                onChangeText={setFormDescriptionUr}
                placeholder="اردو میں اعلان کی تفصیل درج کریں"
                placeholderTextColor={colors.light.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* 4. Mosque (Optional) */}
              <Text style={styles.fieldLabel}>Mosque (Optional)</Text>
              <View style={styles.mosqueInputRow}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={mosqueInput}
                  onChangeText={(text) => {
                    setMosqueInput(text);
                    setMosqueError(null);
                    setMosqueName(null);
                    setFormMosqueId(null);
                  }}
                  placeholder="Type mosque name"
                  placeholderTextColor={colors.light.textMuted}
                />
                <TouchableOpacity
                  style={styles.mosqueLookupBtn}
                  onPress={handleMosqueLookup}
                  activeOpacity={0.7}
                >
                  <Search size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {mosqueError ? (
                <Text style={styles.mosqueErrorText}>✕ {mosqueError}</Text>
              ) : mosqueName ? (
                <Text style={styles.mosqueVerifiedText}>✓ Mosque: {mosqueName}</Text>
              ) : null}

              {/* 5. Category */}
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.categoryChipsContainer}>
                {categories.map((cat) => {
                  const catName = cat.name_en || cat.name || cat.name_ur || 'Unnamed';
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, formCategoryId === cat.id && styles.categoryChipSelected]}
                      onPress={() => setFormCategoryId(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryChipText, formCategoryId === cat.id && styles.categoryChipTextSelected]}>
                        {catName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.addCategoryChipBtn}
                  onPress={() => {
                    setNewCategoryName('');
                    setShowCategoryModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
                {categories.length === 0 && (
                  <Text style={styles.noDataText}>No categories yet.</Text>
                )}
              </View>

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

      {/* ── Category Creation Modal ──────────────────────────────────────── */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContainer}>
            <Text style={styles.smallModalTitle}>Create New Category</Text>
            <TextInput
              style={styles.smallModalInput}
              placeholder="Enter category name"
              placeholderTextColor={colors.light.textMuted}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.smallModalActions}>
              <TouchableOpacity
                style={[styles.smallModalBtn, styles.cancelBtn]}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallModalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateCategory}
                disabled={categoryCreating}
              >
                {categoryCreating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.smallModalBtnText, { color: '#ffffff' }]}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

              {/* Categories */}
              {categories.length > 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>Categories</Text>
                  <View style={styles.filterChipsRow}>
                    {categories.map((cat) => {
                      const catName = cat.name_en || cat.name || cat.name_ur || 'Unnamed';
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.filterChip, filterState.categoryIds.includes(cat.id) && styles.filterChipSelected]}
                          onPress={() => toggleFilterCategory(cat.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.filterChipLabel, filterState.categoryIds.includes(cat.id) && styles.filterChipLabelSelected]}>
                            {catName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

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
                <Text style={styles.smallModalTitle}>Delete Announcement</Text>
                <Text style={styles.modalBody}>
                  Are you sure you want to permanently delete "{confirm.announcementTitle}"? This action cannot be undone.
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

  // Announcement Card (Consistent with MosqueBottomSheet)
  sheetAnnouncementCard: {
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
  sheetAnnounceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1F3F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sheetAnnounceBadgeText: {
    color: '#153258',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetMosqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F7F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sheetMosqueBadgeText: {
    color: '#088395',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 150,
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
  sheetAnnounceBodyText: {
    color: '#1B365D',
    letterSpacing: 0.1,
  },
  sheetAnnounceBodyEnglish: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'left',
  },
  sheetAnnounceBodyUrdu: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  sheetAnnounceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#EEF2F6',
  },
  sheetAnnounceSeeMoreBtn: {
    paddingVertical: 2,
  },
  sheetAnnounceSeeMoreText: {
    fontSize: 12,
    color: '#03BECD',
    fontWeight: '700',
  },
  sheetAnnounceDateText: {
    fontSize: 11,
    color: '#8C9199',
    fontWeight: '600',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Picker / Chips
  pickerRow: {
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  addChipButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 139, 53, 0.08)',
  },
  noDataText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    fontStyle: 'italic',
  },

  // Category chips (matching ManageMosquesScreen tags layout)
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.surface,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  addCategoryChipBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 139, 53, 0.08)',
  },

  // Mosque input row (same pattern as ManageMosquesScreen admin email field)
  mosqueInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mosqueLookupBtn: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadiusMd,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mosqueVerifiedText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  mosqueErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  mosqueNoneText: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: spacing.sm,
  },

  // Date/Time
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.light.surface,
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.light.text,
  },
  placeholderText: {
    color: colors.light.textMuted,
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

  // Small modal (category creation, confirm delete)
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
  smallModalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
    marginBottom: spacing.sm,
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

export default ManageAnnouncementsScreen;