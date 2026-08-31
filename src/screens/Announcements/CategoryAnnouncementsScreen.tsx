import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../components/ui/Text';
import { colors } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { announcementService, Announcement } from '../../services/announcementService';

// ── Back Arrow SVG matching SettingsScreen ──────────────────────────────────
const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Announcement Item Card Component ────────────────────────────────────────
interface AnnouncementCardProps {
  item: Announcement;
  isRtl: boolean;
}

const AnnouncementItemCard: React.FC<AnnouncementCardProps> = ({ item, isRtl }) => {
  const [showEnglish, setShowEnglish] = useState(!isRtl);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setShowEnglish(!isRtl);
  }, [isRtl]);

  // Content selection based on translation toggle
  const englishText = item.description_en || item.description || '';
  const urduText = item.description_ur || item.description || item.description_en || '';
  const activeContent = showEnglish
    ? (englishText || urduText)
    : (urduText || englishText);

  // Detect whether active text is Arabic/Urdu or English
  const isUrduText = /[\u0600-\u06FF]/.test(activeContent);

  // Format date like HadeesScreen
  const formattedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '';

  // Determine if "See more" is needed
  const isLongText = activeContent.length > 280 || (activeContent.match(/\n/g) || []).length > 6;

  return (
    <View style={styles.cardContainer}>
      {/* Announcement Body Content - Left aligned for English, Right aligned for Urdu */}
      <Text
        style={[
          styles.bodyContentText,
          isUrduText ? styles.bodyContentUrdu : styles.bodyContentEnglish,
        ]}
        numberOfLines={isExpanded ? undefined : 7}
      >
        {activeContent}
      </Text>

      {/* See More / See Less Toggle */}
      {isLongText && (
        <TouchableOpacity
          onPress={() => setIsExpanded((prev) => !prev)}
          activeOpacity={0.7}
          style={[styles.seeMoreBtn, isUrduText && styles.alignSelfRight]}
        >
          <Text style={styles.seeMoreText}>
            {isExpanded
              ? (isUrduText ? 'کم دیکھیں' : 'See less')
              : (isUrduText ? 'مزید دیکھیں' : 'See more')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Line Breaker matching HadeesScreen */}
      <View style={styles.lineBreaker} />

      {/* Footer Row matching HadeesScreen */}
      <View style={styles.cardFooter}>
        <View style={[styles.footerLeft, isRtl && styles.rowReverse]}>
          {formattedDate ? (
            <Text style={styles.footerDate}>{formattedDate}</Text>
          ) : null}
          {item.mosque_name ? (
            <Text style={styles.footerReference} numberOfLines={1}>
              {item.mosque_name}
            </Text>
          ) : null}
        </View>

        {/* Translation Option */}
        {(!!item.description_en || !!item.description_ur) && (
          <View style={[styles.footerActions, isRtl && styles.alignRight]}>
            <TouchableOpacity
              style={styles.translateBtn}
              onPress={() => setShowEnglish((prev) => !prev)}
              activeOpacity={0.7}
              accessibilityLabel={showEnglish ? 'Show Urdu' : 'Translate to English'}
            >
              <Text style={[styles.translateBtnText, showEnglish && styles.translateBtnActive]}>
                {showEnglish ? 'اردو میں ترجمہ' : '> translate into English'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────────────
export const CategoryAnnouncementsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { params, goBack } = useNavigation();
  const { isRtl } = useApp();

  const categoryId: string = params?.categoryId || '';
  const categoryNameEn: string = params?.categoryName || params?.categoryNameEn || 'Announcement';
  const categoryNameUr: string = params?.categoryNameUr || '';

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dbAnnouncements, setDbAnnouncements] = useState<Announcement[]>([]);

  // Dynamically load announcements from Supabase
  const loadAnnouncements = async () => {
    try {
      let data: Announcement[] = [];
      if (categoryId) {
        data = await announcementService.fetchAnnouncementsByCategory(categoryId);
      }

      // Fallback search in public announcements by category ID or category name
      if (!data || data.length === 0) {
        const publicList = await announcementService.fetchPublicAnnouncements();
        data = publicList.filter(
          (a) =>
            a.category_id === categoryId ||
            (a.category_name_en && a.category_name_en.toLowerCase() === categoryNameEn.toLowerCase()) ||
            (a.category_name && a.category_name.toLowerCase() === categoryNameEn.toLowerCase())
        );
      }

      setDbAnnouncements(data || []);
    } catch (e) {
      console.error('Error fetching dynamic announcements from Supabase:', e);
      setDbAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadAnnouncements();
  }, [categoryId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const categoryDisplayName = isRtl && categoryNameUr ? categoryNameUr : categoryNameEn;

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Top Header Section with Floating Pill matching SettingsScreen ── */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        <View style={[styles.pillContainer, isRtl && styles.rowReverse]}>
          <TouchableOpacity
            style={styles.pillActionBtn}
            activeOpacity={0.7}
            onPress={goBack}
            accessibilityLabel="Go Back"
          >
            <BackArrowIcon size={14} color="#1D3B6D" />
          </TouchableOpacity>

          <Text style={styles.pillTitle} numberOfLines={1}>
            {categoryDisplayName}
          </Text>

          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      {/* ── Main Content Area ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : dbAnnouncements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {isRtl ? 'کوئی اعلان موجود نہیں ہے' : 'No Announcements Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isRtl
                  ? 'اس زمرے کے لیے فی الحال کوئی فعال اعلان دستیاب نہیں ہے۔'
                  : `There are currently no active announcements in ${categoryDisplayName}.`}
              </Text>
            </View>
          </View>
        ) : (
          dbAnnouncements.map((item) => (
            <AnnouncementItemCard
              key={item.id}
              item={item}
              isRtl={isRtl}
            />
          ))
        )}
      </ScrollView>
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
  pillActionPlaceholder: {
    width: 32,
    height: 32,
  },
  pillTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'center',
    letterSpacing: 0.2,
    flex: 1,
  },
  rowReverse: {
    // flexDirection: 'row-reverse',
  },

  // ── Scroll Content ──────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Announcement Card ───────────────────────────────────────────────────────
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    }),
  },
  bodyContentText: {
    color: '#1D3B6D',
    letterSpacing: 0.1,
  },
  bodyContentEnglish: {
    fontSize: 14.5,
    lineHeight: 23,
    textAlign: 'left',
  },
  bodyContentUrdu: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right',
  },
  alignSelfRight: {
    alignSelf: 'flex-end',
  },
  textRtl: {
    textAlign: 'right',
  },
  alignRight: {
    alignItems: 'flex-end',
  },

  // ── See More Toggle ──
  seeMoreBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  seeMoreText: {
    fontSize: 12,
    color: '#03BECD',
    fontWeight: '700',
  },

  // ── Breaker Line matching HadeesScreen ──
  lineBreaker: {
    height: 0.4,
    backgroundColor: colors.gray,
    width: '100%',
    alignSelf: 'center',
    marginTop: 14,
  },

  // ── Card Footer matching HadeesScreen ──
  cardFooter: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 6,
    paddingHorizontal: 2,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 22,
    width: '100%',
  },
  footerDate: {
    fontSize: 11,
    color: '#8C9199',
    fontWeight: '500',
  },
  footerReference: {
    fontSize: 10.5,
    color: colors.gray,
    fontWeight: '600',
    maxWidth: '55%',
  },
  footerActions: {
    alignItems: 'flex-start',
  },
  translateBtn: {
    paddingVertical: 2,
  },
  translateBtnText: {
    fontSize: 11,
    color: '#03BECD',
    fontWeight: '600',
  },
  translateBtnActive: {
    color: '#0088A5',
  },

  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyContainer: {
    paddingTop: 30,
    paddingHorizontal: 6,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default CategoryAnnouncementsScreen;
