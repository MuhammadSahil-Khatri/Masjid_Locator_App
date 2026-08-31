import React, { useState } from 'react';
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
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../navigation/NavigationContext';
import { authService } from '../../services/auth';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChangePasswordScreen: React.FC = () => {
  const { currentUser, isRtl, triggerToast } = useApp();
  const { user } = useAuth();
  const { goBack, navigate } = useNavigation();
  const insets = useSafeAreaInsets();

  // Multi-step flow: 'verify_current' -> 'new_password'
  const [step, setStep] = useState<'verify_current' | 'new_password'>('verify_current');

  // Input states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & loading states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeEmail = currentUser?.email || user?.email || '';

  // ─── Step 1: Verify Current Password ─────────────────────────────────────────
  const handleVerifyCurrentPassword = async () => {
    setErrorMessage(null);

    if (!activeEmail) {
      setErrorMessage(
        isRtl
          ? 'صارف لاگ ان نہیں ہے۔ براہ کرم دوبارہ لاگ ان کریں۔'
          : 'User session not found. Please log in again.'
      );
      return;
    }

    if (!currentPassword.trim()) {
      setErrorMessage(
        isRtl
          ? 'براہ کرم اپنا موجودہ پاس ورڈ درج کریں۔'
          : 'Please enter your current password.'
      );
      return;
    }

    try {
      setLoading(true);
      await authService.verifyPassword(activeEmail, currentPassword);
      // Success: proceed to step 2
      setErrorMessage(null);
      setStep('new_password');
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid password') ||
        msg.toLowerCase().includes('invalid')
      ) {
        setErrorMessage(
          isRtl
            ? 'موجودہ پاس ورڈ غلط ہے۔ دوبارہ کوشش کریں۔'
            : 'Incorrect current password. Please try again.'
        );
      } else {
        setErrorMessage(
          msg ||
            (isRtl
              ? 'پاس ورڈ کی تصدیق ناکام ہوئی۔'
              : 'Verification failed. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Set New Password ────────────────────────────────────────────────
  const handleSetNewPassword = async () => {
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage(
        isRtl
          ? 'براہ کرم نیا پاس ورڈ درج کریں۔'
          : 'Please enter a new password.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        isRtl
          ? 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage(
        isRtl
          ? 'نیا پاس ورڈ موجودہ پاس ورڈ سے مختلف ہونا چاہیے۔'
          : 'New password must be different from current password.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        isRtl
          ? 'پاس ورڈ مماثل نہیں ہیں۔'
          : 'Passwords do not match.'
      );
      return;
    }

    try {
      setLoading(true);
      await authService.updatePassword(newPassword);
      triggerToast(
        isRtl
          ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا!'
          : 'Password updated successfully!'
      );
      goBack();
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isRtl
            ? 'پاس ورڈ تبدیل کرنے میں ناکامی۔'
            : 'Failed to update password. Please try again.')
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
            {isRtl ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}
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
          {/* ── Progress & Step Indicator ── */}
          <View style={styles.stepIndicatorContainer}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {step === 'verify_current'
                  ? isRtl
                    ? 'مرحلہ 1 از 2: تصدیق'
                    : 'Step 1 of 2: Verification'
                  : isRtl
                    ? 'مرحلہ 2 از 2: نیا پاس ورڈ'
                    : 'Step 2 of 2: New Password'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: step === 'verify_current' ? '50%' : '100%' },
                ]}
              />
            </View>
          </View>

          {/* ── Card Container ── */}
          <View style={styles.card}>
            {/* Header Icon & Intro */}
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                {step === 'verify_current' ? (
                  <KeyRound size={28} color="#00ADC1" />
                ) : (
                  <ShieldCheck size={28} color="#00ADC1" />
                )}
              </View>
              <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>
                {step === 'verify_current'
                  ? isRtl
                    ? 'موجودہ پاس ورڈ درج کریں'
                    : 'Enter Current Password'
                  : isRtl
                    ? 'نیا پاس ورڈ سیٹ کریں'
                    : 'Set New Password'}
              </Text>
              <Text style={[styles.cardSubtitle, isRtl && styles.textRtl]}>
                {step === 'verify_current'
                  ? isRtl
                    ? 'سیکیورٹی کی خاطر آگے بڑھنے سے پہلے اپنے موجودہ پاس ورڈ کی تصدیق کریں۔'
                    : 'For security reasons, please enter your current password to continue.'
                  : isRtl
                    ? 'اپنے اکاؤنٹ کے لیے کم از کم 6 حروف پر مشتمل ایک محفوظ پاس ورڈ درج کریں۔'
                    : 'Enter a strong, secure password with at least 6 characters for your account.'}
              </Text>
            </View>

            {/* User Account Info Pill */}
            {activeEmail ? (
              <View style={[styles.emailPill, isRtl && styles.rowReverse]}>
                <Text style={styles.emailPillLabel}>
                  {isRtl ? 'اکاؤنٹ:' : 'Account:'}
                </Text>
                <Text style={styles.emailPillValue} numberOfLines={1}>
                  {activeEmail}
                </Text>
              </View>
            ) : (
              <View style={styles.unauthorizedBox}>
                <AlertCircle size={20} color={colors.danger || '#E44848'} />
                <Text style={styles.unauthorizedText}>
                  {isRtl
                    ? 'براہ کرم پاس ورڈ تبدیل کرنے کے لیے لاگ ان کریں۔'
                    : 'You must be signed in with valid credentials to change your password.'}
                </Text>
                <TouchableOpacity
                  style={styles.signInRedirectBtn}
                  onPress={() => navigate('Auth')}
                >
                  <Text style={styles.signInRedirectBtnText}>
                    {isRtl ? 'لاگ ان صفحہ پر جائیں' : 'Go to Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error Banner */}
            {errorMessage ? (
              <View style={[styles.errorBanner, isRtl && styles.rowReverse]}>
                <AlertCircle size={18} color={colors.danger || '#E44848'} />
                <Text style={[styles.errorBannerText, isRtl && styles.textRtl]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* ── STEP 1 FORM ── */}
            {step === 'verify_current' && activeEmail ? (
              <View style={styles.formSection}>
                <Text style={[styles.inputLabel, isRtl && styles.textRtl]}>
                  {isRtl ? 'موجودہ پاس ورڈ' : 'Current Password'}
                </Text>
                <View style={[styles.inputWrapper, isRtl && styles.rowReverse]}>
                  <Lock size={18} color="#8C9199" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.textInput, isRtl && styles.textInputRtl]}
                    placeholder={isRtl ? 'اپنا موجودہ پاس ورڈ درج کریں' : 'Enter current password'}
                    placeholderTextColor="#8C9199"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={(val) => {
                      setCurrentPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} color="#8C9199" />
                    ) : (
                      <Eye size={18} color="#8C9199" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.btnDisabled]}
                  onPress={handleVerifyCurrentPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isRtl ? 'پاس ورڈ کی تصدیق کریں' : 'Verify Password'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── STEP 2 FORM ── */}
            {step === 'new_password' && activeEmail ? (
              <View style={styles.formSection}>
                {/* Verified notice */}
                <View style={[styles.verifiedNotice, isRtl && styles.rowReverse]}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.verifiedNoticeText}>
                    {isRtl ? 'موجودہ پاس ورڈ کی تصدیق ہو گئی ہے' : 'Current password verified'}
                  </Text>
                </View>

                {/* New Password Input */}
                <Text style={[styles.inputLabel, isRtl && styles.textRtl]}>
                  {isRtl ? 'نیا پاس ورڈ' : 'New Password'}
                </Text>
                <View style={[styles.inputWrapper, isRtl && styles.rowReverse]}>
                  <Lock size={18} color="#8C9199" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.textInput, isRtl && styles.textInputRtl]}
                    placeholder={isRtl ? 'نیا پاس ورڈ درج کریں (کم از کم 6 حروف)' : 'Enter new password (min. 6 chars)'}
                    placeholderTextColor="#8C9199"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} color="#8C9199" />
                    ) : (
                      <Eye size={18} color="#8C9199" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Confirm New Password Input */}
                <Text style={[styles.inputLabel, isRtl && styles.textRtl]}>
                  {isRtl ? 'نئے پاس ورڈ کی تصدیق کریں' : 'Confirm New Password'}
                </Text>
                <View style={[styles.inputWrapper, isRtl && styles.rowReverse]}>
                  <Lock size={18} color="#8C9199" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.textInput, isRtl && styles.textInputRtl]}
                    placeholder={isRtl ? 'نیا پاس ورڈ دوبارہ درج کریں' : 'Re-enter new password'}
                    placeholderTextColor="#8C9199"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#8C9199" />
                    ) : (
                      <Eye size={18} color="#8C9199" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password helper requirements */}
                <View style={styles.requirementsBox}>
                  <Text style={[styles.requirementsHeader, isRtl && styles.textRtl]}>
                    {isRtl ? 'پاس ورڈ کے تقاضے:' : 'Password Requirements:'}
                  </Text>
                  <View style={[styles.reqRow, isRtl && styles.rowReverse]}>
                    <View
                      style={[
                        styles.reqDot,
                        newPassword.length >= 6 && styles.reqDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.reqText,
                        newPassword.length >= 6 && styles.reqTextActive,
                      ]}
                    >
                      {isRtl ? 'کم از کم 6 حروف' : 'At least 6 characters'}
                    </Text>
                  </View>
                  <View style={[styles.reqRow, isRtl && styles.rowReverse]}>
                    <View
                      style={[
                        styles.reqDot,
                        newPassword.length > 0 &&
                          confirmPassword.length > 0 &&
                          newPassword === confirmPassword &&
                          styles.reqDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.reqText,
                        newPassword.length > 0 &&
                          confirmPassword.length > 0 &&
                          newPassword === confirmPassword &&
                          styles.reqTextActive,
                      ]}
                    >
                      {isRtl ? 'پاس ورڈ آپس میں مماثل ہوں' : 'Passwords match'}
                    </Text>
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.btnDisabled]}
                  onPress={handleSetNewPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isRtl ? 'پاس ورڈ محفوظ کریں' : 'Update Password'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
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

  // ── Step Indicator ──────────────────────────────────────────────────────────
  stepIndicatorContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D3B6D',
  },
  progressBar: {
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ADC1',
    borderRadius: 2,
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

  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
    gap: 6,
  },
  emailPillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  emailPillValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D3B6D',
    flex: 1,
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
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    gap: 6,
  },
  verifiedNoticeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 6,
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
  inputLeftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1D3B6D',
  },
  textInputRtl: {
    textAlign: 'right',
  },
  eyeBtn: {
    padding: 6,
  },

  requirementsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requirementsHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  reqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  reqDotActive: {
    backgroundColor: '#059669',
  },
  reqText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reqTextActive: {
    color: '#059669',
    fontWeight: '600',
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

export default ChangePasswordScreen;


