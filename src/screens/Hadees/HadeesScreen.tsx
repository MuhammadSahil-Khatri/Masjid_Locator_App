import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from '../../components/ui/Text';
import { colors } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { hadithService, Hadith } from '../../services/hadithService';
import { typography } from '../../theme/typography';

// ─── Icons ───────────────────────────────────────────────────────────────────
const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TranslateIcon = ({ color = '#03BECD', size = 15 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 5H21M9 3V5M11.5 13L9.5 11M20.5 21L15.5 11L10.5 21M12.5 17H18.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 5C5.5 9.5 8 12 12 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M9 5C9 7 7.5 9.5 5 11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const DividerSvg = () => (
  <Svg width="100%" height={29} viewBox="0 0 377 29" style={{ alignSelf: 'center', marginVertical: 4 }}>
    <Path
      d="M188.302 20.588C188.199 19.9813 187.928 19.328 187.49 18.628C187.051 17.9187 186.426 17.2607 185.614 16.654C184.811 16.0473 184.008 15.66 183.206 15.492V14.904C183.999 14.7173 184.76 14.372 185.488 13.868C186.225 13.3547 186.841 12.7387 187.336 12.02C187.84 11.2827 188.162 10.5547 188.302 9.836H188.89C188.974 10.3027 189.142 10.7833 189.394 11.278C189.646 11.7633 189.968 12.23 190.36 12.678C190.761 13.1167 191.209 13.5133 191.704 13.868C192.441 14.3907 193.192 14.736 193.958 14.904V15.492C193.444 15.5947 192.912 15.8047 192.362 16.122C191.82 16.4393 191.316 16.8173 190.85 17.256C190.383 17.6853 190 18.138 189.702 18.614C189.263 19.314 188.992 19.972 188.89 20.588H188.302Z"
      fill="#C79A5A"
    />
    <Defs>
      <LinearGradient id="lg0" x1="30" y1="14.5" x2="170.492" y2="14.5" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#C79A5A" stopOpacity="0" />
        <Stop offset="0.5" stopColor="#C79A5A" stopOpacity="0.333" />
        <Stop offset="1" stopColor="#C79A5A" stopOpacity="0" />
      </LinearGradient>
      <LinearGradient id="lg1" x1="348" y1="14.5" x2="207.492" y2="14.5" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#C79A5A" stopOpacity="0" />
        <Stop offset="0.5" stopColor="#C79A5A" stopOpacity="0.333" />
        <Stop offset="1" stopColor="#C79A5A" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Path d="M30 14.497H170.492" stroke="url(#lg0)" strokeWidth="0.994" />
    <Path d="M207.492 14.497H348" stroke="url(#lg1)" strokeWidth="0.994" />
  </Svg>
);

// ─── Hadith Card ──────────────────────────────────────────────────────────────
interface HadithCardProps {
  hadith: Hadith;
  isRtl: boolean;
}

const HadithCard = ({ hadith, isRtl }: HadithCardProps) => {
  const [showEnglish, setShowEnglish] = useState(!isRtl);

  useEffect(() => {
    setShowEnglish(!isRtl);
  }, [isRtl]);

  const formattedDate = hadith.created_at
    ? new Date(hadith.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '';

  const translationText = showEnglish
    ? (hadith.english_translation || hadith.urdu_translation)
    : (hadith.urdu_translation || hadith.english_translation);

  return (
    <View style={styles.hadithCard}>
      {/* Arabic Text */}
      <Text style={styles.arabicText}>
        {hadith.arabic_text}
      </Text>

      <DividerSvg />

      {/* Urdu / English Translation */}
      <Text style={[showEnglish ? styles.translationTextEnglish : styles.translationTextUrdu, isRtl && styles.textRtl]}>
        {translationText}
      </Text>


      <View style={styles.lineBreaker} />
      {/* Footer Row */}
      <View style={[styles.cardFooter, isRtl && styles.rowReverse]}>
        {/* Date + Reference */}
        <View style={[styles.footerLeft, isRtl && styles.rowReverse]}>
          {formattedDate ? (
            <Text style={styles.footerDate}>{formattedDate}</Text>
          ) : null}
          {hadith.reference ? (
            <Text style={styles.footerReference}>{hadith.reference}</Text>
          ) : null}
        </View>

        {/* Actions */}
        {(!!hadith.english_translation || !!hadith.urdu_translation) && (
          <View style={[styles.footerActions, isRtl && styles.alignRight]}>
            {/* Translate Toggle */}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const HadeesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();
  const { isRtl, triggerToast } = useApp();

  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await hadithService.fetchPublicHadith();
      setHadiths(data);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load Ahadees';
      setError(msg);
      triggerToast(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
  }, [fetchData]);

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.container}
      imageStyle={styles.backgroundImageStyle}
      resizeMode="stretch"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Floating Pill Header ── */}
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

          <Text style={styles.pillTitle}>{isRtl ? 'احادیث' : 'Ahadees'}</Text>

          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      {/* ── Main White Rounded Container ── */}
      <View style={styles.mainContainer}>
        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>{isRtl ? 'لوڈ ہو رہا ہے...' : 'Loading Ahadees...'}</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>⚠️</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>{isRtl ? 'دوبارہ کوشش کریں' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : hadiths.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>📖</Text>
            <Text style={styles.stateText}>{isRtl ? 'کوئی حدیث دستیاب نہیں' : 'No Ahadees available'}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 80 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {hadiths.map((hadith, index) => (
              <HadithCard
                key={hadith.id || index}
                hadith={hadith}
                isRtl={isRtl}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
};

export default HadeesScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
  },

  // ── Header ──
  headerWrapper: {
    paddingBottom: 12,
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
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
  },

  // ── Main Container ──
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF1f',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    marginTop: 6,
    marginHorizontal: 6,
    // paddingTop: 10
  },
  scrollList: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    gap: 14,
  },

  // ── Hadith Card ──
  hadithCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    // borderWidth: 1.5,
    // borderColor: '#88E2EB',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#03BECD', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { shadowColor: '#03BECD', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    }),
  },
  arabicText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'right',
    lineHeight: 38,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'android' ? "serif" : 'Georgia',
  },
  dotDivider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginVertical: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#03BECD',
  },
  translationTextUrdu: {
    paddingLeft: 40,
    fontSize: 18,
    color: '#3A4A6B',
    lineHeight: 34,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  translationTextEnglish: {
    paddingRight: 12,
    paddingLeft: 10,
    fontSize: 18,
    color: '#3A4A6B',
    lineHeight: 34,
    textAlign: 'left',
    fontWeight: '500',
  },
  textRtl: {
    textAlign: 'right',
  },

  lineBreaker: {
    height: 0.4,
    backgroundColor: colors.gray,
    width: "100%",
    alignSelf: 'center',
    marginTop: 15,

  },

  // ── Card Footer ──
  cardFooter: {
    flexDirection: 'column',
    // alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 2,
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4
  },
  footerLeft: {
    flex: 1,
    gap: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 25,
    width: "100%",
  },
  footerDate: {
    fontSize: 11,
    color: '#8C9199',
    fontWeight: '500',
  },
  footerReference: {
    fontSize: 10,
    color: colors.gray,
    fontWeight: '600',
    // letterSpacing: 0.2,
  },
  footerActions: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // gap: 10,
  },
  translateBtn: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // gap: 4,
  },
  translateBtnText: {
    fontSize: 11,
    color: '#03BECD',
    fontWeight: '600',
  },
  translateBtnActive: {
    // color: '#1D3B6D',
  },
  bookmarkBtn: {
    padding: 4,
  },

  // ── States ──
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 40,
  },
  stateText: {
    fontSize: 14,
    color: '#8C9199',
    fontWeight: '500',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#03BECD',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
});