import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, spacing, typography } from '../../../theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder }) => {
  const themeColors = colors.light;
  const isFocused = useSharedValue(0);

  const handleFocus = () => {
    isFocused.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
  };

  const handleBlur = () => {
    isFocused.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
  };

  const rSearchStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(isFocused.value ? colors.primary : themeColors.border),
      borderWidth: withTiming(isFocused.value ? 1.5 : 1),
      shadowOpacity: withTiming(isFocused.value ? 0.15 : 0.05),
      transform: [{ scale: withTiming(isFocused.value ? 1.01 : 1, { duration: 200 }) }],
    };
  });

  return (
    <Animated.View style={[styles.searchContainer, { backgroundColor: themeColors.surface }, rSearchStyle]}>
      <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[styles.input, { color: themeColors.text }]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.sizes.base,
    paddingVertical: 0,
  },
});
export default SearchBar;
