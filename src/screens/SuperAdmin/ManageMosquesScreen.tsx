import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
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
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MoreVertical,
  WifiOff,
  Building2,
  MapPin,
  Users,
  Tag,
  ImageIcon,
  Phone,
  Clock,
  ArrowLeft,
  X,
  Save,
  Trash2,
  SlidersHorizontal,
  Filter,
  Plus,
  SortAsc,
  SortDesc,
  ChevronDown,
  Camera,
  Mail,
  ChevronRight,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { getDistance } from 'geolib';
import { colors, spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { mosqueService, MosqueWithAdmin, MosqueTag, MosqueRow } from '../../services/mosqueService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmState {
  visible: boolean;
  mosqueId: string | null;
  mosqueName: string;
}

interface FilterState {
  cities: string[];
  adminIds: string[];
  tagIds: string[];
  status: 'all' | 'active' | 'inactive';
  sortBy: 'newest' | 'oldest' | 'a-z' | 'z-a';
}

interface DetailModalState {
  visible: boolean;
  mosque: MosqueWithAdmin | null;
}

type AddField = 'name' | 'address' | 'city' | 'latitude' | 'longitude' | 'image_url' | 'google_maps_url';

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageMosquesScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { isRtl, triggerToast } = useApp();
  const { location } = useUserLocation();

  // Data state
  const [mosques, setMosques] = useState<MosqueWithAdmin[]>([]);
  const [allTags, setAllTags] = useState<MosqueTag[]>([]);
  const [distinctCities, setDistinctCities] = useState<string[]>([]);
  const [admins, setAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');

  // Confirm delete
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    mosqueId: null,
    mosqueName: '',
  });

  // Detail/Edit modal
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    visible: false,
    mosque: null,
  });

  // Edit form fields
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSelectedTagIds, setEditSelectedTagIds] = useState<string[]>([]);
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminId, setEditAdminId] = useState<string | null>(null);
  const [editAdminError, setEditAdminError] = useState<string | null>(null);
  const [editAdminLookingUp, setEditAdminLookingUp] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [editImageSuccess, setEditImageSuccess] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addLatitude, setAddLatitude] = useState('');
  const [addLongitude, setAddLongitude] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminId, setAddAdminId] = useState<string | null>(null);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);
  const [addAdminLookingUp, setAddAdminLookingUp] = useState(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [addImageError, setAddImageError] = useState<string | null>(null);
  const [addImageSuccess, setAddImageSuccess] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addImageUploading, setAddImageUploading] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);

  // Tag creation modal
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagCreating, setTagCreating] = useState(false);

  // Confirm delete error
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    cities: [],
    adminIds: [],
    tagIds: [],
    status: 'all',
    sortBy: 'newest',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    cities: [],
    adminIds: [],
    tagIds: [],
    status: 'all',
    sortBy: 'newest',
  });

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [mosquesData, tagsData, citiesData, adminsData] = await Promise.all([
        mosqueService.fetchAllMosques(),
        mosqueService.fetchAllTags(),
        mosqueService.fetchDistinctCities(),
        mosqueService.fetchAdmins(),
      ]);
      setMosques(mosquesData);
      setAllTags(tagsData);
      setDistinctCities(citiesData);
      setAdmins(adminsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err?.message || 'Failed to load data from database.');
      setMosques([]);
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

  const filteredData = useMemo(() => {
    let result = [...mosques];

    // Search
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.address?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.admin_name?.toLowerCase().includes(q)
      );
    }

    // Apply filters
    if (appliedFilters.cities.length > 0) {
      result = result.filter((m) => appliedFilters.cities.includes(m.city));
    }
    if (appliedFilters.adminIds.length > 0) {
      result = result.filter((m) => m.admin_id && appliedFilters.adminIds.includes(m.admin_id));
    }
    if (appliedFilters.tagIds.length > 0) {
      result = result.filter((m) =>
        appliedFilters.tagIds.some((tagId) => {
          const tag = allTags.find((t) => t.id === tagId);
          return tag && m.tags.includes(tag.name);
        })
      );
    }
    if (appliedFilters.status === 'active') {
      result = result.filter((m) => m.is_active);
    } else if (appliedFilters.status === 'inactive') {
      result = result.filter((m) => !m.is_active);
    }

    // Sort
    switch (appliedFilters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'a-z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [mosques, searchTerm, appliedFilters, allTags]);

  const getDistanceText = useCallback(
    (item: MosqueWithAdmin) => {
      if (!location || !location.lat || !location.lng || !item.latitude || !item.longitude) {
        return '';
      }
      try {
        const dist = getDistance(
          { latitude: location.lat, longitude: location.lng },
          { latitude: item.latitude, longitude: item.longitude }
        );
        return `${(dist / 1000).toFixed(1)}km`;
      } catch {
        return '';
      }
    },
    [location]
  );

  // ── Image Picker ─────────────────────────────────────────────────────────

  const pickAndUploadImage = useCallback(async (): Promise<{ url: string | null; error: string | null }> => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        return { url: null, error: 'Permission to access media library is required.' };
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { url: null, error: null };
      }

      const selectedUri = result.assets[0].uri;

      // Upload to Supabase storage
      const uploadedUrl = await mosqueService.uploadMosqueImage(selectedUri);
      return { url: uploadedUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error picking/uploading image.' };
    }
  }, []);

  // ── Detail/Edit Modal ────────────────────────────────────────────────────

  const openDetailModal = useCallback((mosque: MosqueWithAdmin) => {
    setDetailModal({ visible: true, mosque });
    setEditName(mosque.name || '');
    setEditAddress(mosque.address || '');
    setEditCity(mosque.city || '');
    setEditLatitude(mosque.latitude?.toString() || '');
    setEditLongitude(mosque.longitude?.toString() || '');
    setEditImageUrl(mosque.image_url || '');
    setEditIsActive(mosque.is_active);
    setEditAdminId(mosque.admin_id || null);
    setEditAdminEmail(mosque.admin_email || '');
    setEditAdminError(null);
    setEditFormError(null);
    setEditImageError(null);
    setEditImageSuccess(null);
    // Load tag IDs for this mosque
    mosqueService.getMosqueTagIds(mosque.id).then((ids) => {
      setEditSelectedTagIds(ids);
    }).catch(() => {
      setEditSelectedTagIds([]);
    });
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModal({ visible: false, mosque: null });
    setEditAdminError(null);
    setEditFormError(null);
    setEditImageError(null);
    setEditImageSuccess(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!detailModal.mosque) return;

    if (!editName.trim() || !editAddress.trim() || !editCity.trim()) {
      setEditFormError('Name, Address, and City are required.');
      return;
    }

    setEditSaving(true);
    setEditFormError(null);

    try {
      // Check admin uniqueness
      if (editAdminId && editAdminId !== detailModal.mosque.admin_id) {
        const assignedMosque = mosques.find(
          (m) => m.admin_id === editAdminId && m.id !== detailModal.mosque!.id
        );
        const dbMosque = await mosqueService.fetchMosqueByAdminId(editAdminId);
        const conflicting = (dbMosque && dbMosque.id !== detailModal.mosque!.id) ? dbMosque : assignedMosque;
        if (conflicting) {
          setEditFormError(`Selected admin is already assigned to "${conflicting.name}". Admin must be unique.`);
          setEditSaving(false);
          return;
        }
      }

      await mosqueService.updateMosque(detailModal.mosque.id, {
        name: editName.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        latitude: parseFloat(editLatitude) || 0,
        longitude: parseFloat(editLongitude) || 0,
        image_url: editImageUrl || null,
        is_active: editIsActive,
        admin_id: editAdminId || null,
      });

      // Update tags
      await mosqueService.updateMosqueTags(detailModal.mosque.id, editSelectedTagIds);

      closeDetailModal();
      triggerToast('Mosque updated successfully.');
      // Refresh data
      loadData();
    } catch (err: any) {
      setEditFormError(err?.message || 'Failed to update mosque.');
    } finally {
      setEditSaving(false);
    }
  }, [detailModal.mosque, editName, editAddress, editCity, editLatitude, editLongitude, editImageUrl, editIsActive, editAdminId, editSelectedTagIds, mosques, closeDetailModal, triggerToast, loadData]);

  const handleDeleteFromDetail = useCallback(() => {
    if (!detailModal.mosque) return;
    setDeleteError(null);
    setConfirm({
      visible: true,
      mosqueId: detailModal.mosque.id,
      mosqueName: detailModal.mosque.name,
    });
  }, [detailModal.mosque]);

  // ── Admin Email Lookup (Edit) ────────────────────────────────────────────

  const handleEditAdminEmailLookup = useCallback(async () => {
    const email = editAdminEmail.trim();
    if (!email) {
      setEditAdminError('Please enter an admin email.');
      setEditAdminId(null);
      return;
    }
    setEditAdminLookingUp(true);
    setEditAdminError(null);
    try {
      const admin = await mosqueService.findAdminByEmail(email);

      // Check unique admin
      const assignedMosque = mosques.find(
        (m) => m.admin_id === admin.id && m.id !== detailModal.mosque?.id
      );
      const dbMosque = await mosqueService.fetchMosqueByAdminId(admin.id);
      const conflicting = (dbMosque && dbMosque.id !== detailModal.mosque?.id) ? dbMosque : assignedMosque;
      if (conflicting) {
        setEditAdminError(`Admin "${admin.name}" is already assigned to "${conflicting.name}". Admin must be unique.`);
        setEditAdminId(null);
        return;
      }

      setEditAdminId(admin.id);
      setEditAdminEmail(admin.email);
      setEditAdminError(null);
    } catch (err: any) {
      setEditAdminError(err?.message || 'Failed to find admin.');
      setEditAdminId(null);
    } finally {
      setEditAdminLookingUp(false);
    }
  }, [editAdminEmail, mosques, detailModal.mosque]);

  // ── Confirm Delete ───────────────────────────────────────────────────────

  const closeConfirm = useCallback(() => {
    if (actionLoading) return;
    setConfirm({ visible: false, mosqueId: null, mosqueName: '' });
    setDeleteError(null);
  }, [actionLoading]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirm.mosqueId) return;
    setActionLoading(true);
    setDeleteError(null);

    try {
      await mosqueService.deleteMosque(confirm.mosqueId);
      closeDetailModal();
      setConfirm({ visible: false, mosqueId: null, mosqueName: '' });
      triggerToast('Mosque deleted successfully.');
      loadData();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete mosque.');
    } finally {
      setActionLoading(false);
    }
  }, [confirm.mosqueId, closeDetailModal, triggerToast, loadData]);

  // ── Add Mosque ───────────────────────────────────────────────────────────

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setAddFormError(null);
    setAddAdminError(null);
    setAddImageError(null);
    setAddImageSuccess(null);
  }, []);

  const handleAddMosque = useCallback(async () => {
    if (!addName.trim() || !addAddress.trim() || !addCity.trim()) {
      setAddFormError('Name, Address, and City are required.');
      return;
    }

    setAddSaving(true);
    setAddFormError(null);

    try {
      // Check admin uniqueness
      if (addAdminId) {
        const assignedMosque = mosques.find((m) => m.admin_id === addAdminId);
        const dbMosque = await mosqueService.fetchMosqueByAdminId(addAdminId);
        const conflicting = dbMosque || assignedMosque;
        if (conflicting) {
          setAddFormError(`Selected admin is already assigned to "${conflicting.name}". Admin must be unique.`);
          setAddSaving(false);
          return;
        }
      }

      await mosqueService.createMosque({
        name: addName.trim(),
        address: addAddress.trim(),
        city: addCity.trim(),
        latitude: parseFloat(addLatitude) || 0,
        longitude: parseFloat(addLongitude) || 0,
        image_url: addImageUrl.trim() || null,
        admin_id: addAdminId || null,
        is_active: true,
      });

      closeAddModal();
      triggerToast('Mosque added successfully.');
      // Reset form
      setAddName('');
      setAddAddress('');
      setAddCity('');
      setAddLatitude('');
      setAddLongitude('');
      setAddImageUrl('');
      setAddAdminEmail('');
      setAddAdminId(null);
      loadData();
    } catch (err: any) {
      setAddFormError(err?.message || 'Failed to add mosque.');
    } finally {
      setAddSaving(false);
    }
  }, [addName, addAddress, addCity, addLatitude, addLongitude, addImageUrl, addAdminId, mosques, closeAddModal, triggerToast, loadData]);

  // ── Admin Email Lookup (Add) ─────────────────────────────────────────────

  const handleAddAdminEmailLookup = useCallback(async () => {
    const email = addAdminEmail.trim();
    if (!email) {
      setAddAdminError('Please enter an admin email.');
      setAddAdminId(null);
      return;
    }
    setAddAdminLookingUp(true);
    setAddAdminError(null);
    try {
      const admin = await mosqueService.findAdminByEmail(email);

      // Check unique admin
      const assignedMosque = mosques.find((m) => m.admin_id === admin.id);
      const dbMosque = await mosqueService.fetchMosqueByAdminId(admin.id);
      const conflicting = dbMosque || assignedMosque;
      if (conflicting) {
        setAddAdminError(`Admin "${admin.name}" is already assigned to "${conflicting.name}". Admin must be unique.`);
        setAddAdminId(null);
        return;
      }

      setAddAdminId(admin.id);
      setAddAdminEmail(admin.email);
      setAddAdminError(null);
    } catch (err: any) {
      setAddAdminError(err?.message || 'Failed to find admin.');
      setAddAdminId(null);
    } finally {
      setAddAdminLookingUp(false);
    }
  }, [addAdminEmail, mosques]);

  // ── Tag Creation ─────────────────────────────────────────────────────────

  const handleCreateTag = useCallback(async () => {
    const name = newTagName.trim();
    if (!name) {
      setTagError('Please enter a tag name.');
      return;
    }

    setTagCreating(true);
    setTagError(null);
    try {
      const newTag = await mosqueService.createTag(name);
      setAllTags((prev) => [...prev, newTag]);
      setNewTagName('');
      setTagError(null);
      setShowTagModal(false);
      triggerToast(`Tag "${newTag.name}" created.`);
    } catch (err: any) {
      setTagError(err?.message || 'Failed to create tag.');
    } finally {
      setTagCreating(false);
    }
  }, [newTagName, triggerToast]);

  // ── Filter modal ─────────────────────────────────────────────────────────

  const openFilterModal = useCallback(() => {
    setFilterState({ ...appliedFilters });
    setShowFilterModal(true);
  }, [appliedFilters]);

  const toggleFilterCity = useCallback((city: string) => {
    setFilterState((prev) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city],
    }));
  }, []);

  const toggleFilterAdmin = useCallback((adminId: string) => {
    setFilterState((prev) => ({
      ...prev,
      adminIds: prev.adminIds.includes(adminId)
        ? prev.adminIds.filter((a) => a !== adminId)
        : [...prev.adminIds, adminId],
    }));
  }, []);

  const toggleFilterTag = useCallback((tagId: string) => {
    setFilterState((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((t) => t !== tagId)
        : [...prev.tagIds, tagId],
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filterState });
    setShowFilterModal(false);
  }, [filterState]);

  const clearFilters = useCallback(() => {
    const cleared: FilterState = {
      cities: [],
      adminIds: [],
      tagIds: [],
      status: 'all',
      sortBy: 'newest',
    };
    setFilterState(cleared);
    setAppliedFilters(cleared);
    setShowFilterModal(false);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      appliedFilters.cities.length > 0 ||
      appliedFilters.adminIds.length > 0 ||
      appliedFilters.tagIds.length > 0 ||
      appliedFilters.status !== 'all' ||
      appliedFilters.sortBy !== 'newest'
    );
  }, [appliedFilters]);

  // ── Tag toggle in edit modal ─────────────────────────────────────────────

  const toggleEditTag = useCallback((tagId: string) => {
    setEditSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  }, []);

  // ── Render States ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading mosques...</Text>
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
    <SafeAreaView style={styles.safeArea} >
      {/* Header */}
      <SectionHeader title="Manage Mosques" />

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.light.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, address, city, admin..."
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
        {/* List */}
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
              <Building2 size={48} color={colors.primary} />
              <Text style={styles.emptyText}>
                {searchTerm || hasActiveFilters
                  ? 'No results match your search or filters.'
                  : 'No mosques found in database.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MosqueCard
              item={item}
              distanceText={getDistanceText(item)}
              onPress={() => openDetailModal(item)}
            />
          )}
        />
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setAddAdminError(null);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Mosque</Text>
      </TouchableOpacity>

      {/* ── Detail/Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={detailModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDetailModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.detailModalContainer}>
            {/* Header */}
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>
                {detailModal.mosque?.name || 'Mosque Details'}
              </Text>
              <TouchableOpacity onPress={closeDetailModal} style={styles.detailCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            {editFormError && (
              <View style={styles.modalBannerError}>
                <Text style={styles.modalBannerErrorText}>✕ {editFormError}</Text>
              </View>
            )}

            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              {/* Image preview */}
              {editImageUrl ? (
                <Image source={{ uri: editImageUrl }} style={styles.detailImage} resizeMode="cover" />
              ) : null}

              {/* Active toggle */}
              <View style={styles.detailToggleRow}>
                <Text style={styles.detailLabel}>Active</Text>
                <Switch
                  value={editIsActive}
                  onValueChange={setEditIsActive}
                  trackColor={{ false: colors.light.border, true: colors.primaryLight }}
                  thumbColor={editIsActive ? colors.primary : colors.light.textMuted}
                />
              </View>

              {/* Form fields */}
              <DetailField label="Name" value={editName} onChangeText={(t) => { setEditName(t); setEditFormError(null); }} />
              <DetailField label="Address" value={editAddress} onChangeText={(t) => { setEditAddress(t); setEditFormError(null); }} />
              <DetailField label="City" value={editCity} onChangeText={(t) => { setEditCity(t); setEditFormError(null); }} />
              <View style={styles.detailRow}>
                <View style={styles.detailHalfField}>
                  <DetailField label="Latitude" value={editLatitude} onChangeText={(t) => { setEditLatitude(t); setEditFormError(null); }} keyboardType="numeric" />
                </View>
                <View style={styles.detailHalfField}>
                  <DetailField label="Longitude" value={editLongitude} onChangeText={(t) => { setEditLongitude(t); setEditFormError(null); }} keyboardType="numeric" />
                </View>
              </View>

              {/* Image upload area - click to upload */}
              <Text style={styles.detailLabel}>Image</Text>
              <TouchableOpacity
                style={styles.imageUploadArea}
                onPress={async () => {
                  setEditImageUploading(true);
                  setEditImageError(null);
                  setEditImageSuccess(null);
                  const res = await pickAndUploadImage();
                  if (res.url) {
                    setEditImageUrl(res.url);
                    setEditImageSuccess('Image uploaded successfully.');
                  } else if (res.error) {
                    setEditImageError(res.error);
                  }
                  setEditImageUploading(false);
                }}
                activeOpacity={0.7}
                disabled={editImageUploading}
              >
                {editImageUploading ? (
                  <View style={styles.imageUploadAreaContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.imageUploadAreaText}>Uploading...</Text>
                  </View>
                ) : editImageUrl ? (
                  <View style={styles.imageUploadAreaContent}>
                    <Image source={{ uri: editImageUrl }} style={styles.uploadPreviewImage} resizeMode="cover" />
                    <Text style={styles.imageUploadAreaChangeText}>Tap to change image</Text>
                  </View>
                ) : (
                  <View style={styles.imageUploadAreaContent}>
                    <Camera size={32} color={colors.primary} />
                    <Text style={styles.imageUploadAreaTitle}>Click to upload mosque image</Text>
                    <Text style={styles.imageUploadAreaHint}>JPEG, PNG accepted</Text>
                  </View>
                )}
              </TouchableOpacity>
              {editImageError ? (
                <Text style={styles.adminErrorText}>✕ {editImageError}</Text>
              ) : editImageSuccess ? (
                <Text style={styles.adminVerifiedText}>✓ {editImageSuccess}</Text>
              ) : null}

              {/* Admin Email */}
              <Text style={styles.detailLabel}>Assigned Admin Email</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.detailInput, { flex: 1 }]}
                  value={editAdminEmail}
                  onChangeText={(text) => {
                    setEditAdminEmail(text);
                    setEditAdminId(null);
                    setEditAdminError(null);
                  }}
                  placeholder="admin@example.com"
                  placeholderTextColor={colors.light.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handleEditAdminEmailLookup}
                  activeOpacity={0.7}
                  disabled={editAdminLookingUp}
                >
                  {editAdminLookingUp ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Mail size={18} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
              {editAdminError ? (
                <Text style={styles.adminErrorText}>✕ {editAdminError}</Text>
              ) : editAdminId ? (
                <Text style={styles.adminVerifiedText}>✓ Admin verified</Text>
              ) : null}

              {/* Tags */}
              <Text style={[styles.detailLabel, { marginTop: spacing.md }]}>Tags</Text>
              <View style={styles.tagsContainer}>
                {allTags.map((tag) => {
                  const selected = editSelectedTagIds.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.tagChip, selected && styles.tagChipSelected]}
                      onPress={() => toggleEditTag(tag.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* "+" button to create new tag */}
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={() => {
                    setNewTagName('');
                    setShowTagModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
                {allTags.length === 0 && (
                  <Text style={styles.noTagsText}>No tags available.</Text>
                )}
              </View>

              {/* Action buttons */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.deleteBtn]}
                  onPress={handleDeleteFromDetail}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#ffffff" />
                  <Text style={styles.deleteBtnText}>Delete Mosque</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.saveBtn]}
                  onPress={handleSaveEdit}
                  activeOpacity={0.7}
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Save size={16} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Mosque Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.addModalContainer}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Add New Mosque</Text>
              <TouchableOpacity onPress={closeAddModal} style={styles.detailCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            {addFormError && (
              <View style={styles.modalBannerError}>
                <Text style={styles.modalBannerErrorText}>✕ {addFormError}</Text>
              </View>
            )}

            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              <DetailField label="Name *" value={addName} onChangeText={(t) => { setAddName(t); setAddFormError(null); }} />
              <DetailField label="Address *" value={addAddress} onChangeText={(t) => { setAddAddress(t); setAddFormError(null); }} />
              <DetailField label="City *" value={addCity} onChangeText={(t) => { setAddCity(t); setAddFormError(null); }} />
              <View style={styles.detailRow}>
                <View style={styles.detailHalfField}>
                  <DetailField label="Latitude" value={addLatitude} onChangeText={(t) => { setAddLatitude(t); setAddFormError(null); }} keyboardType="numeric" />
                </View>
                <View style={styles.detailHalfField}>
                  <DetailField label="Longitude" value={addLongitude} onChangeText={(t) => { setAddLongitude(t); setAddFormError(null); }} keyboardType="numeric" />
                </View>
              </View>

              {/* Admin Email */}
              <Text style={styles.detailLabel}>Assigned Admin Email *</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.detailInput, { flex: 1 }]}
                  value={addAdminEmail}
                  onChangeText={(text) => {
                    setAddAdminEmail(text);
                    setAddAdminId(null);
                    setAddAdminError(null);
                  }}
                  placeholder="admin@example.com"
                  placeholderTextColor={colors.light.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handleAddAdminEmailLookup}
                  activeOpacity={0.7}
                  disabled={addAdminLookingUp}
                >
                  {addAdminLookingUp ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Mail size={18} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
              {addAdminError ? (
                <Text style={styles.adminErrorText}>✕ {addAdminError}</Text>
              ) : addAdminId ? (
                <Text style={styles.adminVerifiedText}>✓ Admin verified</Text>
              ) : null}

              {/* Image upload area - click to upload */}
              <Text style={styles.detailLabel}>Image</Text>
              <TouchableOpacity
                style={styles.imageUploadArea}
                onPress={async () => {
                  setAddImageUploading(true);
                  setAddImageError(null);
                  setAddImageSuccess(null);
                  const res = await pickAndUploadImage();
                  if (res.url) {
                    setAddImageUrl(res.url);
                    setAddImageSuccess('Image uploaded successfully.');
                  } else if (res.error) {
                    setAddImageError(res.error);
                  }
                  setAddImageUploading(false);
                }}
                activeOpacity={0.7}
                disabled={addImageUploading}
              >
                {addImageUploading ? (
                  <View style={styles.imageUploadAreaContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.imageUploadAreaText}>Uploading...</Text>
                  </View>
                ) : addImageUrl ? (
                  <View style={styles.imageUploadAreaContent}>
                    <Image source={{ uri: addImageUrl }} style={styles.uploadPreviewImage} resizeMode="cover" />
                    <Text style={styles.imageUploadAreaChangeText}>Tap to change image</Text>
                  </View>
                ) : (
                  <View style={styles.imageUploadAreaContent}>
                    <Camera size={32} color={colors.primary} />
                    <Text style={styles.imageUploadAreaTitle}>Click to upload mosque image</Text>
                    <Text style={styles.imageUploadAreaHint}>JPEG, PNG accepted</Text>
                  </View>
                )}
              </TouchableOpacity>
              {addImageError ? (
                <Text style={styles.adminErrorText}>✕ {addImageError}</Text>
              ) : addImageSuccess ? (
                <Text style={styles.adminVerifiedText}>✓ {addImageSuccess}</Text>
              ) : null}

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.modalBtnCancel]}
                  onPress={closeAddModal}
                >
                  <Text style={[styles.modalBtnTextStyle, { color: colors.light.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.saveBtn]}
                  onPress={handleAddMosque}
                  activeOpacity={0.7}
                  disabled={addSaving}
                >
                  {addSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Plus size={16} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Add Mosque</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Tag Creation Modal ────────────────────────────────────────────── */}
      <Modal
        visible={showTagModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Tag</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter tag name"
              placeholderTextColor={colors.light.textMuted}
              value={newTagName}
              onChangeText={(text) => {
                setNewTagName(text);
                setTagError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {tagError && (
              <Text style={[styles.adminErrorText, { alignSelf: 'flex-start', marginTop: 0 }]}>
                ✕ {tagError}
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setTagError(null);
                  setShowTagModal(false);
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.light.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateTag}
                disabled={tagCreating}
              >
                {tagCreating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Create</Text>
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
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.detailCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterChipsRow}>
                {(['newest', 'oldest', 'a-z', 'z-a'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, filterState.sortBy === option && styles.filterChipSelected]}
                    onPress={() => setFilterState((prev) => ({ ...prev, sortBy: option }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipLabel, filterState.sortBy === option && styles.filterChipLabelSelected]}>
                      {option === 'newest' ? 'Newest' : option === 'oldest' ? 'Oldest' : option === 'a-z' ? 'A-Z' : 'Z-A'}
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

              {/* Cities */}
              {distinctCities.length > 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>City</Text>
                  <View style={styles.filterChipsRow}>
                    {distinctCities.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[styles.filterChip, filterState.cities.includes(city) && styles.filterChipSelected]}
                        onPress={() => toggleFilterCity(city)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterChipLabel, filterState.cities.includes(city) && styles.filterChipLabelSelected]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Admins */}
              {admins.length > 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>Assigned Admin</Text>
                  <View style={styles.filterChipsRow}>
                    {admins.map((admin) => (
                      <TouchableOpacity
                        key={admin.id}
                        style={[styles.filterChip, filterState.adminIds.includes(admin.id) && styles.filterChipSelected]}
                        onPress={() => toggleFilterAdmin(admin.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.filterChipLabel, filterState.adminIds.includes(admin.id) && styles.filterChipLabelSelected]}
                          numberOfLines={1}
                        >
                          {admin.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Tags */}
              {allTags.length > 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>Tags</Text>
                  <View style={styles.filterChipsRow}>
                    {allTags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.filterChip, filterState.tagIds.includes(tag.id) && styles.filterChipSelected]}
                        onPress={() => toggleFilterTag(tag.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterChipLabel, filterState.tagIds.includes(tag.id) && styles.filterChipLabelSelected]}>
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Action buttons */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.modalBtnCancel, { flex: 1 }]}
                  onPress={clearFilters}
                >
                  <Text style={[styles.modalBtnTextStyle, { color: colors.danger }]}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.saveBtn, { flex: 1 }]}
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

      {/* ── Confirm Delete Modal ──────────────────────────────────────────── */}
      <Modal visible={confirm.visible} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {actionLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>Deleting...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Delete Mosque</Text>
                <Text style={styles.modalBody}>
                  Are you sure you want to permanently delete {confirm.mosqueName}? This action cannot be undone.
                </Text>
                {deleteError && (
                  <Text style={[styles.adminErrorText, { textAlign: 'center', marginTop: -spacing.md, marginBottom: spacing.md }]}>
                    ✕ {deleteError}
                  </Text>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={closeConfirm}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.light.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.danger }]}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Delete</Text>
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

// ─── Location Pin Icon ────────────────────────────────────────────────────────

const LocationPinIcon = ({ color = '#03BECD', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (14 / 10)} viewBox="0 0 10 14" fill="none">
    <Path
      d="M5 0C2.23858 0 0 2.23858 0 5C0 8.75 5 14 5 14C5 14 10 8.75 10 5C10 2.23858 7.76142 0 5 0ZM5 6.75C4.0335 6.75 3.25 5.9665 3.25 5C3.25 4.0335 4.0335 3.25 5 3.25C5.9665 3.25 6.75 5.9665 6.75 5C6.75 5.9665 5.9665 6.75 5 6.75Z"
      fill={color}
    />
  </Svg>
);

// ─── Mosque Card ─────────────────────────────────────────────────────────────

interface MosqueCardProps {
  item: MosqueWithAdmin;
  distanceText?: string;
  onPress: () => void;
}

const MosqueCard: React.FC<MosqueCardProps> = React.memo(({ item, distanceText, onPress }) => {
  const { isRtl } = useApp();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
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

        <View style={styles.metaRow}>
          <Text style={styles.cityName} numberOfLines={1}>
            {item.city || 'Detected City'}
          </Text>

          {distanceText ? (
            <View style={styles.distanceBadge}>
              <LocationPinIcon size={11} color={colors.primary} />
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          ) : null}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.is_active
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(228, 72, 72, 0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.is_active ? '#16a34a' : colors.danger },
              ]}
            >
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Chevron Right */}
      <View style={styles.chevronWrapper}>
        <ChevronRight size={22} color="#1D3B6D" />
      </View>
    </TouchableOpacity>
  );
});

// ─── Detail Field ────────────────────────────────────────────────────────────

interface DetailFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, onChangeText, multiline, keyboardType }) => (
  <View style={styles.detailFieldContainer}>
    <Text style={styles.detailLabel}>{label}</Text>
    <TextInput
      style={[styles.detailInput, multiline && styles.detailInputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={colors.light.textMuted}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

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

  // Search + Filter
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
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 150,
    gap: 12,
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

  // Mosque Card
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

  // Thumbnail
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

  // Info Details
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
    flexWrap: 'wrap',
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
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Chevron
  chevronWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
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

  // Detail / Add Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  detailModalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  addModalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  detailModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.light.text,
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
  detailScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Detail image
  detailImage: {
    width: '100%',
    height: 160,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.md,
  },

  // Detail toggle
  detailToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  // Detail field
  detailFieldContainer: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: spacing.xs,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
  },
  detailInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  detailHalfField: {
    flex: 1,
  },

  // Image upload area (clickable)
  imageUploadArea: {
    borderWidth: 2,
    borderColor: colors.light.inputBorder,
    borderStyle: 'dashed',
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 139, 53, 0.04)',
    minHeight: 140,
    marginBottom: spacing.md,
  },
  imageUploadAreaContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imageUploadAreaTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  imageUploadAreaHint: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
    textAlign: 'center',
  },
  imageUploadAreaText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    textAlign: 'center',
  },
  imageUploadAreaChangeText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  uploadPreviewImage: {
    width: '100%',
    height: 120,
    borderRadius: spacing.borderRadiusMd,
  },

  // Image upload row (for edit modal)
  imageUploadRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadBtn: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadiusMd,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Admin verified text
  adminVerifiedText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: '600',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  adminErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: '600',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  modalBannerError: {
    backgroundColor: 'rgba(228, 72, 72, 0.10)',
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(228, 72, 72, 0.25)',
  },
  modalBannerErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: '600',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.surface,
  },
  tagChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  tagChipTextSelected: {
    color: '#ffffff',
  },
  addTagButton: {
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
  noTagsText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    fontStyle: 'italic',
  },

  // Detail actions
  detailActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailActionBtn: {
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
  deleteBtn: {
    backgroundColor: colors.danger,
  },
  deleteBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: '#ffffff',
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
  capacityInput: {
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
  },
  capacitySeparator: {
    fontSize: typography.sizes.lg,
    color: colors.light.textMuted,
    paddingHorizontal: spacing.xs,
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Confirmation Modal
  modalContent: {
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
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.light.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: typography.sizes.base,
    color: colors.light.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  modalBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  modalBtnTextStyle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  modalLoadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  modalLoadingText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.light.text,
  },

  // Tag creation modal input
  emailInput: {
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
});

export default ManageMosquesScreen;