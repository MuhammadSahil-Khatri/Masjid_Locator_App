import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { BookOpen, Bell, Share2 } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { AnnouncementCard } from '../../components/cards/AnnouncementCard';
import { useNavigation } from '../../navigation/NavigationContext';

export const HomeScreen: React.FC = () => {
  const { 
    hadeesList, 
    announcements, 
    handleAnnounceRead, 
    highContrast: isDark, 
    isRtl, 
    translations, 
    triggerToast 
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const { navigate } = useNavigation();

  const handleShareHadees = async (text: string, ref: string, source: string) => {
    try {
      await Share.share({
        message: `"${text}"\nReference: ${ref} (${source})`,
      });
    } catch (error) {
      triggerToast('Error sharing Hadees');
    }
  };

  const activeAnnouncements = announcements.slice(0, 3);

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Welcome Hero Area */}
      <View style={[styles.hero, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <Text style={[styles.heroSubtitle, { color: colors.primary }]}>
          {isRtl ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' : 'In the name of Allah, the Most Gracious, the Most Merciful'}
        </Text>
        <Text style={[styles.heroTitle, { color: currentTheme.text }]}>
          {translations.appTitle}
        </Text>
      </View>

      {/* Announcements Panel */}
      {activeAnnouncements.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
            📢 {translations.announcements}
          </Text>
          {activeAnnouncements.map(ann => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              isDark={isDark}
              isRtl={isRtl}
              translations={translations}
              onRead={() => handleAnnounceRead(ann.id)}
            />
          ))}
        </View>
      )}

      {/* Daily Hadees Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
          📖 {translations.dailyHadeesTitle}
        </Text>
        {hadeesList.map((hadees, idx) => (
          <View 
            key={hadees.id} 
            style={[
              styles.hadeesCard, 
              { 
                backgroundColor: currentTheme.card, 
                borderColor: currentTheme.border 
              }
            ]}
          >
            <Text style={styles.watermark}>#{idx + 1}</Text>
            
            <Text style={[styles.arabicText, { color: colors.primary }]}>
              {hadees.textAr}
            </Text>
            <Text style={[styles.urduText, { color: currentTheme.text }]}>
              {hadees.textUr}
            </Text>
            <Text style={[styles.englishText, { color: currentTheme.textMuted }]}>
              {hadees.textEn}
            </Text>

            <View style={[styles.footerRow, isRtl && styles.rowReverse]}>
              <View style={isRtl && styles.alignRight}>
                <Text style={[styles.refLabel, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
                  📌 {translations.reference}
                </Text>
                <Text style={[styles.refValue, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                  {isRtl ? hadees.referenceUr : hadees.referenceEn}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.shareBtn, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleShareHadees(hadees.textEn, hadees.referenceEn, hadees.source)}
              >
                <Share2 size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  hadeesCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: -10,
    right: -5,
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(148, 163, 184, 0.05)',
  },
  arabicText: {
    fontSize: typography.sizes.lg,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  urduText: {
    fontSize: typography.sizes.sm + 1,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
  },
  englishText: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: spacing.sm,
  },
  refLabel: {
    fontSize: typography.sizes.xs - 2,
    textTransform: 'uppercase',
  },
  refValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  shareBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  bottomSpacer: {
    height: 80,
  },
});
