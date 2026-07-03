import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { colors, spacing } from '../../../theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface FilterButtonProps {
  onPress?: () => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ onPress }) => {
  const themeColors = colors.light;
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={rStyle}>
      <TouchableOpacity
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
        activeOpacity={0.8}
        accessibilityLabel="Filter results"
      >
        <SlidersHorizontal size={20} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: spacing.sm,
  },
});
export default FilterButton;
