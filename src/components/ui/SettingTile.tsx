import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from './Text';
import { ChevronRight } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../../theme';

interface SettingTileProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  isDark: boolean;
  isRtl?: boolean;
  textColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SettingTile: React.FC<SettingTileProps> = ({
  icon,
  title,
  onPress,
  isDark,
  isRtl = false,
  textColor
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      style={[
        styles.container, 
        { 
          backgroundColor: currentTheme.card,
          borderColor: currentTheme.border 
        },
        rStyle,
        isRtl && styles.rowReverse
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: currentTheme.surface }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.title, 
          { color: textColor || currentTheme.text },
          isRtl && typography.alignRtl
        ]}>
          {title}
        </Text>
      </View>
      <ChevronRight size={20} color={currentTheme.textMuted} style={isRtl ? { transform: [{ rotate: '180deg' }] } : {}} />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
