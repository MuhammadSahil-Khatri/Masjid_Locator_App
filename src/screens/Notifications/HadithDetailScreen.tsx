import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Share2, BookOpen, Globe } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { colors } from '../../theme';
import { typography } from '../../theme/typography';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import { notificationService } from '../../services/notificationService';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const HadithDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isRtl } = useApp();
  const { params, goBack } = useNavigation();
  const { markRecordAsRead } = useNotifications();

  const hadithId = params?.id;

  const [loading, setLoading] = useState(true);
  const [hadith, setHadith] = useState<any | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [showEnglish, setShowEnglish] = useState(!isRtl);

  useEffect(() => {
    let isMounted = true;

    async function loadRecord() {
      if (!hadithId) {
        setIsUnavailable(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const record = await notificationService.fetchHadithById(hadithId);
        if (!isMounted) return;

        if (!record || record.is_active === false) {
          setIsUnavailable(true);
        } else {
          setHadith(record);
          setIsUnavailable(false);
          // Read synchronization: mark this Hadith as read locally
          markRecordAsRead('hadith', hadithId);
        }
      } catch (err) {
        if (isMounted) setIsUnavailable(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRecord();

    return () => {
      isMounted = false;
    };
  }, [hadithId, markRecordAsRead]);

  const handleShare = async () => {
    if (!hadith) return;
    try {
      const text = `${hadith.arabic_text || ''}\n\n${hadith.urdu_translation || ''}\n\n${hadith.english_translation || ''}\n\n[${hadith.reference || 'Hadith'}]`.trim();
      await Share.share({
        message: text,
        title: 'Hadith Share',
      });
    } catch {}
  };

  const title = hadith?.reference || (isRtl ? 'حدیث شریف' : 'Hadith');

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      {/* ── Top Header ── */}
      <View style={styles.headerWrapper}>
        <View style={[styles.headerRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <View style={isRtl ? { transform: [{ scaleX: -1 }] } : undefined}>
              <BackArrowIcon size={14} color="#1D3B6D" />
            </View>
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {isRtl ? 'حدیث شریف' : 'Hadith Details'}
          </Text>

          {hadith && !isUnavailable ? (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.7}
              accessibilityLabel="Share Hadith"
            >
              <Share2 size={18} color="#1D3B6D" />
            </TouchableOpacity>
          ) : (
            <View style={styles.actionPlaceholder} />
          )}
        </View>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <LoadingState message={isRtl ? 'حدیث لوڈ ہو رہی ہے...' : 'Loading Hadith...'} />
        </View>
      ) : isUnavailable || !hadith ? (
        <View style={styles.centered}>
          <EmptyState
            title={isRtl ? 'حدیث دستیاب نہیں ہے' : 'Hadith Unavailable'}
            description={
              isRtl
                ? 'یہ حدیث اب دستیاب نہیں ہے یا اسے حذف/غیر فعال کر دیا گیا ہے۔'
                : 'This Hadith is no longer active or has been removed.'
            }
            onRetry={goBack}
            retryLabel={isRtl ? 'واپس جائیں' : 'Go Back'}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Hadith Card */}
          <View style={styles.card}>
            {/* Reference Header Badge */}
            <View style={[styles.badgeRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={styles.referenceBadge}>
                <BookOpen size={14} color="#D97706" />
                <Text style={styles.referenceBadgeText}>{title}</Text>
              </View>

              {/* Translation toggle button */}
              <TouchableOpacity
                style={styles.langToggleBtn}
                onPress={() => setShowEnglish((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Globe size={14} color={colors.primary} />
                <Text style={styles.langToggleText}>
                  {showEnglish ? 'اردو ترجمہ' : 'English Translation'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Arabic Text Container */}
            {hadith.arabic_text ? (
              <View style={styles.arabicBox}>
                <Text style={styles.arabicText}>
                  {hadith.arabic_text}
                </Text>
              </View>
            ) : null}

            {/* Translation Box */}
            <View style={styles.translationBox}>
              <Text style={styles.translationLabel}>
                {showEnglish ? 'English Translation' : 'اردو ترجمہ'}
              </Text>
              {showEnglish ? (
                <Text style={styles.translationTextEn}>
                  {hadith.english_translation || hadith.urdu_translation}
                </Text>
              ) : (
                <Text style={styles.translationTextUr}>
                  {hadith.urdu_translation || hadith.english_translation}
                </Text>
              )}
            </View>

            {/* Reference Footer */}
            {hadith.reference ? (
              <View style={[styles.footerRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.referenceFooterText}>
                  {isRtl ? `حوالہ: ${hadith.reference}` : `Reference: ${hadith.reference}`}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAFEFF',
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(3, 190, 205, 0.2)',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3B6D',
    letterSpacing: 0.2,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPlaceholder: {
    width: 36,
    height: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(3, 190, 205, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  referenceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(3, 190, 205, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  arabicBox: {
    backgroundColor: '#F7FCFD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(3, 190, 205, 0.15)',
    marginBottom: 16,
  },
  arabicText: {
    fontSize: 22,
    color: '#1D3B6D',
    lineHeight: 40,
    textAlign: 'center',
    fontFamily: typography.fonts.arabic.regular,
  },
  translationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A9BA8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translationTextUr: {
    fontSize: 18,
    color: '#1A2D42',
    lineHeight: 34,
    textAlign: 'right',
    fontFamily: typography.fonts.urdu.regular,
  },
  translationTextEn: {
    fontSize: 15,
    color: '#1A2D42',
    lineHeight: 24,
    textAlign: 'left',
    fontFamily: typography.fonts.english.regular,
  },
  footerRow: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  referenceFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A9BA8',
  },
});

