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
import { Share2, Calendar, Clock, MapPin, Globe } from 'lucide-react-native';
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

export const AnnouncementDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isRtl } = useApp();
  const { params, goBack } = useNavigation();
  const { markRecordAsRead } = useNotifications();

  const announcementId = params?.id;

  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<any | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [showEnglish, setShowEnglish] = useState(!isRtl);

  useEffect(() => {
    let isMounted = true;

    async function loadRecord() {
      if (!announcementId) {
        setIsUnavailable(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const record = await notificationService.fetchAnnouncementById(announcementId);
        if (!isMounted) return;

        if (!record || record.is_active === false) {
          setIsUnavailable(true);
        } else {
          setAnnouncement(record);
          setIsUnavailable(false);
          // Read synchronization: mark this announcement as read locally
          markRecordAsRead('announcement', announcementId);
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
  }, [announcementId, markRecordAsRead]);

  const handleShare = async () => {
    if (!announcement) return;
    try {
      const text = `${announcement.description_ur || ''}\n\n${announcement.description_en || ''}`.trim();
      await Share.share({
        message: text,
        title: 'Jamiyat Ahl-e-Hadith Announcement',
      });
    } catch {}
  };

  const categoryName = isRtl
    ? announcement?.announcement_categories?.name_ur || announcement?.announcement_categories?.name_en || 'اعلان'
    : announcement?.announcement_categories?.name_en || announcement?.announcement_categories?.name_ur || 'Announcement';

  const mosqueName = announcement?.mosques?.name;

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
            {categoryName}
          </Text>

          {announcement && !isUnavailable ? (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.7}
              accessibilityLabel="Share announcement"
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
          <LoadingState message={isRtl ? 'اعلان لوڈ ہو رہا ہے...' : 'Loading announcement...'} />
        </View>
      ) : isUnavailable || !announcement ? (
        <View style={styles.centered}>
          <EmptyState
            title={isRtl ? 'اعلان دستیاب نہیں ہے' : 'Announcement Unavailable'}
            description={
              isRtl
                ? 'یہ اعلان اب دستیاب نہیں ہے یا اسے حذف/غیر فعال کر دیا گیا ہے۔'
                : 'This announcement is no longer active or has been removed.'
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
          {/* Main Card */}
          <View style={styles.card}>
            {/* Category Badge & Mosque row */}
            <View style={[styles.badgeRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{categoryName}</Text>
              </View>

              {mosqueName ? (
                <View style={[styles.mosqueRow, isRtl && { flexDirection: 'row-reverse' }]}>
                  <MapPin size={14} color={colors.primary} />
                  <Text style={styles.mosqueText} numberOfLines={1}>
                    {mosqueName}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Translation language toggle button */}
            <View style={[styles.langToggleRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={styles.langToggleBtn}
                onPress={() => setShowEnglish((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Globe size={14} color={colors.primary} />
                <Text style={styles.langToggleText}>
                  {showEnglish ? 'اردو دیکھیں' : 'View English'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Description Body */}
            {showEnglish ? (
              <Text style={styles.descriptionEn}>
                {announcement.description_en || announcement.description_ur}
              </Text>
            ) : (
              <Text style={styles.descriptionUr}>
                {announcement.description_ur || announcement.description_en}
              </Text>
            )}

            {/* Meta Information Footer */}
            <View style={styles.metaDivider} />
            <View style={[styles.metaFooter, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.metaItem, isRtl && { flexDirection: 'row-reverse' }]}>
                <Calendar size={14} color="#8A9BA8" />
                <Text style={styles.metaText}>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={[styles.metaItem, isRtl && { flexDirection: 'row-reverse' }]}>
                <Clock size={14} color="#8A9BA8" />
                <Text style={styles.metaText}>
                  {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
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
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(3, 190, 205, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  mosqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mosqueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6E82',
  },
  langToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 14,
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
  descriptionUr: {
    fontSize: 18,
    color: '#1A2D42',
    lineHeight: 34,
    textAlign: 'right',
    fontFamily: typography.fonts.urdu.regular,
    marginVertical: 8,
  },
  descriptionEn: {
    fontSize: 15,
    color: '#1A2D42',
    lineHeight: 24,
    textAlign: 'left',
    fontFamily: typography.fonts.english.regular,
    marginVertical: 8,
  },
  metaDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginTop: 18,
    marginBottom: 12,
  },
  metaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#8A9BA8',
    fontWeight: '500',
  },
});

