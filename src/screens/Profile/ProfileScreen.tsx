import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch 
} from 'react-native';
import { BookOpen, Bell, Shield, Users } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigation } from '../../navigation/NavigationContext';

export const ProfileScreen: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser,
    highContrast, 
    setHighContrast, 
    language, 
    setLanguage, 
    translations, 
    isRtl, 
    triggerToast 
  } = useApp();

  const currentTheme = highContrast ? colors.dark : colors.light;
  const { navigate } = useNavigation();

  // Notification states
  const [notifyPrayer, setNotifyPrayer] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);
  
  // Custom User Inputs
  const [cnic, setCnic] = useState(currentUser?.region ? '42201-1234567-9' : '');

  const handleLangToggle = () => {
    setLanguage(prev => prev === 'en' ? 'ur' : 'en');
    triggerToast(language === 'en' ? 'زبان تبدیل کر دی گئی ہے!' : 'Language switched to English!');
  };

  const handleThemeToggle = () => {
    setHighContrast(prev => !prev);
    triggerToast('Theme switched!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    triggerToast('Logged out successfully');
    navigate('Auth');
  };

  const handleSavePreferences = () => {
    triggerToast('Preferences saved!');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          👤 {translations.settings}
        </Text>
      </View>

      <View style={styles.paddingContainer}>
        {currentUser ? (
          <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.cardTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              Logged In User Profile
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.profileText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              Name: {currentUser.name}
            </Text>
            <Text style={[styles.profileText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              Email: {currentUser.email}
            </Text>
            <Text style={[styles.profileText, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              Role: {currentUser.role.toUpperCase()}
            </Text>

            <Input
              label={translations.cnicLabel}
              placeholder="e.g. 42201-XXXXXXX-X"
              value={cnic}
              onChangeText={setCnic}
              isDark={highContrast}
              isRtl={isRtl}
              style={{ marginTop: spacing.md }}
            />

            <Button
              title={translations.logoutBtn}
              variant="danger"
              onPress={handleLogout}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.cardTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              Account Actions
            </Text>
            <Text style={[styles.cardSubtitle, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
              Login to access admin panel settings
            </Text>
            <Button
              title="Sign In to Admin Portal"
              onPress={() => navigate('Auth')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {/* Visual Adaptations */}
        <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }, { marginTop: spacing.lg }]}>
          <Text style={[styles.cardTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
            {translations.largeTextLabel}
          </Text>
          <View style={styles.divider} />

          <View style={[styles.settingRow, isRtl && styles.rowReverse]}>
            <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
              {translations.langToggleLabel}
            </Text>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
              onPress={handleLangToggle}
            >
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                {language === 'en' ? 'اردو' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, isRtl && styles.rowReverse]}>
            <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
              {translations.highContrastMode}
            </Text>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
              onPress={handleThemeToggle}
            >
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                {highContrast ? 'Off-White' : 'Slate Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications preferences */}
        <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }, { marginTop: spacing.lg }]}>
          <Text style={[styles.cardTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
            {translations.notificationHeading}
          </Text>
          <View style={styles.divider} />

          {[
            { label: 'Prayer Reminders', state: notifyPrayer, setState: setNotifyPrayer },
            { label: 'Announcements Feed', state: notifyUpdates, setState: setNotifyUpdates },
            { label: 'Events Reminders', state: notifyEvents, setState: setNotifyEvents }
          ].map((item, idx) => (
            <View key={idx} style={[styles.switchRow, isRtl && styles.rowReverse]}>
              <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{item.label}</Text>
              <Switch
                value={item.state}
                onValueChange={item.setState}
                trackColor={{ false: currentTheme.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          ))}

          <Button
            title="Save Preferences"
            onPress={handleSavePreferences}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  paddingContainer: {
    padding: spacing.md,
  },
  card: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginVertical: spacing.sm,
  },
  profileText: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: typography.sizes.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  bottomSpacer: {
    height: 80,
  },
});
