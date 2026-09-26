import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/ui/Text';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react-native';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';
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
  const insets = useSafeAreaInsets();

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
  const slideAnim = React.useRef(new Animated.Value(10)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
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
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
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

  // ── Heading & Subtitle texts ──────────────────────────────────────────────────
  const heading =
    mode === 'forgot'
      ? (language === 'ur' ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password')
      : mode === 'signup'
        ? (language === 'ur' ? 'سائن اپ کریں' : 'Sign Up')
        : (language === 'ur' ? 'خوش آمدید' : 'Welcome Back!');

  const subtitle =
    mode === 'forgot'
      ? (language === 'ur' ? 'ری سیٹ کے لیے ای میل درج کریں' : 'Enter your email to reset')
      : mode === 'signup'
        ? (language === 'ur' ? 'ہماری کمیونٹی میں شامل ہوں' : 'Join our community')
        : (language === 'ur' ? 'اپنا روحانی سفر جاری رکھنے کے لیے سائن ان کریں۔' : 'Sign in to continue your spiritual journey.');

  const submitButtonTitle =
    isSubmitting
      ? '...'
      : mode === 'forgot'
        ? (language === 'ur' ? 'ری سیٹ لنک بھیجیں' : 'Send Reset Link')
        : mode === 'signup'
          ? (language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create account')
          : (language === 'ur' ? 'سائن ان کریں' : 'Sign In');

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.screenBg}
      resizeMode="cover"
    >
      {/* <StatusBar barStyle="light-content" translucent backgroundColor="transparent" /> */}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            // { paddingTop: Math.max(insets.top + 70, 95) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Main White Card Container */}
          <View style={[styles.mainCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            {/* Header with Back Chevron and Title */}
            <View style={styles.headerContainer}>
              <View style={styles.titleRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={28} color="#1D3B6D" strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.headingText}>{heading}</Text>
              </View>

              <Text style={styles.subtitleText}>{subtitle}</Text>
            </View>

            {/* Form Fields Section */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                width: '100%',
              }}
            >
              {/* ── LOGIN FORM ─────────────────────────────────────────── */}
              {mode === 'login' && (
                <View style={styles.formContent}>
                  <Controller
                    control={loginForm.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormInput
                        placeholder={language === 'ur' ? 'ای میل ایڈریس' : 'Email address'}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        leftIcon={<Mail size={20} color="#9AAAB8" />}
                        error={fieldState.error}
                      />
                    )}
                  />

                  <Controller
                    control={loginForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormInput
                        placeholder={language === 'ur' ? 'پاس ورڈ درج کریں' : 'Enter password'}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        secureTextEntry={!showPassword}
                        leftIcon={<Lock size={20} color="#9AAAB8" />}
                        rightIcon={
                          <TouchableOpacity
                            onPress={() => setShowPassword(v => !v)}
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                          >
                            {showPassword ? (
                              <EyeOff size={20} color="#9AAAB8" />
                            ) : (
                              <Eye size={20} color="#9AAAB8" />
                            )}
                          </TouchableOpacity>
                        }
                        error={fieldState.error}
                      />
                    )}
                  />

                  {/* Forgot Password Link */}
                  <TouchableOpacity
                    onPress={() => setMode('forgot')}
                    style={styles.forgotPasswordContainer}
                    activeOpacity={0.7}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {language === 'ur' ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password?'}
                    </Text>
                  </TouchableOpacity>

                  {/* Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onLogin}
                    disabled={isSubmitting}
                    style={styles.buttonShadow}
                  >
                    <LinearGradient
                      colors={['#0088A5', '#0E5C6E', '#0B4756']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradientButton}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>{submitButtonTitle}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── SIGN UP FORM ───────────────────────────────────────── */}
              {mode === 'signup' && (
                <View style={styles.formContent}>
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
                        leftIcon={<User size={20} color="#9AAAB8" />}
                        error={fieldState.error}
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
                        leftIcon={<Phone size={20} color="#9AAAB8" />}
                        error={fieldState.error}
                      />
                    )}
                  />

                  <Controller
                    control={signUpForm.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormInput
                        placeholder={language === 'ur' ? 'ای میل ایڈریس' : 'Email address'}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        leftIcon={<Mail size={20} color="#9AAAB8" />}
                        error={fieldState.error}
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
                        leftIcon={<Lock size={20} color="#9AAAB8" />}
                        rightIcon={
                          <TouchableOpacity
                            onPress={() => setShowPassword(v => !v)}
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                          >
                            {showPassword ? (
                              <EyeOff size={20} color="#9AAAB8" />
                            ) : (
                              <Eye size={20} color="#9AAAB8" />
                            )}
                          </TouchableOpacity>
                        }
                        error={fieldState.error}
                      />
                    )}
                  />

                  <Controller
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <FormInput
                        placeholder={language === 'ur' ? 'پاس ورڈ کی تصدیق' : 'Confirm password'}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        secureTextEntry={!showConfirmPassword}
                        leftIcon={<Lock size={20} color="#9AAAB8" />}
                        rightIcon={
                          <TouchableOpacity
                            onPress={() => setShowConfirmPassword(v => !v)}
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} color="#9AAAB8" />
                            ) : (
                              <Eye size={20} color="#9AAAB8" />
                            )}
                          </TouchableOpacity>
                        }
                        error={fieldState.error}
                      />
                    )}
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onSignUp}
                    disabled={isSubmitting}
                    style={styles.buttonShadow}
                  >
                    <LinearGradient
                      colors={['#0088A5', '#0E5C6E', '#0B4756']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradientButton}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>{submitButtonTitle}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── FORGOT PASSWORD FORM ───────────────────────────────── */}
              {mode === 'forgot' && (
                <View style={styles.formContent}>
                  <Controller
                    control={forgotForm.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormInput
                        placeholder={language === 'ur' ? 'ای میل ایڈریس' : 'Email address'}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        leftIcon={<Mail size={20} color="#9AAAB8" />}
                        error={fieldState.error}
                      />
                    )}
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onForgot}
                    disabled={isSubmitting}
                    style={[styles.buttonShadow, { marginTop: 6 }]}
                  >
                    <LinearGradient
                      colors={['#0088A5', '#0E5C6E', '#0B4756']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradientButton}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>{submitButtonTitle}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Toggle Mode Link */}
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => {
                  if (mode === 'forgot') { setMode('login'); return; }
                  setMode(mode === 'login' ? 'signup' : 'login');
                }}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={styles.toggleText}>
                  {mode === 'forgot'
                    ? (language === 'ur' ? 'پاس ورڈ یاد آگیا؟ ' : 'Remembered Your Password? ')
                    : mode === 'signup'
                      ? (language === 'ur' ? 'پہلے سے اکاؤنٹ موجود ہے؟ ' : 'Already have an account? ')
                      : (language === 'ur' ? 'اکاؤنٹ نہیں ہے؟ ' : "Don't have an account? ")}
                  <Text style={styles.toggleHighlight}>
                    {mode === 'forgot'
                      ? (language === 'ur' ? 'سائن ان کریں' : 'Sign in')
                      : mode === 'signup'
                        ? (language === 'ur' ? 'سائن ان کریں' : 'Sign in')
                        : (language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create Account')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom Footer Branding */}
            <View style={styles.brandingContainer}>
              <View style={styles.brandingLogoWrapper}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.brandingLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandingName}>Jamiyat Ahl-e-Hadith Hyd.</Text>
              <Text style={styles.brandingVersion}>Version 1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenBg: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    minHeight: 620,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    marginRight: 10,
    marginLeft: -6,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1D3B6D',
    fontFamily: typography.fonts.english.bold,
  },
  subtitleText: {
    fontSize: 14,
    color: '#8C9199',
    marginTop: 2,
    fontFamily: typography.fonts.english.regular,
  },
  formContent: {
    width: '100%',
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -2,
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0088A5',
    fontFamily: typography.fonts.english.semibold,
  },
  buttonShadow: {
    shadowColor: '#0088A5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  submitGradientButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fonts.english.bold,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#8C9199',
    fontFamily: typography.fonts.english.regular,
  },
  toggleHighlight: {
    color: '#0088A5',
    fontWeight: '700',
    fontFamily: typography.fonts.english.bold,
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  brandingLogoWrapper: {
    width: 26,
    height: 26,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#0F6B73',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandingLogo: {
    width: 22,
    height: 22,
  },
  brandingName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CB9E67',
    fontFamily: typography.fonts.english.semibold,
  },
  brandingVersion: {
    fontSize: 9,
    color: '#CB9E67',
    marginTop: 1,
    fontFamily: typography.fonts.english.regular,
  },
});

