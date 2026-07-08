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
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
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
  capacityMin: string;
  capacityMax: string;
  sortBy: 'newest' | 'oldest' | 'a-z' | 'z-a';
}

interface DetailModalState {
  visible: boolean;
  mosque: MosqueWithAdmin | null;
}

type AddField = 'name' | 'address' | 'city' | 'latitude' | 'longitude' | 'description' | 'image_url' | 'capacity' | 'google_maps_url';

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageMosquesScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { triggerToast } = useApp();

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
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSelectedTagIds, setEditSelectedTagIds] = useState<string[]>([]);
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminId, setEditAdminId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addLatitude, setAddLatitude] = useState('');
  const [addLongitude, setAddLongitude] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addCapacity, setAddCapacity] = useState('');
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminId, setAddAdminId] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addImageUploading, setAddImageUploading] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);

  // Tag creation modal
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [tagCreating, setTagCreating] = useState(false);

  // Filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    cities: [],
    adminIds: [],
    tagIds: [],
    status: 'all',
    capacityMin: '',
    capacityMax: '',
    sortBy: 'newest',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    cities: [],
    adminIds: [],
    tagIds: [],
    status: 'all',
    capacityMin: '',
    capacityMax: '',
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
    if (appliedFilters.capacityMin) {
      const min = parseInt(appliedFilters.capacityMin, 10);
      if (!isNaN(min)) {
        result = result.filter((m) => m.capacity !== null && m.capacity >= min);
      }
    }
    if (appliedFilters.capacityMax) {
      const max = parseInt(appliedFilters.capacityMax, 10);
      if (!isNaN(max)) {
        result = result.filter((m) => m.capacity !== null && m.capacity <= max);
      }
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

  // ── Image Picker ─────────────────────────────────────────────────────────

  const pickAndUploadImage = useCallback(async (): Promise<string | null> => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        triggerToast('Permission to access media library is required.');
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const selectedUri = result.assets[0].uri;

      // Upload to Supabase storage
      const uploadedUrl = await mosqueService.uploadMosqueImage(selectedUri);
      return uploadedUrl;
    } catch (err: any) {
      triggerToast(`Error picking/uploading image: ${err?.message}`);
      return null;
    }
  }, [triggerToast]);

  // ── Detail/Edit Modal ────────────────────────────────────────────────────

  const openDetailModal = useCallback((mosque: MosqueWithAdmin) => {
    setDetailModal({ visible: true, mosque });
    setEditName(mosque.name || '');
    setEditAddress(mosque.address || '');
    setEditCity(mosque.city || '');
    setEditLatitude(mosque.latitude?.toString() || '');
    setEditLongitude(mosque.longitude?.toString() || '');
    setEditDescription(mosque.description || '');
    setEditImageUrl(mosque.image_url || '');
    setEditCapacity(mosque.capacity?.toString() || '');
    setEditIsActive(mosque.is_active);
    setEditAdminId(mosque.admin_id || null);
    setEditAdminEmail(mosque.admin_email || '');
    // Load tag IDs for this mosque
    mosqueService.getMosqueTagIds(mosque.id).then((ids) => {
      setEditSelectedTagIds(ids);
    }).catch(() => {
      setEditSelectedTagIds([]);
    });
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModal({ visible: false, mosque: null });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!detailModal.mosque) return;
    setEditSaving(true);

    try {
      await mosqueService.updateMosque(detailModal.mosque.id, {
        name: editName,
        address: editAddress,
        city: editCity,
        latitude: parseFloat(editLatitude) || 0,
        longitude: parseFloat(editLongitude) || 0,
        description: editDescription || null,
        image_url: editImageUrl || null,
        capacity: editCapacity ? parseInt(editCapacity, 10) : null,
        is_active: editIsActive,
        admin_id: editAdminId || null,
      });

      // Update tags
      await mosqueService.updateMosqueTags(detailModal.mosque.id, editSelectedTagIds);

      triggerToast('Mosque updated successfully.');
      closeDetailModal();
      // Refresh data
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to update mosque.'}`);
    } finally {
      setEditSaving(false);
    }
  }, [detailModal.mosque, editName, editAddress, editCity, editLatitude, editLongitude, editDescription, editImageUrl, editCapacity, editIsActive, editAdminId, editSelectedTagIds, triggerToast, closeDetailModal, loadData]);

  const handleDeleteFromDetail = useCallback(() => {
    if (!detailModal.mosque) return;
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
      triggerToast('Please enter an admin email.');
      return;
    }
    try {
      const admin = await mosqueService.findAdminByEmail(email);
      setEditAdminId(admin.id);
      setEditAdminEmail(admin.email);
      triggerToast(`Admin "${admin.name}" assigned.`);
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to find admin.'}`);
      setEditAdminId(null);
    }
  }, [editAdminEmail, triggerToast]);

  // ── Confirm Delete ───────────────────────────────────────────────────────

  const closeConfirm = useCallback(() => {
    if (actionLoading) return;
    setConfirm({ visible: false, mosqueId: null, mosqueName: '' });
  }, [actionLoading]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirm.mosqueId) return;
    setActionLoading(true);

    try {
      await mosqueService.deleteMosque(confirm.mosqueId);
      triggerToast('Mosque deleted successfully.');
      closeDetailModal();
      setConfirm({ visible: false, mosqueId: null, mosqueName: '' });
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to delete mosque.'}`);
    } finally {
      setActionLoading(false);
    }
  }, [confirm.mosqueId, triggerToast, closeDetailModal, loadData]);

  // ── Add Mosque ───────────────────────────────────────────────────────────

  const handleAddMosque = useCallback(async () => {
    if (!addName.trim() || !addAddress.trim() || !addCity.trim()) {
      triggerToast('Error: Name, Address, and City are required.');
      return;
    }

    setAddSaving(true);

    try {
      await mosqueService.createMosque({
        name: addName.trim(),
        address: addAddress.trim(),
        city: addCity.trim(),
        latitude: parseFloat(addLatitude) || 0,
        longitude: parseFloat(addLongitude) || 0,
        description: addDescription.trim() || null,
        image_url: addImageUrl.trim() || null,
        admin_id: addAdminId || null,
        capacity: addCapacity ? parseInt(addCapacity, 10) : null,
        is_active: true,
      });

      triggerToast('Mosque added successfully.');
      setShowAddModal(false);
      // Reset form
      setAddName('');
      setAddAddress('');
      setAddCity('');
      setAddLatitude('');
      setAddLongitude('');
      setAddDescription('');
      setAddImageUrl('');
      setAddCapacity('');
      setAddAdminEmail('');
      setAddAdminId(null);
      loadData();
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to add mosque.'}`);
    } finally {
      setAddSaving(false);
    }
  }, [addName, addAddress, addCity, addLatitude, addLongitude, addDescription, addImageUrl, addCapacity, addAdminId, triggerToast, loadData]);

  // ── Admin Email Lookup (Add) ─────────────────────────────────────────────

  const handleAddAdminEmailLookup = useCallback(async () => {
    const email = addAdminEmail.trim();
    if (!email) {
      triggerToast('Please enter an admin email.');
      return;
    }
    try {
      const admin = await mosqueService.findAdminByEmail(email);
      setAddAdminId(admin.id);
      setAddAdminEmail(admin.email);
      triggerToast(`Admin "${admin.name}" assigned.`);
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to find admin.'}`);
      setAddAdminId(null);
    }
  }, [addAdminEmail, triggerToast]);

  // ── Tag Creation ─────────────────────────────────────────────────────────

  const handleCreateTag = useCallback(async () => {
    const name = newTagName.trim();
    if (!name) {
      triggerToast('Please enter a tag name.');
      return;
    }

    setTagCreating(true);
    try {
      const newTag = await mosqueService.createTag(name);
      setAllTags((prev) => [...prev, newTag]);
      setNewTagName('');
      setShowTagModal(false);
      triggerToast(`Tag "${newTag.name}" created.`);
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to create tag.'}`);
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
      capacityMin: '',
      capacityMax: '',
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
      appliedFilters.capacityMin !== '' ||
      appliedFilters.capacityMax !== '' ||
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
        <Text style={styles.headerTitle}>Manage Mosques</Text>
        <View style={styles.headerSpacer} />
      </View>

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
              <Building2 size={48} color={colors.peach} />
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
              onPress={() => openDetailModal(item)}
            />
          )}
        />
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
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
              <DetailField label="Name" value={editName} onChangeText={setEditName} />
              <DetailField label="Address" value={editAddress} onChangeText={setEditAddress} />
              <DetailField label="City" value={editCity} onChangeText={setEditCity} />
              <View style={styles.detailRow}>
                <View style={styles.detailHalfField}>
                  <DetailField label="Latitude" value={editLatitude} onChangeText={setEditLatitude} keyboardType="numeric" />
                </View>
                <View style={styles.detailHalfField}>
                  <DetailField label="Longitude" value={editLongitude} onChangeText={setEditLongitude} keyboardType="numeric" />
                </View>
              </View>
              <DetailField label="Description" value={editDescription} onChangeText={setEditDescription} multiline />

              {/* Image upload area - click to upload */}
              <Text style={styles.detailLabel}>Image</Text>
              <TouchableOpacity
                style={styles.imageUploadArea}
                onPress={async () => {
                  setEditImageUploading(true);
                  const url = await pickAndUploadImage();
                  if (url) {
                    setEditImageUrl(url);
                    triggerToast('Image uploaded successfully.');
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

              <DetailField label="Capacity" value={editCapacity} onChangeText={setEditCapacity} keyboardType="numeric" />

              {/* Admin Email */}
              <Text style={styles.detailLabel}>Assigned Admin Email</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.detailInput, { flex: 1 }]}
                  value={editAdminEmail}
                  onChangeText={(text) => {
                    setEditAdminEmail(text);
                    setEditAdminId(null);
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
                >
                  <Mail size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {editAdminId && (
                <Text style={styles.adminVerifiedText}>✓ Admin verified</Text>
              )}

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
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.addModalContainer}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Add Mosque</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.detailCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              <DetailField label="Name *" value={addName} onChangeText={setAddName} />
              <DetailField label="Address *" value={addAddress} onChangeText={setAddAddress} />
              <DetailField label="City *" value={addCity} onChangeText={setAddCity} />
              <View style={styles.detailRow}>
                <View style={styles.detailHalfField}>
                  <DetailField label="Latitude" value={addLatitude} onChangeText={setAddLatitude} keyboardType="numeric" />
                </View>
                <View style={styles.detailHalfField}>
                  <DetailField label="Longitude" value={addLongitude} onChangeText={setAddLongitude} keyboardType="numeric" />
                </View>
              </View>
              <DetailField label="Description" value={addDescription} onChangeText={setAddDescription} multiline />

              <DetailField label="Capacity" value={addCapacity} onChangeText={setAddCapacity} keyboardType="numeric" />

              {/* Admin Email */}
              <Text style={styles.detailLabel}>Assigned Admin Email *</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.detailInput, { flex: 1 }]}
                  value={addAdminEmail}
                  onChangeText={(text) => {
                    setAddAdminEmail(text);
                    setAddAdminId(null);
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
                >
                  <Mail size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {addAdminId && (
                <Text style={styles.adminVerifiedText}>✓ Admin verified</Text>
              )}

              {/* Image upload area - click to upload */}
              <Text style={styles.detailLabel}>Image</Text>
              <TouchableOpacity
                style={styles.imageUploadArea}
                onPress={async () => {
                  setAddImageUploading(true);
                  const url = await pickAndUploadImage();
                  if (url) {
                    setAddImageUrl(url);
                    triggerToast('Image uploaded successfully.');
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

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.modalBtnCancel]}
                  onPress={() => setShowAddModal(false)}
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
              onChangeText={setNewTagName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowTagModal(false)}
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

              {/* Capacity Range */}
              <Text style={styles.filterSectionTitle}>Capacity Range (optional)</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailHalfField}>
                  <TextInput
                    style={styles.capacityInput}
                    placeholder="Min"
                    placeholderTextColor={colors.light.textMuted}
                    value={filterState.capacityMin}
                    onChangeText={(t) => setFilterState((prev) => ({ ...prev, capacityMin: t }))}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.capacitySeparator}>-</Text>
                <View style={styles.detailHalfField}>
                  <TextInput
                    style={styles.capacityInput}
                    placeholder="Max"
                    placeholderTextColor={colors.light.textMuted}
                    value={filterState.capacityMax}
                    onChangeText={(t) => setFilterState((prev) => ({ ...prev, capacityMax: t }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

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

// ─── Mosque Card ─────────────────────────────────────────────────────────────

interface MosqueCardProps {
  item: MosqueWithAdmin;
  onPress: () => void;
}

const MosqueCard: React.FC<MosqueCardProps> = React.memo(({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Background image if available */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardBgImage} resizeMode="cover" />
      ) : null}

      {/* Overlay for readability */}
      <View style={[styles.cardOverlay, item.image_url ? styles.cardOverlayDark : null]}>
        {/* Top row: name + status */}
        <View style={styles.cardTopRow}>
          <View style={styles.nameBlock}>
            <Text
              style={[styles.cardName, item.image_url && { color: '#ffffff' }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.is_active ? 'rgba(34,197,94,0.15)' : colors.dangerLight },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: item.is_active ? colors.success : colors.danger },
                ]}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoList}>
          <InfoRow
            icon={<MapPin size={13} color={item.image_url ? '#fff' : colors.primary} />}
            label={`${item.city}${item.address ? ` · ${item.address}` : ''}`}
            light={!!item.image_url}
          />
          {/* Admin name - always show */}
          <InfoRow
            icon={<Users size={13} color={item.image_url ? '#fff' : colors.primary} />}
            label={item.admin_name ? `Admin: ${item.admin_name}` : 'No Admin Assigned'}
            light={!!item.image_url}
          />
          {item.tags.length > 0 && (
            <View style={styles.cardTagsRow}>
              <Tag size={13} color={item.image_url ? '#fff' : colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.cardTagsText, item.image_url && { color: '#ffffffcc' }]} numberOfLines={1}>
                {item.tags.join(', ')}
              </Text>
            </View>
          )}
          {item.capacity !== null && (
            <InfoRow
              icon={<Users size={13} color={item.image_url ? '#fff' : colors.primary} />}
              label={`Capacity: ${item.capacity}`}
              light={!!item.image_url}
            />
          )}
        </View>
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

// ─── Info Row Helper ─────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; light?: boolean }> = ({ icon, label, light }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <Text style={[styles.infoText, light && { color: '#ffffffcc' }]} numberOfLines={1}>
      {label}
    </Text>
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
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.light.border,
    minHeight: 120,
  },
  cardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  cardOverlay: {
    padding: spacing.md,
  },
  cardOverlayDark: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nameBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  cardName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.light.text,
    flexShrink: 1,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTagsText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    flex: 1,
  },

  // Info rows (reused)
  infoList: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 18,
    alignItems: 'center',
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
    flex: 1,
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