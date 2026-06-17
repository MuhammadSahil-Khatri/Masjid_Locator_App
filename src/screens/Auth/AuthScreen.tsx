import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList 
} from 'react-native';
import { Key, Mail, Lock, User, Sparkles, MapPin } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigation } from '../../navigation/NavigationContext';

export const AuthScreen: React.FC = () => {
  const { 
    users, 
    setUsers, 
    setCurrentUser, 
    highContrast: isDark, 
    language, 
    translations, 
    triggerToast 
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const { navigate } = useNavigation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('Karachi');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const regions = [
    { value: 'Karachi', label: 'Karachi (PK) - University of Karachi' },
    { value: 'Makkah', label: 'Makkah (SA) - Umm Al-Qura Option' },
    { value: 'New York', label: 'New York (US) - ISNA Standard' },
    { value: 'London', label: 'London (UK) - Muslim World League' },
    { value: 'Cairo', label: 'Cairo (EG) - Egyptian Authority' }
  ];

  const handleSubmit = () => {
    setErrorMsg(null);

    if (!email || !password || (isSignUp && !name)) {
      setErrorMsg(language === 'ur' ? 'برائے مہربانی تمام فیلڈز پُر کریں۔' : 'Please fill all required fields.');
      return;
    }

    if (isSignUp) {
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setErrorMsg(language === 'ur' ? 'یہ ای میل پہلے سے رجسٹرڈ ہے۔' : 'This email is already registered.');
        return;
      }

      const newUser = {
        email: email.toLowerCase(),
        name,
        password,
        role: 'worshipper' as const,
        region
      };

      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      triggerToast('Account created successfully!');
      navigate('Home');
    } else {
      const matchedUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (matchedUser) {
        setCurrentUser(matchedUser);
        triggerToast(`Welcome back, ${matchedUser.name}!`);
        navigate('Home');
      } else {
        setErrorMsg(
          language === 'ur' ? 'غلط ای میل یا پاس ورڈ درج کیا گیا ہے۔' : 'Invalid email or password.'
        );
      }
    }
  };

  const handleShortcutLogin = (demoEmail: string) => {
    setErrorMsg(null);
    const matchedUser = users.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      triggerToast(`Logged in as demo ${matchedUser.role}`);
      navigate('Home');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]} contentContainerStyle={styles.scrollContent}>
      <View style={styles.brandingHeader}>
        <View style={[styles.logoIconBg, { backgroundColor: colors.primaryLight }]}>
          <Sparkles size={32} color={colors.primary} />
        </View>
        <Text style={[styles.appName, { color: currentTheme.text }]}>
          {translations.appTitle}
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
          {translations.authSubtitle}
        </Text>
      </View>

      {errorMsg && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Main Authentication Card */}
      <View style={[styles.authCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <Text style={[styles.cardTitle, { color: currentTheme.text }]}>
          {isSignUp ? translations.signupBtn : translations.authTitle}
        </Text>

        {isSignUp && (
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            isDark={isDark}
            inputStyle={{ paddingLeft: spacing.md }}
          />
        )}

        <Input
          label={translations.emailLabel}
          placeholder="email@domain.com"
          value={email}
          onChangeText={setEmail}
          isDark={isDark}
        />

        <Input
          label={translations.passLabel}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          isDark={isDark}
        />

        {isSignUp && (
          <View style={styles.formGroup}>
            <Text style={[styles.pickerLabel, { color: currentTheme.textMuted }]}>Computation Region</Text>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { borderColor: currentTheme.border }]} 
              onPress={() => setPickerVisible(true)}
            >
              <MapPin size={14} color={colors.primary} />
              <Text style={{ color: currentTheme.text }}>
                {regions.find(r => r.value === region)?.label || 'Select region'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Button
          title={isSignUp ? 'Sign Up' : translations.loginBtn}
          onPress={handleSubmit}
          style={{ marginTop: spacing.md }}
        />

        <TouchableOpacity 
          style={styles.toggleModeBtn}
          onPress={() => setIsSignUp(prev => !prev)}
        >
          <Text style={{ color: colors.primary, fontSize: typography.sizes.xs + 1, fontWeight: 'bold' }}>
            {isSignUp ? 'Already have an account? Sign In' : 'Create new Worshipper Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shortcut logins for simulator personas */}
      <View style={[styles.shortcutCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <Text style={[styles.shortcutTitle, { color: currentTheme.text }]}>
          🛠️ Quick Demo Accounts (Tap to Login)
        </Text>
        <View style={styles.shortcutRow}>
          {[
            { label: '🕌 Worshipper', email: 'worshipper@nur.com' },
            { label: '🔑 Sub-Admin', email: 'alaqsa@nur.com' },
            { label: '👑 Super-Admin', email: 'superadmin@nur.com' }
          ].map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.shortcutBtn, { backgroundColor: colors.primaryLight }]}
              onPress={() => handleShortcutLogin(item.email)}
            >
              <Text style={{ color: colors.primary, fontSize: typography.sizes.xs - 1, fontWeight: 'bold' }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Region Picker Modal */}
      <Modal visible={pickerVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={[styles.pickerContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Select Calculation Region</Text>
            {regions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.pickerItem}
                onPress={() => {
                  setRegion(item.value);
                  setPickerVisible(false);
                }}
              >
                <Text style={[styles.pickerItemText, { color: currentTheme.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingBottom: 50,
  },
  brandingHeader: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logoIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: spacing.md,
    borderRadius: spacing.borderRadiusSm,
    marginBottom: spacing.md,
    width: '100%',
  },
  errorText: {
    color: '#ef4444',
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  authCard: {
    width: '100%',
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  pickerTrigger: {
    height: spacing.touchTargetMin,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  toggleModeBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  shortcutCard: {
    width: '100%',
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  shortcutTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  shortcutBtn: {
    flex: 1,
    height: 38,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerContent: {
    borderRadius: spacing.borderRadiusLg,
    width: '100%',
    padding: spacing.lg,
  },
  pickerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: typography.sizes.sm,
  },
});
