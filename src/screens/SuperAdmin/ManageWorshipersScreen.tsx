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
  ShieldCheck,
  Trash2,
  X,
  ArrowLeft,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { profileService } from '../../services/profileService';
import { Profile } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterOption = 'all' | 'active' | 'blocked';

interface ConfirmState {
  visible: boolean;
  type: 'block' | 'unblock' | 'delete' | null;
  user: Profile | null;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const ManageWorshipersScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { triggerToast } = useApp();

  // Data state
  const [worshipers, setWorshipers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    type: null,
    user: null,
  });

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadWorshipers = useCallback(async () => {
    try {
      setError(null);
      const data = await profileService.fetchAllWorshipers();
      setWorshipers(data || []);
    } catch (err: any) {
      console.error('Failed to fetch worshipers:', err);
      setError(err?.message || 'Failed to load worshipers from database.');
      setWorshipers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorshipers();
  }, [loadWorshipers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorshipers();
  }, [loadWorshipers]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filteredData = React.useMemo(() => {
    let result = worshipers;

    // Apply status filter
    if (filter === 'active') result = result.filter((w) => !w.is_blocked);
    if (filter === 'blocked') result = result.filter((w) => w.is_blocked);

    // Apply search
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (w) =>
          w.name?.toLowerCase().includes(q) ||
          w.email?.toLowerCase().includes(q) ||
          w.cnic?.toLowerCase().includes(q) ||
          w.phone?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [worshipers, filter, searchTerm]);

  // ── Actions ───────────────────────────────────────────────────────────────

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
      if (confirm.type === 'delete') {
        await profileService.removeWorshiper(confirm.user.id);
        setWorshipers((prev) => prev.filter((w) => w.id !== confirm.user!.id));
        triggerToast('User removed successfully.');
      } else {
        const nextBlocked = confirm.type === 'block';
        await profileService.updateWorshiperStatus(confirm.user.id, nextBlocked);
        setWorshipers((prev) =>
          prev.map((w) =>
            w.id === confirm.user!.id ? { ...w, is_blocked: nextBlocked } : w
          )
        );
        triggerToast(`User ${nextBlocked ? 'blocked' : 'unblocked'} successfully.`);
      }
    } catch (err: any) {
      triggerToast(`Error: ${err?.message || 'Action failed.'}`);
    } finally {
      setActionLoading(false);
      setConfirm({ visible: false, type: null, user: null });
    }
  };

  // ── Confirm Modal Config ───────────────────────────────────────────────────

  const confirmConfig = React.useMemo(() => {
    if (!confirm.type || !confirm.user) return null;
    const name = confirm.user.name;
    switch (confirm.type) {
      case 'block':
        return {
          title: 'Block User',
          body: `Are you sure you want to block ${name}? They will be logged out and unable to access the app.`,
          btnLabel: 'Block User',
          btnColor: colors.danger,
        };
      case 'unblock':
        return {
          title: 'Unblock User',
          body: `Are you sure you want to unblock ${name}? They will regain access to the app.`,
          btnLabel: 'Unblock User',
          btnColor: colors.success,
        };
      case 'delete':
        return {
          title: 'Delete User',
          body: `Are you sure you want to permanently delete ${name}? This action cannot be undone.`,
          btnLabel: 'Delete User',
          btnColor: colors.danger,
        };
    }
  }, [confirm]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading worshipers...</Text>
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
        <Text style={styles.headerTitle}>Manage Worshipers</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.light.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, CNIC, phone..."
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'blocked'] as FilterOption[]).map((opt) => {
          const count =
            opt === 'all'
              ? worshipers.length
              : opt === 'active'
                ? worshipers.filter((w) => !w.is_blocked).length
                : worshipers.filter((w) => w.is_blocked).length;

          return (
            <TouchableOpacity
              key={opt}
              style={[styles.filterChip, filter === opt && styles.filterChipActive]}
              onPress={() => setFilter(opt)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterChipText, filter === opt && styles.filterChipTextActive]}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content area with dismiss overlay behind the list */}
      <View style={styles.contentArea}>
        {/* Dismiss menu on outside tap - placed BEFORE FlatList so FlatList renders on top */}
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
                {searchTerm || filter !== 'all'
                  ? 'No results match your search or filter.'
                  : 'No worshipers found in database.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <WorshiperCard
              item={item}
              menuOpen={openMenuId === item.id}
              onMenuToggle={() =>
                setOpenMenuId((prev) => (prev === item.id ? null : item.id))
              }
              onBlock={() => openConfirm(item.is_blocked ? 'unblock' : 'block', item)}
              onDelete={() => openConfirm('delete', item)}
            />
          )}
        />
      </View>

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

// ─── Worshiper Card ──────────────────────────────────────────────────────────

interface WorshiperCardProps {
  item: Profile;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onBlock: () => void;
  onDelete: () => void;
}

const WorshiperCard: React.FC<WorshiperCardProps> = ({
  item,
  menuOpen,
  onMenuToggle,
  onBlock,
  onDelete,
}) => {
  const isBlocked = !!item.is_blocked;

  const joinedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : null;

  return (
    <View style={styles.card}>
      {/* Top row: name + status badge + three-dot menu */}
      <View style={styles.cardTopRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name || 'Unnamed'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isBlocked ? colors.dangerLight : 'rgba(34,197,94,0.1)' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isBlocked ? colors.danger : colors.success },
              ]}
            >
              {isBlocked ? 'Blocked' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Three-dot button */}
        <View>
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuToggle} activeOpacity={0.7}>
            <MoreVertical size={18} color={colors.light.textMuted} />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {menuOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownItem} onPress={onBlock} activeOpacity={0.7}>
                {isBlocked ? (
                  <ShieldCheck size={15} color={colors.success} style={styles.dropdownIcon} />
                ) : (
                  <ShieldOff size={15} color={colors.danger} style={styles.dropdownIcon} />
                )}
                <Text
                  style={[
                    styles.dropdownText,
                    { color: isBlocked ? colors.success : colors.danger },
                  ]}
                >
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />

              <TouchableOpacity style={styles.dropdownItem} onPress={onDelete} activeOpacity={0.7}>
                <Trash2 size={15} color={colors.danger} style={styles.dropdownIcon} />
                <Text style={[styles.dropdownText, { color: colors.danger }]}>Delete User</Text>
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

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  filterChipTextActive: {
    color: '#ffffff',
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
    minWidth: 160,
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
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.light.border,
    marginHorizontal: spacing.sm,
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

  // Confirmation Modal
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

export default ManageWorshipersScreen;
