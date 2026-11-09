import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
    Image,
} from 'react-native';
import {
    Save,
    Camera,
    WifiOff,
    MapPin,
    RefreshCw,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { mosqueService } from '../../services/mosqueService';
import SectionHeader from './components/SectionHeader';
import * as ImagePicker from 'expo-image-picker';

// Only the columns that exist in the DB schema
interface MosqueFields {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    image_url: string | null;
    is_active: boolean;
}

export const AssignedMosqueScreen: React.FC = () => {
    const { triggerToast } = useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mosque, setMosque] = useState<MosqueFields | null>(null);

    // Edit form state — mirrors schema columns only
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editImageUrl, setEditImageUrl] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    const loadMosque = useCallback(async () => {
        try {
            setError(null);
            const data = await mosqueService.fetchAdminMosque();
            if (!data) {
                setError('No mosque is assigned to your account.');
                setMosque(null);
                return;
            }
            setMosque(data);
            setEditName(data.name || '');
            setEditAddress(data.address || '');
            setEditCity(data.city || '');
            setEditLatitude(data.latitude?.toString() || '');
            setEditLongitude(data.longitude?.toString() || '');
            setEditImageUrl(data.image_url || '');
            setEditIsActive(data.is_active);
        } catch (err: any) {
            console.error('Failed to load mosque:', err);
            setError(err?.message || 'Failed to load mosque data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMosque();
    }, [loadMosque]);

    // Image picker + upload
    const pickAndUploadImage = useCallback(async (): Promise<string | null> => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                triggerToast('Permission to access media library is required.');
                return null;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return null;

            const uploadedUrl = await mosqueService.uploadMosqueImage(result.assets[0].uri);
            return uploadedUrl;
        } catch (err: any) {
            triggerToast(`Image upload failed: ${err?.message || 'Unknown error'}`);
            return null;
        }
    }, [triggerToast]);

    const handleSave = useCallback(async () => {
        if (!mosque) return;

        const lat = parseFloat(editLatitude);
        const lng = parseFloat(editLongitude);

        if (!editName.trim()) {
            triggerToast('Mosque name is required.');
            return;
        }
        if (!editAddress.trim()) {
            triggerToast('Address is required.');
            return;
        }
        if (!editCity.trim()) {
            triggerToast('City is required.');
            return;
        }
        if (isNaN(lat) || isNaN(lng)) {
            triggerToast('Please enter valid latitude and longitude values.');
            return;
        }

        setSaving(true);
        try {
            await mosqueService.updateMosque(mosque.id, {
                name: editName.trim(),
                address: editAddress.trim(),
                city: editCity.trim(),
                latitude: lat,
                longitude: lng,
                image_url: editImageUrl.trim() || null,
                is_active: editIsActive,
            });
            triggerToast('Mosque updated successfully.');
            await loadMosque();
        } catch (err: any) {
            triggerToast(`Failed to update: ${err?.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    }, [mosque, editName, editAddress, editCity, editLatitude, editLongitude, editImageUrl, editIsActive, triggerToast, loadMosque]);

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <View style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────

    if (error) {
        return (
            <View style={styles.safeArea}>
                <SectionHeader title="Assigned Mosque" />
                <View style={styles.centered}>
                    <WifiOff size={48} color={colors.danger} />
                    <Text style={styles.errorTitle}>Failed to Load</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => { setLoading(true); loadMosque(); }}
                        activeOpacity={0.7}
                    >
                        <RefreshCw size={16} color="#ffffff" />
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Main ─────────────────────────────────────────────────────────────────

    return (
        <View style={styles.safeArea}>
            {/* Header */}
            <SectionHeader title="Assigned Mosque" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Image preview */}
                {editImageUrl ? (
                    <Image source={{ uri: editImageUrl }} style={styles.bannerImage} resizeMode="cover" />
                ) : null}

                {/* Image upload */}
                <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={async () => {
                        setImageUploading(true);
                        const url = await pickAndUploadImage();
                        if (url) setEditImageUrl(url);
                        setImageUploading(false);
                    }}
                    disabled={imageUploading}
                    activeOpacity={0.7}
                >
                    {imageUploading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            <Camera size={28} color={colors.primary} />
                            <Text style={styles.uploadText}>
                                {editImageUrl ? 'Change Mosque Image' : 'Upload Mosque Image'}
                            </Text>
                            <Text style={styles.uploadHint}>JPEG, PNG, or WebP · max 5 MB</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Active Status */}
                <View style={styles.toggleRow}>
                    <View>
                        <Text style={styles.fieldLabel}>Active Status</Text>
                        <Text style={styles.fieldHint}>Visible to public when active</Text>
                    </View>
                    <Switch
                        value={editIsActive}
                        onValueChange={setEditIsActive}
                        trackColor={{ false: colors.light.border, true: colors.primaryLight }}
                        thumbColor={editIsActive ? colors.primary : colors.light.textMuted}
                    />
                </View>

                {/* Mosque Name */}
                <FieldRow label="Mosque Name *">
                    <TextInput
                        style={styles.fieldInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="e.g. Masjid Al-Noor"
                        placeholderTextColor={colors.light.textMuted}
                    />
                </FieldRow>

                {/* Address */}
                <FieldRow label="Address *">
                    <TextInput
                        style={styles.fieldInput}
                        value={editAddress}
                        onChangeText={setEditAddress}
                        placeholder="Street / local address"
                        placeholderTextColor={colors.light.textMuted}
                    />
                </FieldRow>

                {/* City */}
                <FieldRow label="City *">
                    <TextInput
                        style={styles.fieldInput}
                        value={editCity}
                        onChangeText={setEditCity}
                        placeholder="e.g. Karachi"
                        placeholderTextColor={colors.light.textMuted}
                    />
                </FieldRow>

                {/* Coordinates */}
                <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>
                    Coordinates *
                </Text>
                <View style={styles.row}>
                    <View style={styles.halfField}>
                        <Text style={styles.coordLabel}>Latitude</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={editLatitude}
                            onChangeText={setEditLatitude}
                            keyboardType="numeric"
                            placeholder="e.g. 24.8607"
                            placeholderTextColor={colors.light.textMuted}
                        />
                    </View>
                    <View style={styles.halfField}>
                        <Text style={styles.coordLabel}>Longitude</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={editLongitude}
                            onChangeText={setEditLongitude}
                            keyboardType="numeric"
                            placeholder="e.g. 67.0011"
                            placeholderTextColor={colors.light.textMuted}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.7}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Save size={18} color="#ffffff" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// ── Field Row Helper ─────────────────────────────────────────────────────────

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <View style={{ marginTop: spacing.sm }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
    </View>
);

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.light.background },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        gap: spacing.md,
    },

    // Error state
    errorTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '700',
        color: colors.danger,
    },
    errorText: {
        fontSize: typography.sizes.sm,
        color: colors.light.textMuted,
        textAlign: 'center',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        marginTop: spacing.sm,
    },
    retryBtnText: {
        fontSize: typography.sizes.sm,
        fontWeight: '700',
        color: '#ffffff',
    },

    // Scroll
    scrollContent: { padding: spacing.lg },

    // Image
    bannerImage: { width: '100%', height: 180, borderRadius: 16, marginBottom: spacing.md },
    uploadArea: {
        borderWidth: 1.5,
        borderColor: 'rgba(246, 139, 53, 0.3)',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(246, 139, 53, 0.04)',
        minHeight: 110,
        marginBottom: spacing.md,
    },
    uploadText: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
        color: colors.primary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    uploadHint: {
        fontSize: typography.sizes.xs,
        color: colors.light.textMuted,
        marginTop: 4,
    },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.light.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },

    // Fields
    fieldLabel: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
        color: '#1D3B6D',
        marginBottom: spacing.xs,
    },
    fieldHint: {
        fontSize: typography.sizes.xs,
        color: colors.light.textMuted,
        marginTop: 2,
    },
    fieldInput: {
        borderWidth: 1,
        borderColor: 'rgba(29, 59, 109, 0.15)',
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.sizes.base,
        color: colors.light.text,
        backgroundColor: '#FFFFFF',
    },
    coordLabel: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
        color: colors.light.textMuted,
        marginBottom: spacing.xs,
    },
    row: { flexDirection: 'row', gap: spacing.sm },
    halfField: { flex: 1 },

    // Save
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: 16,
        marginTop: spacing.lg,
    },
    saveButtonText: {
        fontSize: typography.sizes.base,
        fontWeight: '700',
        color: '#ffffff',
    },
});

export default AssignedMosqueScreen;