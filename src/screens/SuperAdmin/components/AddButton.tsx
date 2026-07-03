import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Text } from '../../../components/ui/Text';
import { colors, spacing, typography } from '../../../theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AddButtonProps {
  label: string;
  onPress?: () => void;
}

export const AddButton: React.FC<AddButtonProps> = ({ label, onPress }) => {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, rStyle]}>
      <TouchableOpacity
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[styles.button, { backgroundColor: colors.primary }]}
        activeOpacity={0.9}
      >
        <Plus size={20} color="#ffffff" style={styles.icon} />
        <Text style={styles.text} weight="bold">
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
  },
});
export default AddButton;
