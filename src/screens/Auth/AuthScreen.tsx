import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, User, Mail, Phone, Lock, CreditCard } from 'lucide-react-native';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { useNavigation } from '../../navigation/NavigationContext';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  LoginFormData,
  SignUpFormData,
  ForgotPasswordFormData,
} from '../../utils/validationSchemas';

// ─── Mode type ────────────────────────────────────────────────────────────────
type AuthMode = 'login' | 'signup' | 'forgot';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const AuthScreen: React.FC = () => {
  const { language } = useApp();
  const { login, signUp, forgotPassword } = useAuth();
  const { navigate, params } = useNavigation();
  const theme = colors.light;

  const [mode, setMode] = useState<AuthMode>(params?.isSignUp ? 'signup' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync mode if route params change (e.g. pressing "Sign Up" on Welcome screen)
  useEffect(() => {
    if (params?.isSignUp !== undefined) {
      setMode(params.isSignUp ? 'signup' : 'login');
    }
  }, [params]);

  // ── Animation ───────────────────────────────────────────────────────────────
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(12);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [mode]);

  // ── Login form ───────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Sign Up form ─────────────────────────────────────────────────────────────
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', phone: '', cnic: '', password: '', confirmPassword: '' },
  });

  // ── Forgot Password form ─────────────────────────────────────────────────────
  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // ── Back handler ─────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (mode === 'forgot') { setMode('login'); return; }
    if (mode === 'signup') { setMode('login'); return; }
    navigate('Welcome');
  };

  // ── Submit: Login ─────────────────────────────────────────────────────────────
  const onLogin = loginForm.handleSubmit(async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      showSuccess(language === 'ur' ? 'لاگ ان کامیاب!' : 'Logged in successfully!');
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        showError(
          language === 'ur'
            ? 'ای میل تصدیق نہیں ہوئی۔ ان باکس چیک کریں۔'
            : 'Email not confirmed. Check your inbox.'
        );
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        showError(language === 'ur' ? 'ای میل یا پاس ورڈ غلط ہے۔' : 'Incorrect email or password.');
      } else {
        showError(msg || (language === 'ur' ? 'سائن ان ناکام ہوا۔' : 'Login failed. Please try again.'));
      }
    }
  });

  // ── Submit: Sign Up ───────────────────────────────────────────────────────────
  const onSignUp = signUpForm.handleSubmit(async (data: SignUpFormData) => {
    try {
      await signUp(data.email, data.password, {
        name: data.name,
        phone: data.phone,
        cnic: data.cnic,
      });
      showSuccess(language === 'ur' ? 'اکاؤنٹ بن گیا!' : 'Account created! Logging in…');
      try {
        await login(data.email, data.password);
      } catch {
        showInfo(language === 'ur' ? 'اب سائن ان کریں۔' : 'Account created — please sign in.');
        setMode('login');
      }
    } catch (err: any) {
      showError(err?.message || (language === 'ur' ? 'سائن اپ ناکام۔' : 'Sign up failed.'));
    }
  });

  // ── Submit: Forgot Password ───────────────────────────────────────────────────
  const onForgot = forgotForm.handleSubmit(async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data.email);
      showSuccess(
        language === 'ur'
          ? 'ری سیٹ لنک ای میل پر بھیج دیا گیا۔'
          : 'Password reset link sent to your email.'
      );
      setMode('login');
    } catch (err: any) {
      showError(err?.message || (language === 'ur' ? 'ناکام ہوا۔' : 'Failed to send reset link.'));
    }
  });

  // Derive loading state from whichever form is submitting
  const isSubmitting =
    loginForm.formState.isSubmitting ||
    signUpForm.formState.isSubmitting ||
    forgotForm.formState.isSubmitting;

  // ── Heading text ──────────────────────────────────────────────────────────────
  const heading =
    mode === 'forgot'
      ? (language === 'ur' ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password')
      : mode === 'signup'
        ? (language === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create Account')
        : (language === 'ur' ? 'خوش آمدید' : 'Welcome Back');

  const subtitle =
    mode === 'forgot'
      ? (language === 'ur' ? 'ری سیٹ کے لیے ای میل درج کریں۔' : 'Enter your email to reset password.')
      : mode === 'signup'
        ? (language === 'ur' ? 'کمیونٹی کا حصہ بنیں۔' : 'Join the community.')
        : (language === 'ur' ? 'آگے بڑھنے کے لیے سائن ان کریں۔' : 'Sign in to continue.');

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <ArrowLeft size={26} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerSection}>
            <Text style={[styles.headingText, { color: theme.text }]}>{heading}</Text>
            <Text style={[styles.subtitleText, { color: theme.textMuted }]}>{subtitle}</Text>
          </View>
        </View>

        {/* Form card */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%' }}>
          <View style={styles.card}>

            {/* ── LOGIN FORM ─────────────────────────────────────────────── */}
            {mode === 'login' && (
              <>
                <Controller
                  control={loginForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'ای میل' : 'Email'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Mail size={20} color={theme.textMuted} />}
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={loginForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'پاس ورڈ' : 'Password'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      secureTextEntry={!showPassword}
                      leftIcon={<Lock size={20} color={theme.textMuted} />}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                          {showPassword ? <EyeOff size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
                        </TouchableOpacity>
                      }
                      error={fieldState.error}
                      style={{ marginBottom: spacing.xs }}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setMode('forgot')}
                  style={styles.forgotPasswordContainer}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                    {language === 'ur' ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password?'}
                  </Text>
                </TouchableOpacity>
                <Button
                  title={isSubmitting ? '...' : (language === 'ur' ? 'سائن ان کریں' : 'Sign In')}
                  onPress={onLogin}
                  style={styles.primaryButton}
                  textStyle={styles.buttonText}
                  variant="primary"
                  disabled={isSubmitting}
                />
              </>
            )}

            {/* ── SIGN UP FORM ───────────────────────────────────────────── */}
            {mode === 'signup' && (
              <>
                <Controller
                  control={signUpForm.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'مکمل نام' : 'Full Name'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      autoCapitalize="words"
                      leftIcon={<User size={20} color={theme.textMuted} />}
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'ای میل' : 'Email'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Mail size={20} color={theme.textMuted} />}
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'فون نمبر' : 'Phone Number'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="phone-pad"
                      leftIcon={<Phone size={20} color={theme.textMuted} />}
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="cnic"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'قومی شناختی کارڈ نمبر' : 'CNIC Number'}
                      value={field.value ?? ''}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="numeric"
                      leftIcon={<CreditCard size={20} color={theme.textMuted} />}
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'پاس ورڈ' : 'Password'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      secureTextEntry={!showPassword}
                      leftIcon={<Lock size={20} color={theme.textMuted} />}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                          {showPassword ? <EyeOff size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
                        </TouchableOpacity>
                      }
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'پاس ورڈ کی تصدیق' : 'Confirm Password'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      secureTextEntry={!showConfirmPassword}
                      leftIcon={<Lock size={20} color={theme.textMuted} />}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeButton}>
                          {showConfirmPassword ? <EyeOff size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
                        </TouchableOpacity>
                      }
                      error={fieldState.error}
                      style={{ marginBottom: spacing.xs }}
                    />
                  )}
                />
                <Button
                  title={isSubmitting ? '...' : (language === 'ur' ? 'سائن اپ کریں' : 'Create Account')}
                  onPress={onSignUp}
                  style={styles.primaryButton}
                  textStyle={styles.buttonText}
                  variant="primary"
                  disabled={isSubmitting}
                />
              </>
            )}

            {/* ── FORGOT PASSWORD FORM ───────────────────────────────────── */}
            {mode === 'forgot' && (
              <>
                <Controller
                  control={forgotForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormInput
                      placeholder={language === 'ur' ? 'ای میل' : 'Email'}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Mail size={20} color={theme.textMuted} />}
                      error={fieldState.error}
                      style={{ marginBottom: spacing.sm }}
                    />
                  )}
                />
                <Button
                  title={isSubmitting ? '...' : (language === 'ur' ? 'ری سیٹ لنک بھیجیں' : 'Send Reset Link')}
                  onPress={onForgot}
                  style={styles.primaryButton}
                  textStyle={styles.buttonText}
                  variant="primary"
                  disabled={isSubmitting}
                />
              </>
            )}
          </View>

          {/* Toggle link */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => {
              if (mode === 'forgot') { setMode('login'); return; }
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={[styles.toggleText, { color: theme.textMuted }]}>
              {mode === 'forgot'
                ? (language === 'ur' ? 'لاگ ان پر واپس جائیں؟ ' : 'Remembered your password? ')
                : mode === 'signup'
                  ? (language === 'ur' ? 'پہلے سے اکاؤنٹ ہے؟ ' : 'Already have an account? ')
                  : (language === 'ur' ? 'اکاؤنٹ نہیں ہے؟ ' : "Don't have an account? ")}
              <Text style={{ color: colors.primary, fontWeight: typography.weights.bold }}>
                {mode === 'forgot'
                  ? (language === 'ur' ? 'سائن ان کریں' : 'Sign In')
                  : mode === 'signup'
                    ? (language === 'ur' ? 'لاگ ان کریں' : 'Sign In')
                    : (language === 'ur' ? 'سائن اپ کریں' : 'Sign Up')}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom branding */}
        <View style={styles.brandingContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.brandingLogo}
            resizeMode="contain"
          />
          <Text style={[styles.brandingName, { color: theme.text }]}>Masjid Locator</Text>
          <Text style={[styles.brandingVersion, { color: theme.textMuted }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    justifyContent: 'space-between',
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.sm,
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headingText: {
    fontSize: typography.sizes.huge,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: typography.sizes.base,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  eyeButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgotPasswordText: {
    fontSize: typography.sizes.base - 2,
    fontWeight: typography.weights.semibold,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: spacing.borderRadiusRound,
    marginTop: spacing.xs,
  },
  buttonText: {
    fontSize: typography.sizes.md,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  toggleText: {
    fontSize: typography.sizes.base - 2,
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
  },
  brandingLogo: {
    width: 30,
    height: 30,
    marginBottom: spacing.xs,
  },
  brandingName: {
    fontSize: typography.sizes.sm - 2,
    fontWeight: typography.weights.bold,
  },
  brandingVersion: {
    fontSize: typography.sizes.xs - 2,
    marginTop: 1,
  },
});
