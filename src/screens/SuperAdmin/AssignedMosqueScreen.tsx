import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    X,
    Save,
    Camera,
    WifiOff,
    Building2,
    Tag,
    MapPin,
    Clock,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { mosqueService, MosqueWithAdmin, MosqueTag } from '../../services/mosqueService';
import * as ImagePicker from 'expo-image-picker';

export const AssignedMosqueScreen: React.FC = () => {
    const { goBack } = useNavigation();
    const { triggerToast } = useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mosque, setMosque] = useState<MosqueWithAdmin | null>(null);
    const [allTags, setAllTags] = useState<MosqueTag[]>([]);

    // Edit form
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
    const [saving, setSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    const loadMosque = useCallback(async () => {
        try {
            setError(null);
            const data = await mosqueService.fetchAdminMosque();
            if (!data) {
                setError('No mosque assigned to your account.');
                setMosque(null);
                return;
            }
            setMosque(data);
            setEditName(data.name || '');
            setEditAddress(data.address || '');
            setEditCity(data.city || '');
            setEditLatitude(data.latitude?.toString() || '');
            setEditLongitude(data.longitude?.toString() || '');
            setEditDescription(data.description || '');
            setEditImageUrl(data.image_url || '');
            setEditCapacity(data.capacity?.toString() || '');
            setEditIsActive(data.is_active);

            // Load tags
            const tags = await mosqueService.fetchAllTags();
            setAllTags(tags);

            const tagIds = await mosqueService.getMosqueTagIds(data.id);
            setEditSelectedTagIds(tagIds);
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

    // Image picker
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
            triggerToast(`Error: ${err?.message}`);
            return null;
        }
    }, [triggerToast]);

    const handleSave = useCallback(async () => {
        if (!mosque) return;
        setSaving(true);

        try {
            await mosqueService.updateMosque(mosque.id, {
                name: editName,
                address: editAddress,
                city: editCity,
                latitude: parseFloat(editLatitude) || 0,
                longitude: parseFloat(editLongitude) || 0,
                description: editDescription || null,
                image_url: editImageUrl || null,
                capacity: editCapacity ? parseInt(editCapacity, 10) : null,
                is_active: editIsActive,
            });

            await mosqueService.updateMosqueTags(mosque.id, editSelectedTagIds);

            triggerToast('Mosque updated successfully.');
            loadMosque();
        } catch (err: any) {
            triggerToast(`Error: ${err?.message || 'Failed to update mosque.'}`);
        } finally {
            setSaving(false);
        }
    }, [mosque, editName, editAddress, editCity, editLatitude, editLongitude, editDescription, editImageUrl, editCapacity, editIsActive, editSelectedTagIds, triggerToast, loadMosque]);

    const toggleTag = useCallback((tagId: string) => {
        setEditSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
        );
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.8}>
                        <ArrowLeft size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Assigned Mosque</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.centered}>
                    <WifiOff size={48} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.8}>
                    <ArrowLeft size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assigned Mosque</Text>
                <TouchableOpacity
                    style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.7}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Save size={18} color="#ffffff" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Image preview / upload */}
                {editImageUrl ? (
                    <Image source={{ uri: editImageUrl }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                    <TouchableOpacity
                        style={styles.uploadArea}
                        onPress={async () => {
                            setImageUploading(true);
                            const url = await pickAndUploadImage();
                            if (url) setEditImageUrl(url);
                            setImageUploading(false);
                        }}
                        activeOpacity={0.7}
                    >
                        {imageUploading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : (
                            <>
                                <Camera size={32} color={colors.primary} />
                                <Text style={styles.uploadText}>Tap to upload mosque image</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Active toggle */}
                <View style={styles.toggleRow}>
                    <Text style={styles.fieldLabel}>Active</Text>
                    <Switch
                        value={editIsActive}
                        onValueChange={setEditIsActive}
                        trackColor={{ false: colors.light.border, true: colors.primaryLight }}
                        thumbColor={editIsActive ? colors.primary : colors.light.textMuted}
                    />
                </View>

                {/* Form fields */}
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.fieldInput} value={editName} onChangeText={setEditName} placeholderTextColor={colors.light.textMuted} />

                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput style={styles.fieldInput} value={editAddress} onChangeText={setEditAddress} placeholderTextColor={colors.light.textMuted} />

                <Text style={styles.fieldLabel}>City</Text>
                <TextInput style={styles.fieldInput} value={editCity} onChangeText={setEditCity} placeholderTextColor={colors.light.textMuted} />

                <View style={styles.row}>
                    <View style={styles.halfField}>
                        <Text style={styles.fieldLabel}>Latitude</Text>
                        <TextInput style={styles.fieldInput} value={editLatitude} onChangeText={setEditLatitude} keyboardType="numeric" placeholderTextColor={colors.light.textMuted} />
                    </View>
                    <View style={styles.halfField}>
                        <Text style={styles.fieldLabel}>Longitude</Text>
                        <TextInput style={styles.fieldInput} value={editLongitude} onChangeText={setEditLongitude} keyboardType="numeric" placeholderTextColor={colors.light.textMuted} />
                    </View>
                </View>

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                    style={[styles.fieldInput, styles.fieldInputMultiline]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor={colors.light.textMuted}
                />

                <Text style={styles.fieldLabel}>Capacity</Text>
                <TextInput style={styles.fieldInput} value={editCapacity} onChangeText={setEditCapacity} keyboardType="numeric" placeholderTextColor={colors.light.textMuted} />

                {/* Tags */}
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Tags</Text>
                <View style={styles.tagsContainer}>
                    {allTags.map((tag) => {
                        const selected = editSelectedTagIds.includes(tag.id);
                        return (
                            <TouchableOpacity
                                key={tag.id}
                                style={[styles.tagChip, selected && styles.tagChipSelected]}
                                onPress={() => toggleTag(tag.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                                    {tag.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    {allTags.length === 0 && (
                        <Text style={styles.noDataText}>No tags available.</Text>
                    )}
                </View>

                {/* Save button */}
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

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.light.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
    errorText: { fontSize: typography.sizes.sm, color: colors.light.textMuted, textAlign: 'center' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.light.border,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(246, 139, 53, 0.1)',
    },
    headerTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.light.text, textAlign: 'center', flex: 1 },
    headerSpacer: { width: 40 },
    saveHeaderBtn: {
        width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.primary,
    },

    scrollContent: { padding: spacing.lg },

    // Image
    bannerImage: { width: '100%', height: 180, borderRadius: spacing.borderRadiusLg, marginBottom: spacing.md },
    uploadArea: {
        borderWidth: 2, borderColor: colors.light.inputBorder, borderStyle: 'dashed',
        borderRadius: spacing.borderRadiusLg, padding: spacing.xl, alignItems: 'center',
        justifyContent: 'center', backgroundColor: 'rgba(246, 139, 53, 0.04)', minHeight: 140, marginBottom: spacing.md,
    },
    uploadText: { fontSize: typography.sizes.base, fontWeight: '600', color: colors.primary, textAlign: 'center', marginTop: spacing.sm },

    // Toggle
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },

    // Fields
    fieldLabel: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.light.text, marginBottom: spacing.xs, marginTop: spacing.sm },
    fieldInput: {
        borderWidth: 1, borderColor: colors.light.inputBorder, borderRadius: spacing.borderRadiusMd,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sizes.base,
        color: colors.light.text, backgroundColor: colors.light.surface,
    },
    fieldInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: spacing.sm },
    halfField: { flex: 1 },

    // Tags
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
    tagChip: {
        paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
        borderColor: colors.light.border, backgroundColor: colors.light.surface,
    },
    tagChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    tagChipText: { fontSize: typography.sizes.xs, fontWeight: '600', color: colors.light.textMuted },
    tagChipTextSelected: { color: '#ffffff' },
    noDataText: { fontSize: typography.sizes.sm, color: colors.light.textMuted, fontStyle: 'italic' },

    // Save
    saveButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: spacing.borderRadiusMd,
        marginTop: spacing.lg,
    },
    saveButtonText: { fontSize: typography.sizes.base, fontWeight: '700', color: '#ffffff' },
});

export default AssignedMosqueScreen;