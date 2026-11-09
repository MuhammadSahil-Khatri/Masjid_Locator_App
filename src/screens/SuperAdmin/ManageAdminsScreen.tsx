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
} from 'react-native';
import {
  Search,
  MoreVertical,
  WifiOff,
  Users,
  Mail,
  Phone,
  Calendar,
  ShieldOff,
  X,
  UserPlus,
  Building2,
  Ban,
  CheckCircle2,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import SectionHeader from './components/SectionHeader';
import { useApp } from '../../context/AppContext';
import { profileService } from '../../services/profileService';
import { mosqueService, MosqueWithAdmin } from '../../services/mosqueService';
import { Profile } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmState {
  visible: boolean;
  type: 'remove' | 'block' | 'unblock' | null;
  user: Profile | null;
}

interface MosqueNameCache {
  [mosqueId: string]: string;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageAdminsScreen: React.FC = () => {
  const { triggerToast } = useApp();

  // Data state
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [allMosques, setAllMosques] = useState<MosqueWithAdmin[]>([]);
  const [mosqueNames, setMosqueNames] = useState<MosqueNameCache>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Add Admin Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addMosqueId, setAddMosqueId] = useState<string | null>(null);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  // Mosque Picker modal state
  const [showMosquePicker, setShowMosquePicker] = useState(false);
  const [mosqueSearch, setMosqueSearch] = useState('');

  // Confirmation modal
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    type: null,
    user: null,
  });

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadAdmins = useCallback(async () => {
    try {
      setError(null);
      const [adminsData, mosquesData] = await Promise.all([
        profileService.fetchAllAdmins(),
        mosqueService.fetchAllMosques(),
      ]);

      setAdmins(adminsData || []);
      setAllMosques(mosquesData || []);

      // Build mosque name lookup map from all mosques
      const cache: MosqueNameCache = {};
      (mosquesData || []).forEach((m) => {
        cache[m.id] = m.name;
      });
      setMosqueNames(cache);
    } catch (err: any) {
      console.error('Failed to fetch admins:', err);
      setError(err?.message || 'Failed to load admins from database.');
      setAdmins([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdmins();
  }, [loadAdmins]);

  // ── Filtering (search only) ──────────────────────────────────────────────

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
    );
  }, [admins, searchTerm]);

  // Filtered mosques for picker
  const filteredMosques = useMemo(() => {
    const q = mosqueSearch.trim().toLowerCase();
    if (!q) return allMosques;
    return allMosques.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q)
    );
  }, [allMosques, mosqueSearch]);

  // ── Add Admin Flow ───────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setAddEmail('');
    setAddPassword('');
    setAddName('');
    setAddPhone('');
    setAddMosqueId(null);
    setAddFormError(null);
    setMosqueSearch('');
    setShowAddModal(true);
  };

  const closeAddModal = useCallback(() => {
    if (addSaving) return;
    setShowAddModal(false);
    setShowMosquePicker(false);
    setAddEmail('');
    setAddPassword('');
    setAddName('');
    setAddPhone('');
    setAddMosqueId(null);
    setAddFormError(null);
  }, [addSaving]);

  // Submit: Create brand-new admin user
  const handleAddAdmin = async () => {
    setAddFormError(null);

    const email = addEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setAddFormError('Email is required.');
      return;
    }
    if (!emailRegex.test(email)) {
      setAddFormError('Please enter a valid email address.');
      return;
    }
    if (!addPassword || addPassword.length < 8) {
      setAddFormError('Password must be at least 8 characters.');
      return;
    }
    if (!addName.trim()) {
      setAddFormError('Admin Name is required.');
      return;
    }
    if (!addMosqueId) {
      setAddFormError('Assigned Mosque is required. Admins must have an assigned mosque.');
      return;
    }

    // Check if mosque already has an admin
    const targetMosque = allMosques.find((m) => m.id === addMosqueId);
    if (targetMosque?.admin_id) {
      setAddFormError(
        `Selected mosque is already assigned to "${targetMosque.admin_name || 'another admin'}". A mosque can only have one admin.`
      );
      return;
    }

    try {
      setAddSaving(true);
      await profileService.createAdminUser(
        email,
        addPassword,
        addName.trim(),
        addPhone.trim() || null,
        addMosqueId,
      );

      closeAddModal();
      triggerToast('Admin created successfully.');
      await loadAdmins();
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      setAddFormError(err?.message || 'Failed to create admin.');
    } finally {
      setAddSaving(false);
    }
  };

  // ── Confirmation Actions ─────────────────────────────────────────────────

  const openConfirm = (type: ConfirmState['type'], user: Profile) => {
    setOpenMenuId(null);
    setConfirm({ visible: true, type, user });
  };

  const closeConfirm = () => {
    if (actionLoading) return;
    setConfirm({ visible: false, type: null, user: null });
  };

  const handleConfirm = async () => {
    if (!confirm.user || !confirm.type) return;
    setActionLoading(true);

    try {
      switch (confirm.type) {
        case 'remove':
          await profileService.removeAdmin(confirm.user.id, confirm.user.mosque_id);
          setAdmins((prev) => prev.filter((a) => a.id !== confirm.user!.id));
          triggerToast('Admin removed successfully.');
          await loadAdmins();
          break;

        case 'block':
          await profileService.updateWorshiperStatus(confirm.user.id, true);
          setAdmins((prev) =>
            prev.map((a) => (a.id === confirm.user!.id ? { ...a, is_blocked: true } : a))
          );
          triggerToast(`${confirm.user.name} has been blocked.`);
          break;

        case 'unblock':
          await profileService.updateWorshiperStatus(confirm.user.id, false);
          setAdmins((prev) =>
            prev.map((a) => (a.id === confirm.user!.id ? { ...a, is_blocked: false } : a))
          );
          triggerToast(`${confirm.user.name} has been unblocked.`);
          break;
      }
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Action failed.'}`);
    } finally {
      setActionLoading(false);
      setConfirm({ visible: false, type: null, user: null });
    }
  };

  // ── Confirm Modal Config ─────────────────────────────────────────────────

  const confirmConfig = useMemo(() => {
    if (!confirm.type || !confirm.user) return null;
    const name = confirm.user.name;
    switch (confirm.type) {
      case 'remove':
        return {
          title: 'Remove Admin',
          body: `Remove ${name} from Admin? Their mosque assignment and account will be deleted.`,
          btnLabel: 'Remove',
          btnColor: colors.danger,
        };
      case 'block':
        return {
          title: 'Block Admin',
          body: `Block ${name}? They will lose access to the app until unblocked.`,
          btnLabel: 'Block',
          btnColor: colors.danger,
        };
      case 'unblock':
        return {
          title: 'Unblock Admin',
          body: `Unblock ${name}? They will regain access to the app.`,
          btnLabel: 'Unblock',
          btnColor: colors.success,
        };
      default:
        return null;
    }
  }, [confirm]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading admins...</Text>
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
    <View style={styles.safeArea}>
      {/* Header */}
      <SectionHeader title="Manage Admins" />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.light.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone..."
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

      {/* Content area */}
      <View style={styles.contentArea}>
        {openMenuId && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setOpenMenuId(null)}
            activeOpacity={1}
          />
        )}

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
              <Users size={48} color={colors.primary} />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No results match your search.' : 'No admins found in database.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AdminCard
              item={item}
              mosqueName={item.mosque_id ? (mosqueNames[item.mosque_id] ?? null) : null}
              menuOpen={openMenuId === item.id}
              onMenuToggle={() =>
                setOpenMenuId((prev) => (prev === item.id ? null : item.id))
              }
              onBlock={() => openConfirm(item.is_blocked ? 'unblock' : 'block', item)}
              onRemove={() => openConfirm('remove', item)}
            />
          )}
        />
      </View>

      {/* Add Admin Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenAddModal}
        activeOpacity={0.8}
      >
        <UserPlus size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Admin</Text>
      </TouchableOpacity>

      {/* ── Add Admin Modal ──────────────────────────────────────────────── */}
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
              <Text style={styles.detailModalTitle}>Add New Admin</Text>
              <TouchableOpacity onPress={closeAddModal} style={styles.detailCloseBtn}>
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            {addFormError && (
              <View style={styles.modalBannerError}>
                <Text style={styles.modalBannerErrorText}>✕ {addFormError}</Text>
              </View>
            )}

            <ScrollView
              style={styles.detailScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Required fields notice */}
              <Text style={styles.requiredHint}>Fields marked with * are required</Text>

              {/* ── Email ──────────────────────────────────────────────── */}
              <DetailField
                label="Email *"
                value={addEmail}
                onChangeText={(t) => { setAddEmail(t); setAddFormError(null); }}
                placeholder="admin@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* ── Password ───────────────────────────────────────────── */}
              <DetailField
                label="Password *"
                value={addPassword}
                onChangeText={(t) => { setAddPassword(t); setAddFormError(null); }}
                placeholder="Minimum 8 characters"
                secureTextEntry
              />

              {/* ── Admin Name ─────────────────────────────────────────── */}
              <DetailField
                label="Admin Name *"
                value={addName}
                onChangeText={(t) => { setAddName(t); setAddFormError(null); }}
                placeholder="e.g. Abdullah Khan"
              />

              {/* ── Phone (Optional) ───────────────────────────────────── */}
              <DetailField
                label="Phone Number"
                value={addPhone}
                onChangeText={(t) => { setAddPhone(t); setAddFormError(null); }}
                placeholder="e.g. +92 300 1234567 (Optional)"
                keyboardType="phone-pad"
              />

              {/* ── Assigned Mosque ────────────────────────────────────── */}
              <Text style={styles.detailLabel}>Assign a Mosque *</Text>

              <TouchableOpacity
                style={[
                  styles.mosqueSelectBtn,
                  addMosqueId ? styles.mosqueSelectBtnActive : null,
                ]}
                onPress={() => setShowMosquePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.mosqueSelectInfo}>
                  <Building2
                    size={18}
                    color={addMosqueId ? colors.primary : colors.light.textMuted}
                  />
                  <Text
                    style={[
                      styles.mosqueSelectText,
                      addMosqueId ? styles.mosqueSelectTextActive : null,
                    ]}
                    numberOfLines={1}
                  >
                    {addMosqueId
                      ? mosqueNames[addMosqueId] || 'Selected Mosque'
                      : 'Select a Mosque *'}
                  </Text>
                </View>
                <ChevronDown size={18} color={colors.light.textMuted} />
              </TouchableOpacity>

              {/* ── Action Buttons ────────────────────────────────────── */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.modalBtnCancel]}
                  onPress={closeAddModal}
                >
                  <Text style={[styles.modalBtnText, { color: colors.light.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.saveBtn]}
                  onPress={handleAddAdmin}
                  activeOpacity={0.7}
                  disabled={addSaving}
                >
                  {addSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <UserPlus size={16} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Add Admin</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Mosque Picker Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showMosquePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMosquePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Select Mosque</Text>
              <TouchableOpacity
                onPress={() => setShowMosquePicker(false)}
                style={styles.detailCloseBtn}
              >
                <X size={20} color={colors.light.text} />
              </TouchableOpacity>
            </View>

            {/* Mosque Search */}
            <View style={styles.pickerSearchRow}>
              <Search size={16} color={colors.light.textMuted} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search mosque or city..."
                placeholderTextColor={colors.light.textMuted}
                value={mosqueSearch}
                onChangeText={setMosqueSearch}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Mosque List */}
            <FlatList
              data={filteredMosques}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.pickerListContent}
              renderItem={({ item }) => {
                const isSelected = addMosqueId === item.id;
                const isAssigned = !!item.admin_id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setAddMosqueId(item.id);
                      setAddFormError(null);
                      setShowMosquePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerItemTextContainer}>
                      <Text
                        style={[
                          styles.pickerItemTitle,
                          isSelected && styles.pickerItemTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.pickerItemSubtitle} numberOfLines={1}>
                        {item.city} • {item.address}
                      </Text>
                      {isAssigned ? (
                        <Text style={styles.pickerItemAssignedText}>
                          Assigned to: {item.admin_name || 'Another Admin'}
                        </Text>
                      ) : (
                        <Text style={styles.pickerItemAvailableText}>
                          ● Available
                        </Text>
                      )}
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyText}>No mosques found.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
      <Modal visible={confirm.visible} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {actionLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>Processing...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>{confirmConfig?.title}</Text>
                <Text style={styles.modalBody}>{confirmConfig?.body}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={closeConfirm}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.light.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: confirmConfig?.btnColor }]}
                    onPress={handleConfirm}
                  >
                    <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>
                      {confirmConfig?.btnLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── DetailField Component ───────────────────────────────────────────────────

interface DetailFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
}

const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
  placeholder,
  autoCapitalize,
  secureTextEntry,
}) => (
  <View style={styles.detailFieldContainer}>
    <Text style={styles.detailLabel}>{label}</Text>
    <TextInput
      style={[styles.detailInput, multiline && styles.detailInputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.light.textMuted}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

// ─── Admin Card ──────────────────────────────────────────────────────────────

interface AdminCardProps {
  item: Profile;
  mosqueName: string | null;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onBlock: () => void;
  onRemove: () => void;
}

const AdminCard: React.FC<AdminCardProps> = ({
  item,
  mosqueName,
  menuOpen,
  onMenuToggle,
  onBlock,
  onRemove,
}) => {
  const joinedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : null;

  return (
    <View style={[styles.card, item.is_blocked && styles.cardBlocked]}>
      {/* Top row: name + badges + three-dot menu */}
      <View style={styles.cardTopRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name || 'Unnamed'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>Admin</Text>
          </View>
          {item.is_blocked && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(228,72,72,0.12)' }]}>
              <Text style={[styles.statusText, { color: colors.danger }]}>Blocked</Text>
            </View>
          )}
        </View>

        {/* Three-dot menu */}
        <View>
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuToggle} activeOpacity={0.7}>
            <MoreVertical size={18} color={colors.light.textMuted} />
          </TouchableOpacity>

          {menuOpen && (
            <View style={styles.dropdownMenu}>
              {/* Block / Unblock */}
              <TouchableOpacity style={styles.dropdownItem} onPress={onBlock} activeOpacity={0.7}>
                {item.is_blocked ? (
                  <>
                    <CheckCircle2 size={15} color={colors.success} style={styles.dropdownIcon} />
                    <Text style={[styles.dropdownText, { color: colors.success }]}>
                      Unblock Admin
                    </Text>
                  </>
                ) : (
                  <>
                    <Ban size={15} color={colors.danger} style={styles.dropdownIcon} />
                    <Text style={[styles.dropdownText, { color: colors.danger }]}>Block Admin</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />

              {/* Remove */}
              <TouchableOpacity style={styles.dropdownItem} onPress={onRemove} activeOpacity={0.7}>
                <ShieldOff size={15} color={colors.danger} style={styles.dropdownIcon} />
                <Text style={[styles.dropdownText, { color: colors.danger }]}>Remove Admin</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Info rows */}
      <View style={styles.infoList}>
        {item.email ? (
          <InfoRow icon={<Mail size={13} color={colors.primary} />} label={item.email} />
        ) : null}
        <InfoRow
          icon={<Phone size={13} color={colors.primary} />}
          label={item.phone ? item.phone : 'No phone'}
        />
        {joinedDate && (
          <InfoRow
            icon={<Calendar size={13} color={colors.primary} />}
            label={`Joined: ${joinedDate}`}
          />
        )}
        <InfoRow
          icon={<Building2 size={13} color={colors.primary} />}
          label={mosqueName ? mosqueName : 'No mosque assigned'}
        />
      </View>
    </View>
  );
};

// ─── Info Row Helper ─────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <Text style={styles.infoText} numberOfLines={1}>
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.light.inputBorder,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
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

  // Card
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBlocked: {
    borderColor: 'rgba(228,72,72,0.3)',
    backgroundColor: 'rgba(228,72,72,0.02)',
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

  // Three-dot menu
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 36,
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.light.border,
    marginHorizontal: spacing.sm,
  },
  dropdownIcon: {},
  dropdownText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },

  // Info rows
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

  // Add Modal Styles
  addModalContainer: {
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  detailModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.light.text,
  },
  detailCloseBtn: {
    padding: spacing.xs,
  },
  requiredHint: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  detailScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalBannerError: {
    backgroundColor: 'rgba(228, 72, 72, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
  },
  modalBannerErrorText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.light.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailFieldHint: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
    marginBottom: spacing.xs,
  },
  detailFieldContainer: {
    marginBottom: spacing.md,
  },
  detailInput: {
    backgroundColor: colors.light.card,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.light.text,
  },
  detailInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  lookupBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.borderRadiusMd,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  adminVerifiedText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  mosqueSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.card,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  mosqueSelectBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15, 107, 115, 0.04)',
  },
  mosqueSelectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  mosqueSelectText: {
    fontSize: typography.sizes.base,
    color: colors.light.textMuted,
    flex: 1,
  },
  mosqueSelectTextActive: {
    color: colors.light.text,
    fontWeight: '600',
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    gap: spacing.xs,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Mosque Picker Modal
  pickerModalContainer: {
    backgroundColor: colors.light.surface,
    borderRadius: spacing.borderRadiusLg,
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.light.text,
    paddingVertical: 6,
  },
  pickerListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  pickerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15, 107, 115, 0.08)',
  },
  pickerItemTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  pickerItemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.light.text,
    marginBottom: 2,
  },
  pickerItemTitleSelected: {
    color: colors.primary,
  },
  pickerItemSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.light.textMuted,
    marginBottom: 2,
  },
  pickerItemAssignedText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
  },
  pickerItemAvailableText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  pickerEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pickerEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
  },

  // Modal (Generic / Confirmation)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
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
  modalLoadingContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  modalLoadingText: {
    fontSize: typography.sizes.sm,
    color: colors.light.textMuted,
  },
});