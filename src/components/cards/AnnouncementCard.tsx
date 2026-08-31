import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Text } from '../ui/Text';
import { useApp } from '../../context/AppContext';
import { KhutbahIcon, TaqreerIcon, NextIcon } from '../../screens/Announcements/AnnouncementIcons';

export interface AnnouncementCardProps {
  id: string;
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  customRightContent?: React.ReactNode;
  isRtl?: boolean;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  id,
  title,
  onPress,
  style,
  customRightContent,
  isRtl: isRtlProp,
}) => {
  const { isRtl: appIsRtl } = useApp();
  const isRtl = isRtlProp !== undefined ? isRtlProp : appIsRtl;

  const renderRightContent = () => {
    if (customRightContent) {
      return customRightContent;
    }

    const lowerId = id.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerId.includes('khutbah') || lowerTitle.includes('khutbah')) {
      return (
        <View style={styles.rightIconWrapper}>
          <KhutbahIcon width={76} height={28} />
        </View>
      );
    }

    if (lowerId.includes('taqreer') || lowerTitle.includes('taqreer')) {
      return (
        <View style={styles.rightIconWrapper}>
          <TaqreerIcon width={52} height={46} />
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.cardTouch, style]}
      onPress={onPress}
    >
      <Image
        source={require('../../../assets/background_image_horizontal.png')}
        style={[
          styles.cardBackgroundImage,
          isRtl && { transform: [{ scaleX: -1 }] },
        ]}
        resizeMode="cover"
      />
      <View
        style={[
          styles.cardBackground,
          isRtl && styles.cardBackgroundRtl,
        ]}
      >
        {/* Left/End content: icon + arrow */}
        {isRtl ? (
          <>
            <View style={styles.cardRightContent}>
              <View style={styles.nextIconWrapper}>
                <NextIcon size={16} color="#FAFEFF" isRtl={isRtl} />
              </View>
              {renderRightContent()}
            </View>
            <View style={styles.cardLeftContent}>
              <Text style={[styles.cardTitle, { textAlign: 'right' }]}>{title}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.cardLeftContent}>
              <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <View style={styles.cardRightContent}>
              {renderRightContent()}
              <View style={styles.nextIconWrapper}>
                <NextIcon size={16} color="#FAFEFF" isRtl={false} />
              </View>
            </View>
          </>
        )}
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
  cardBackground: {
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
  cardBackgroundRtl: {
    paddingLeft: 14,
    paddingRight: 80,
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
  cardLeftContent: {
    justifyContent: 'center',
    flex: 1,
    // paddingRight: 18,
    // marginLeft: 20,
  },
  cardTitle: {
    color: '#FAFEFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  cardRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
});

export default AnnouncementCard;
