import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface CustomToastProps {
  message: string | null;
}

export const CustomToast: React.FC<CustomToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 99999,
  },
  toast: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.borderRadiusRound,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    color: '#10b981',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
