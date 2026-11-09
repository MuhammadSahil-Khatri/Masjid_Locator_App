import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../ui/Text';
import { colors, spacing, typography } from '../../theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
  color = colors.primary,
  fullScreen = true,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  fullScreen: {
    flex: 1,
    minHeight: 200,
  },
  messageText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: '#8C9199',
    fontWeight: '500',
    textAlign: 'center',
  },
});

