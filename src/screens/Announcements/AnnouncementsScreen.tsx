import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { colors } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { AnnouncementCard } from '../../components/cards/AnnouncementCard';
import { announcementService } from '../../services/announcementService';


const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export interface AnnouncementCategory {
  id: string;
  name_en: string;
  name_ur: string;
}

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  {
    id: '0b2513cc-4aec-4466-a218-fe6a3113796a',
    name_en: 'Funding Programs',
    name_ur: 'فنڈنگ پروگرامز',
  },
  {
    id: '46795502-340e-49ab-8f3c-8c14653362bc',
    name_en: 'Masjid Under Construction',
    name_ur: 'زیر تعمیر مسجد',
  },
  {
    id: '4800d5f2-b9b8-4a3a-98d5-b8a4560e631a',
    name_en: 'Taqreer',
    name_ur: 'تقریر',
  },
  {
    id: '7b0f22aa-8522-48ed-b72e-5106e0dd7cea',
    name_en: 'Jummah Khutbah',
    name_ur: 'جمعہ خطبہ',
  },
  {
    id: '9271b8de-2ce4-4e0b-bd24-3189fbfa3c4e',
    name_en: 'Daily Programs',
    name_ur: 'روزانہ کے پروگرام',
  },
  {
    id: 'df81963d-ec21-4ea5-8cc0-d2dffec6df3c',
    name_en: 'Mega Programs',
    name_ur: 'بڑے پروگرام',
  },
  {
    id: 'ea08f71b-3fdd-46eb-91eb-5ebdc183aa59',
    name_en: 'Janazha',
    name_ur: 'جنازہ',
  },
  {
    id: 'ee65eb1f-037e-464c-a196-4e7bdc008e76',
    name_en: 'Madarsa Updates',
    name_ur: 'مدرسہ کی تازہ معلومات',
  },
];

export const AnnouncementsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { navigate, goBack } = useNavigation();
  const { isRtl } = useApp();

  const [categories, setCategories] = React.useState<AnnouncementCategory[]>(ANNOUNCEMENT_CATEGORIES);

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await announcementService.fetchCategories();
        if (data && data.length > 0) {
          // Merge dynamic categories with Urdu/English translations
          const merged: AnnouncementCategory[] = data.map((c: any) => {
            const staticMatch = ANNOUNCEMENT_CATEGORIES.find((s) => s.id === c.id || s.name_en.toLowerCase() === (c.name_en || c.name || '').toLowerCase());
            return {
              id: c.id,
              name_en: c.name_en || c.name || staticMatch?.name_en || '',
              name_ur: c.name_ur || staticMatch?.name_ur || '',
            };
          });
          setCategories(merged);
        }
      } catch {
        // Fallback to static categories
      }
    };
    loadCategories();
  }, []);

  const handleCategoryPress = (category: AnnouncementCategory) => {
    navigate('CategoryAnnouncements', {
      categoryId: category.id,
      categoryName: category.name_en,
      categoryNameEn: category.name_en,
      categoryNameUr: category.name_ur,
    });
  };

  const handleBack = () => {
    goBack();
  };

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.container}
      imageStyle={styles.backgroundImageStyle}
      resizeMode="stretch"
    >
      {/* Top Header Section */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        {/* Floating White Pill Header matching CategoryAnnouncements / Settings */}
        <View style={[styles.pillContainer, isRtl && styles.rowReverse]}>
          <TouchableOpacity
            style={styles.pillActionBtn}
            activeOpacity={0.7}
            onPress={handleBack}
            accessibilityLabel="Go Back"
          >
            <BackArrowIcon size={14} color="#1D3B6D" />
          </TouchableOpacity>

          <Text style={styles.pillTitle} numberOfLines={1}>
            {isRtl ? 'اعلانات' : 'Announcement'}
          </Text>

          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      {/* Categories Cards List */}
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 75 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((item) => {
            const title = isRtl ? item.name_ur : item.name_en;
            return (
              <AnnouncementCard
                key={item.id}
                id={item.id}
                title={title}
                onPress={() => handleCategoryPress(item)}
              />
            );
          })}
        </ScrollView>
      </View>
    </ImageBackground >
  );
};

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
  headerWrapper: {
    paddingBottom: 16,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
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
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff1f',
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 10,
  },
});

export default AnnouncementsScreen;
