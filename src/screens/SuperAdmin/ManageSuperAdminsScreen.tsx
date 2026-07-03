import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MoreVertical,
  WifiOff,
  Users,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  ShieldOff,
  X,
  ArrowLeft,
  UserPlus,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../hooks/useAuth';
import { Profile } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmState {
  visible: boolean;
  type: 'remove' | 'addConfirm' | null;
  user: Profile | null;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageSuperAdminsScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { triggerToast } = useApp();
  const { profile: currentProfile } = useAuth();

  // Data state
  const [superAdmins, setSuperAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Add Super Admin email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Confirmation modal
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    type: null,
    user: null,
  });

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadSuperAdmins = useCallback(async () => {
    try {
      setError(null);
      const data = await profileService.fetchAllSuperAdmins();
      setSuperAdmins(data || []);
    } catch (err: any) {
      console.error('Failed to fetch super admins:', err);
      setError(err?.message || 'Failed to load super admins from database.');
      setSuperAdmins([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuperAdmins();
  }, [loadSuperAdmins]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSuperAdmins();
  }, [loadSuperAdmins]);

  // ── Sorting: logged-in user always first ─────────────────────────────────

  const sortedAdmins = React.useMemo(() => {
    if (!currentProfile?.id) return superAdmins;
    const loggedIn = superAdmins.filter((a) => a.id === currentProfile.id);
    const others = superAdmins.filter((a) => a.id !== currentProfile.id);
    return [...loggedIn, ...others];
  }, [superAdmins, currentProfile]);

  // ── Filtering (search only) ──────────────────────────────────────────────

  const filteredData = React.useMemo(() => {
    let result = sortedAdmins;
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sortedAdmins, searchTerm]);

  // ── Add Super Admin flow ─────────────────────────────────────────────────

  const handleOpenEmailModal = () => {
    setEmailInput('');
    setEmailError(null);
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Please enter an email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    // Check if already in the list
    const alreadyAdmin = superAdmins.some(
      (a) => a.email?.toLowerCase() === trimmed
    );
    if (alreadyAdmin) {
      setEmailError('This user is already a Super Admin.');
      return;
    }

    setEmailError(null);
    setShowEmailModal(false);

    // Look up the user by email
    try {
      setActionLoading(true);
      const foundProfile = await profileService.findProfileByEmail(trimmed);
      if (!foundProfile) {
        triggerToast('Error: No user found with that email address.');
        setActionLoading(false);
        return;
      }

      // Show confirmation dialog
      setConfirm({
        visible: true,
        type: 'addConfirm',
        user: foundProfile,
      });
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Failed to find user.'}`);
    } finally {
      setActionLoading(false);
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
      if (confirm.type === 'remove') {
        await profileService.updateProfileRole(confirm.user.id, 'worshipper');
        setSuperAdmins((prev) => prev.filter((a) => a.id !== confirm.user!.id));
        triggerToast('Super Admin removed successfully.');
      } else if (confirm.type === 'addConfirm') {
        await profileService.updateProfileRole(confirm.user.id, 'super_admin');
        // Reload to get updated list
        await loadSuperAdmins();
        triggerToast('Super Admin added successfully.');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Action failed.'}`);
    } finally {
      setActionLoading(false);
      setConfirm({ visible: false, type: null, user: null });
    }
  };

  // ── Confirm Modal Config ─────────────────────────────────────────────────

  const confirmConfig = React.useMemo(() => {
    if (!confirm.type || !confirm.user) return null;
    const name = confirm.user.name;
    switch (confirm.type) {
      case 'remove':
        return {
          title: 'Remove Super Admin',
          body: `Are you sure you want to remove ${name} from Super Admin? Their role will be changed to worshipper.`,
          btnLabel: 'Remove',
          btnColor: colors.danger,
        };
      case 'addConfirm':
        return {
          title: 'Add Super Admin',
          body: `Are you sure you want to make ${name} a Super Admin? They will have full administrative access.`,
          btnLabel: 'Add Super Admin',
          btnColor: colors.primary,
        };
    }
  }, [confirm]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading super admins...</Text>
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
        <Text style={styles.headerTitle}>Manage Super Admins</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.light.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
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

      {/* Content area with dismiss overlay behind the list */}
      <View style={styles.contentArea}>
        {/* Dismiss menu on outside tap */}
        {openMenuId && (
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setOpenMenuId(null)}
            activeOpacity={1}
          />
        )}

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
              <Users size={48} color={colors.peach} />
              <Text style={styles.emptyText}>
                {searchTerm
                  ? 'No results match your search.'
                  : 'No super admins found in database.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SuperAdminCard
              item={item}
              isCurrentUser={item.id === currentProfile?.id}
              menuOpen={openMenuId === item.id}
              onMenuToggle={() =>
                setOpenMenuId((prev) => (prev === item.id ? null : item.id))
              }
              onRemove={() => openConfirm('remove', item)}
            />
          )}
        />
      </View>

      {/* Add Super Admin Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenEmailModal}
        activeOpacity={0.8}
      >
        <UserPlus size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Super Admin</Text>
      </TouchableOpacity>

      {/* Email Input Modal */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Super Admin</Text>
            <Text style={styles.modalBody}>
              Enter the email address of the user you want to promote to Super Admin.
            </Text>
            <TextInput
              style={styles.emailInput}
              placeholder="user@example.com"
              placeholderTextColor={colors.light.textMuted}
              value={emailInput}
              onChangeText={(text) => {
                setEmailInput(text);
                if (emailError) setEmailError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError && (
              <Text style={styles.emailErrorText}>{emailError}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.light.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleEmailSubmit}
              >
                <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
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
    </SafeAreaView>
  );
};

// ─── Super Admin Card ────────────────────────────────────────────────────────

interface SuperAdminCardProps {
  item: Profile;
  isCurrentUser: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onRemove: () => void;
}

const SuperAdminCard: React.FC<SuperAdminCardProps> = ({
  item,
  isCurrentUser,
  menuOpen,
  onMenuToggle,
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
    <View
      style={[
        styles.card,
        isCurrentUser && { backgroundColor: 'rgba(246, 139, 53, 0.08)' },
      ]}
    >
      {/* Top row: name + "You" badge + three-dot menu */}
      <View style={styles.cardTopRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name || 'Unnamed'}
          </Text>
          {isCurrentUser && (
            <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.statusText, { color: colors.primary }]}>You</Text>
            </View>
          )}
        </View>

        {/* Three-dot button - hidden for current user */}
        {!isCurrentUser && (
          <View>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={onMenuToggle}
              activeOpacity={0.7}
            >
              <MoreVertical size={18} color={colors.light.textMuted} />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {menuOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={onRemove}
                  activeOpacity={0.7}
                >
                  <ShieldOff size={15} color={colors.danger} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: colors.danger }]}>
                    Remove from Super Admin
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Info rows */}
      <View style={styles.infoList}>
        {item.email ? (
          <InfoRow icon={<Mail size={13} color={colors.primary} />} label={item.email} />
        ) : null}
        {isCurrentUser && (
          <InfoRow
            icon={<ShieldCheck size={13} color={colors.primary} />}
            label="Super Admin (You)"
          />
        )}
        <InfoRow
          icon={<CreditCard size={13} color={colors.primary} />}
          label={`CNIC: ${item.cnic || 'N/A'}`}
        />
        <InfoRow
          icon={<Phone size={13} color={colors.primary} />}
          label={`Phone: ${item.phone || 'N/A'}`}
        />
        {joinedDate && (
          <InfoRow
            icon={<Calendar size={13} color={colors.primary} />}
            label={`Joined: ${joinedDate}`}
          />
        )}
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

  // Content area (wraps dismiss overlay + list)
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    minWidth: 200,
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
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

  // Email Input Modal
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
  emailErrorText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },

  // Status badge (reused for "You" badge)
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

  // Confirmation / Email Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  modalLoadingText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.light.text,
  },
});

export default ManageSuperAdminsScreen;