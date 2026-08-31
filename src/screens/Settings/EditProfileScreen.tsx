import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { User, Phone, Mail, Shield, AlertCircle, CheckCircle2, Lock } from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../navigation/NavigationContext';

// ─── SVG Back Arrow Icon ──────────────────────────────────────────────────────

const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EditProfileScreen: React.FC = () => {
  const { currentUser, setCurrentUser, isRtl, triggerToast } = useApp();
  const { user, profile, updateUserMetadata } = useAuth();
  const { goBack, navigate } = useNavigation();
  const insets = useSafeAreaInsets();

  // Form states
  const [name, setName] = useState(currentUser?.name || profile?.name || user?.user_metadata?.name || '');
  const [phone, setPhone] = useState(
    currentUser?.phone ||
    profile?.phone ||
    user?.user_metadata?.phone_number ||
    user?.user_metadata?.phone ||
    ''
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser?.name) setName(currentUser.name);
    if (currentUser?.phone) setPhone(currentUser.phone);
  }, [currentUser]);

  const activeEmail = currentUser?.email || user?.email || '';
  const isLoggedIn = Boolean(activeEmail && user?.id);
  const isBlocked = currentUser?.is_blocked || profile?.is_blocked;

  const userRole = currentUser?.role || profile?.role || 'worshipper';
  const roleDisplay =
    userRole === 'super_admin'
      ? (isRtl ? 'سپر ایڈمن' : 'Super Admin')
      : userRole === 'admin'
        ? (isRtl ? 'ایڈمن' : 'Admin')
        : (isRtl ? 'نمازی' : 'Worshipper');

  // ─── Save Changes Handler ──────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setErrorMessage(null);

    // Permission & Auth verification
    if (!isLoggedIn) {
      setErrorMessage(
        isRtl
          ? 'صارف لاگ ان نہیں ہے۔ براہ کرم لاگ ان کریں۔'
          : 'User is not logged in. Please sign in to edit your profile.'
      );
      return;
    }

    if (isBlocked) {
      setErrorMessage(
        isRtl
          ? 'آپ کا اکاؤنٹ بلاک ہے۔ آپ ترمیم نہیں کر سکتے۔'
          : 'Your account is restricted. Profile modifications are not permitted.'
      );
      return;
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage(
        isRtl ? 'نام کا خانہ خالی نہیں ہو سکتا۔' : 'Full name cannot be empty.'
      );
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage(
        isRtl
          ? 'نام کم از کم 2 حروف کا ہونا چاہیے۔'
          : 'Name must be at least 2 characters long.'
      );
      return;
    }

    try {
      setLoading(true);
      await updateUserMetadata({
        name: trimmedName,
        phone: trimmedPhone,
      });

      // Update local state in AppContext immediately
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          name: trimmedName,
          phone: trimmedPhone,
        });
      }

      triggerToast(
        isRtl
          ? 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی!'
          : 'Profile updated successfully!'
      );
      goBack();
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isRtl
            ? 'پروفائل اپ ڈیٹ کرنے میں ناکامی۔'
            : 'Failed to update profile. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Top Header Section with Floating Pill ── */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        <View style={styles.pillContainer}>
          <TouchableOpacity
            style={styles.pillActionBtn}
            activeOpacity={0.7}
            onPress={goBack}
            accessibilityLabel="Go Back"
          >
            <BackArrowIcon size={14} color="#1D3B6D" />
          </TouchableOpacity>

          <Text style={styles.pillTitle}>
            {isRtl ? 'پروفائل میں ترمیم کریں' : 'Edit Profile'}
          </Text>

          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Header Icon & Intro */}
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <User size={28} color="#00ADC1" />
              </View>
              <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>
                {isRtl ? 'ذاتی معلومات' : 'Personal Information'}
              </Text>
              <Text style={[styles.cardSubtitle, isRtl && styles.textRtl]}>
                {isRtl
                  ? 'اپنا نام اور فون نمبر اپ ڈیٹ کریں تاکہ مساجد کی جانب سے بروقت رابطے میں رہیں۔'
                  : 'Update your display name and phone number to keep your account information up to date.'}
              </Text>
            </View>

            {/* Unauthorized / Blocked Banner if not allowed */}
            {!isLoggedIn || isBlocked ? (
              <View style={styles.unauthorizedBox}>
                <AlertCircle size={20} color={colors.danger || '#E44848'} />
                <Text style={styles.unauthorizedText}>
                  {!isLoggedIn
                    ? isRtl
                      ? 'پروفائل تبدیل کرنے کے لیے آپ کا لاگ ان ہونا ضروری ہے۔'
                      : 'You must be logged in with valid credentials to edit your profile.'
                    : isRtl
                      ? 'آپ کا اکاؤنٹ محدود ہے۔'
                      : 'Your account has been restricted. Please contact support.'}
                </Text>
                {!isLoggedIn && (
                  <TouchableOpacity
                    style={styles.signInRedirectBtn}
                    onPress={() => navigate('Auth')}
                  >
                    <Text style={styles.signInRedirectBtnText}>
                      {isRtl ? 'لاگ ان صفحہ پر جائیں' : 'Go to Sign In'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Error Banner */}
            {errorMessage ? (
              <View style={[styles.errorBanner, isRtl && styles.rowReverse]}>
                <AlertCircle size={18} color={colors.danger || '#E44848'} />
                <Text style={[styles.errorBannerText, isRtl && styles.textRtl]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Form Fields */}
            {isLoggedIn && !isBlocked && (
              <View style={styles.formSection}>
                {/* Full Name Field */}
                <Text style={[styles.inputLabel, isRtl && styles.textRtl]}>
                  {isRtl ? 'پورا نام *' : 'Full Name *'}
                </Text>
                <View style={[styles.inputWrapper, isRtl && styles.rowReverse]}>
                  <User size={18} color="#8C9199" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.textInput, isRtl && styles.textInputRtl]}
                    placeholder={isRtl ? 'اپنا نام درج کریں' : 'Enter your full name'}
                    placeholderTextColor="#8C9199"
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                {/* Phone Number Field */}
                <Text style={[styles.inputLabel, isRtl && styles.textRtl]}>
                  {isRtl ? 'فون نمبر' : 'Phone Number'}
                </Text>
                <View style={[styles.inputWrapper, isRtl && styles.rowReverse]}>
                  <Phone size={18} color="#8C9199" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.textInput, isRtl && styles.textInputRtl]}
                    placeholder={isRtl ? 'فون نمبر درج کریں (مثلاً: 03001234567)' : 'Enter phone number (e.g. +92 300 1234567)'}
                    placeholderTextColor="#8C9199"
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>

                {/* Email Address (Read-only for security) */}
                <View style={[styles.labelRow, isRtl && styles.rowReverse]}>
                  <Text style={[styles.inputLabel, { marginBottom: 0 }]}>
                    {isRtl ? 'ای میل ایڈریس' : 'Email Address'}
                  </Text>
                  <View style={styles.lockBadge}>
                    <Lock size={11} color="#64748B" />
                    <Text style={styles.lockBadgeText}>
                      {isRtl ? 'غیر تبدیل پذیر' : 'Read Only'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.inputWrapper, styles.inputDisabled, isRtl && styles.rowReverse]}>
                  <Mail size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.textInput, styles.textInputDisabled, isRtl && styles.textInputRtl]}
                    value={activeEmail}
                    editable={false}
                  />
                </View>

                {/* Role Info Badge */}
                <View style={[styles.roleInfoRow, isRtl && styles.rowReverse]}>
                  <Shield size={16} color="#00ADC1" />
                  <Text style={styles.roleInfoLabel}>
                    {isRtl ? 'اکاؤنٹ کا کردار:' : 'Account Role:'}
                  </Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{roleDisplay}</Text>
                  </View>
                </View>

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.btnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isRtl ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // ── Header Section ──────────────────────────────────────────────────────────
  headerWrapper: {
    paddingBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 50,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  pillActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    letterSpacing: -0.3,
  },
  pillActionPlaceholder: {
    width: 32,
    height: 32,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
    }),
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  unauthorizedBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  unauthorizedText: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  signInRedirectBtn: {
    backgroundColor: '#1D3B6D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signInRedirectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  formSection: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1D3B6D',
  },
  textInputDisabled: {
    color: '#64748B',
  },
  textInputRtl: {
    textAlign: 'right',
  },

  roleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.lg,
    gap: 8,
  },
  roleInfoLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTag: {
    backgroundColor: '#E6F8FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    color: '#00ADC1',
    fontSize: 12,
    fontWeight: '700',
  },

  primaryButton: {
    backgroundColor: '#1D3B6D',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#1D3B6D',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#1D3B6D',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
    }),
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
});

export default EditProfileScreen;
