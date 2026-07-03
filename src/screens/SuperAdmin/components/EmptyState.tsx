import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../components/ui/Text';
import { colors, spacing, typography } from '../../../theme';

interface EmptyStateProps {
  message: string;
  icon: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  const themeColors = colors.light;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={[styles.iconWrapper, { backgroundColor: 'rgba(246, 139, 53, 0.1)' }]}>
        {icon}
      </View>
      <Text style={[styles.messageText, { color: themeColors.text }]} weight="medium">
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.huge,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  messageText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
});
export default EmptyState;
