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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Bell,
  ArrowLeft,
  Search,
  X,
  Plus,
  Save,
  Trash2,
  Calendar,
  Clock,
  WifiOff,
  Building2,
  Tag,
  Filter,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
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
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMosqueId, setFormMosqueId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventTime, setFormEventTime] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Native DateTimePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
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

    // Add is_today flag
    const today = new Date().toISOString().split('T')[0];
    result = result.map(a => ({
      ...a,
      is_today: a.event_date === today,
    }));

    // Sort
    result.sort((a, b) => {
      // Today's announcements always first
      if (a.is_today && !b.is_today) return -1;
      if (!a.is_today && b.is_today) return 1;
      // Then by sort preference
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
    setFormTitle('');
    setFormDescription('');
    setFormMosqueId('');
    setFormCategoryId('');
    setFormEventDate('');
    setFormEventTime('');
    setFormIsActive(true);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Announcement) => {
    setEditMode(true);
    setEditId(item.id);
    setFormTitle(item.title || '');
    setFormDescription(item.description || '');
    setFormMosqueId(item.mosque_id || '');
    setFormCategoryId(item.category_id || '');
    setFormEventDate(item.event_date || '');
    setFormEventTime(item.event_time || '');
    setFormIsActive(item.is_active);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formTitle.trim() || !formDescription.trim() || !formCategoryId || !formMosqueId) {
      triggerToast('Error: Title, Description, Category, and Mosque are required.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (editMode && editId) {
        await announcementService.updateAnnouncement(editId, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          mosque_id: formMosqueId,
          category_id: formCategoryId,
          event_date: formEventDate || null,
          event_time: formEventTime || null,
          is_active: formIsActive,
        });
        triggerToast('Announcement updated successfully.');
      } else {
        await announcementService.createAnnouncement({
          mosque_id: formMosqueId,
          category_id: formCategoryId,
          title: formTitle.trim(),
          description: formDescription.trim(),
          event_date: formEventDate || null,
          event_time: formEventTime || null,
          created_by: userId || '',
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
  }, [formTitle, formDescription, formMosqueId, formCategoryId, formEventDate, formEventTime, formIsActive, editMode, editId, triggerToast, closeModal, loadData]);

  const handleEdit = useCallback((item: any) => {
    openEditModal(item);
  }, [openEditModal]);

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
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to delete announcement.'}`);
    } finally {
      setActionLoading(false);
    }
  }, [confirm.announcementId, triggerToast, loadData]);

  const closeConfirm = useCallback(() => {
    if (actionLoading) return;
    setConfirm({ visible: false, announcementId: null, announcementTitle: '' });
  }, [actionLoading]);

  // ── Native DateTimePicker Handlers ─────────────────────────────────────

  const formatTimeForDb = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const formatTimeDisplay = (timeStr: string | null): string => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr.substring(0, 5);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFormEventDate(dateStr);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  }, []);

  const onTimeChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setFormEventTime(formatTimeForDb(selectedDate));
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  }, []);

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
      triggerToast(`Category "${newCategory.name}" created.`);
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Announcements</Text>
        <View style={styles.headerSpacer} />
      </View>

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
              <Bell size={48} color={colors.peach} />
              <Text style={styles.emptyText}>
                {searchTerm || hasActiveFilters
                  ? 'No announcements match your search or filters.'
                  : 'No announcements found.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isToday = item.is_today;
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  isToday && styles.cardToday,
                ]}
                onPress={() => openEditModal(item)}
                activeOpacity={0.7}
              >
                {isToday && <View style={styles.todayBadge} />}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, isToday && styles.cardTitleToday]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.cardBadges}>
                      {isToday && (
                        <View style={styles.badgeToday}>
                          <Text style={styles.badgeTodayText}>Today</Text>
                        </View>
                      )}
                      <View style={[styles.badgeActive, { backgroundColor: item.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(142,142,142,0.1)' }]}>
                        <Text style={[styles.badgeActiveText, { color: item.is_active ? colors.success : colors.light.textMuted }]}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    {item.category_name && (
                      <View style={styles.cardMetaRow}>
                        <Tag size={12} color={colors.primary} />
                        <Text style={styles.cardMetaText}>{item.category_name}</Text>
                      </View>
                    )}
                    {item.mosque_name && (
                      <View style={styles.cardMetaRow}>
                        <Building2 size={12} color={colors.primary} />
                        <Text style={styles.cardMetaText}>{item.mosque_name}</Text>
                      </View>
                    )}
                    {item.event_date && (
                      <View style={styles.cardMetaRow}>
                        <Calendar size={12} color={colors.primary} />
                        <Text style={styles.cardMetaText}>
                          {item.event_date}
                          {item.event_time ? ` ${formatTimeDisplay(item.event_time)}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.cardDeleteBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
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

              {/* Title */}
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.fieldInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Enter announcement title"
                placeholderTextColor={colors.light.textMuted}
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Enter announcement description"
                placeholderTextColor={colors.light.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Mosque */}
              <Text style={styles.fieldLabel}>Mosque *</Text>
              <View style={styles.pickerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                  {mosques.map((mosque) => (
                    <TouchableOpacity
                      key={mosque.id}
                      style={[styles.chip, formMosqueId === mosque.id && styles.chipSelected]}
                      onPress={() => setFormMosqueId(mosque.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, formMosqueId === mosque.id && styles.chipTextSelected]}>
                        {mosque.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {mosques.length === 0 && (
                    <Text style={styles.noDataText}>No mosques available.</Text>
                  )}
                </ScrollView>
              </View>

              {/* Event Date */}
              <Text style={styles.fieldLabel}>Event Date</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.dateTimeButtonText, !formEventDate && styles.placeholderText]}>
                  {formEventDate || 'Select event date'}
                </Text>
                {formEventDate ? (
                  <TouchableOpacity onPress={() => setFormEventDate('')}>
                    <X size={16} color={colors.light.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formEventDate ? new Date(formEventDate + 'T00:00:00') : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date(2099, 11, 31)}
                />
              )}

              {/* Event Time */}
              <Text style={styles.fieldLabel}>Event Time</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Clock size={18} color={colors.primary} />
                <Text style={[styles.dateTimeButtonText, !formEventTime && styles.placeholderText]}>
                  {formEventTime ? formatTimeDisplay(formEventTime) : 'Select event time'}
                </Text>
                {formEventTime ? (
                  <TouchableOpacity onPress={() => setFormEventTime('')}>
                    <X size={16} color={colors.light.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    if (formEventTime) {
                      const [h, m] = formEventTime.split(':').map(Number);
                      const d = new Date();
                      d.setHours(h || 0, m || 0, 0, 0);
                      return d;
                    }
                    return new Date();
                  })()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={false}
                  onChange={onTimeChange}
                />
              )}

              {/* Category (moved to end, before buttons) */}
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.pickerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, formCategoryId === cat.id && styles.chipSelected]}
                      onPress={() => setFormCategoryId(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, formCategoryId === cat.id && styles.chipTextSelected]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.addChipButton}
                    onPress={() => {
                      setNewCategoryName('');
                      setShowCategoryModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={colors.primary} />
                  </TouchableOpacity>
                  {categories.length === 0 && (
                    <Text style={styles.noDataText}>No categories available.</Text>
                  )}
                </ScrollView>
              </View>

              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.cancelBtn]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
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
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.filterChip, filterState.categoryIds.includes(cat.id) && styles.filterChipSelected]}
                        onPress={() => toggleFilterCategory(cat.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterChipLabel, filterState.categoryIds.includes(cat.id) && styles.filterChipLabelSelected]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
    paddingBottom: 100,
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

  // Card
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardToday: {
    backgroundColor: 'rgba(246, 139, 53, 0.06)',
    borderColor: colors.primaryBorder,
  },
  todayBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderBottomLeftRadius: spacing.borderRadiusLg,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.light.text,
    flexShrink: 1,
    maxWidth: '60%',
  },
  cardTitleToday: {
    color: colors.primary,
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeToday: {
    backgroundColor: 'rgba(246, 139, 53, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTodayText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
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
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
  },
  cardDeleteBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },

  // Add Button
  addButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
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
});

export default ManageAnnouncementsScreen;