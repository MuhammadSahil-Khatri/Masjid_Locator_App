import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui/Text';
import { useNavigation } from '../../../navigation/NavigationContext';

const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface SectionHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onBack, rightElement }) => {
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  return (
    <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
      <View style={styles.pillContainer}>
        <TouchableOpacity
          style={styles.pillActionBtn}
          activeOpacity={0.7}
          onPress={handleBack}
          accessibilityLabel="Go Back"
        >
          <BackArrowIcon size={14} color="#1D3B6D" />
        </TouchableOpacity>

        <Text style={styles.pillTitle} numberOfLines={1}>
          {title}
        </Text>

        {rightElement ? (
          <View style={styles.pillActionBtn}>
            {rightElement}
          </View>
        ) : (
          <View style={styles.pillActionPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default SectionHeader;


