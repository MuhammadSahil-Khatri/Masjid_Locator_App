import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { DuaCategory } from '../../services/duaService';
import { NextIcon } from './DuaIcons';

interface DuaCategoryCardProps {
  category: DuaCategory;
  onPress: () => void;
  isRtl?: boolean;
}

export const DuaCategoryCard: React.FC<DuaCategoryCardProps> = ({
  category,
  onPress,
  isRtl = false,
}) => {
  const title = isRtl && category.titleUr ? category.titleUr : category.titleEn;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardTouch}
      onPress={onPress}
    >
      {/* Background Graphic */}
      <Image
        source={require('../../../assets/background_image_horizontal.png')}
        style={[
          styles.cardBackgroundImage,
          isRtl && { transform: [{ scaleX: -1 }] },
        ]}
        resizeMode="cover"
      />

      <View style={[styles.cardContent, isRtl && styles.cardContentRtl]}>
        {/* Title & Count */}
        <View style={[styles.textContainer, isRtl && { alignItems: 'flex-end', flexDirection: 'row-reverse', gap: 10 }]}>
          <Text
            style={[styles.primaryTitle, isRtl && { textAlign: 'right', lineHeight: 32, fontSize: 14 }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={[styles.countBadge, isRtl && { alignSelf: 'flex-end' }]}>
            <Text style={styles.countText}>
              {category.entryCount} {isRtl ? 'دعائیں' : 'Supplications'}
            </Text>
          </View>
        </View>

        {/* Inline Next Arrow — matches AnnouncementCard */}
        <View style={styles.nextIconWrapper}>
          <NextIcon size={16} color="#FAFEFF" isRtl={isRtl} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardTouch: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
    }),
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    width: '100%',
    height: '100%',
  },
  cardContent: {
    width: '100%',
    height: 74,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#FAFEFF',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 80,
    paddingRight: 14,
  },
  cardContentRtl: {
    paddingLeft: 14,
    paddingRight: 60,
    flexDirection: 'row-reverse',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingRight: 20
  },
  primaryTitle: {
    color: '#FAFEFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  nextIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
});
