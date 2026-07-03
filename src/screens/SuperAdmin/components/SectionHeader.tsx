import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '../../../components/ui/Text';
import { useNavigation } from '../../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../../theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { goBack } = useNavigation();
  const themeColors = colors.light;
  const backScale = useSharedValue(1);

  const rBackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: backScale.value }],
    };
  });

  return (
    <View style={[styles.headerContainer, { borderBottomColor: themeColors.border }]}>
      <Animated.View style={rBackStyle}>
        <TouchableOpacity
          onPressIn={() => {
            backScale.value = withSpring(0.85);
          }}
          onPressOut={() => {
            backScale.value = withSpring(1);
          }}
          onPress={goBack}
          style={[styles.backButton, { backgroundColor: 'rgba(246, 139, 53, 0.1)' }]}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.titleText, { color: themeColors.text }]} weight="bold">
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    flex: 1,
  },
  spacer: {
    width: 40, // Keeps title centered by balancing back button width
  },
});
export default SectionHeader;
