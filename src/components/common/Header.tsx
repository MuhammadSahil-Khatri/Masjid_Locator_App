import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onFilterPress?: () => void;
  isDark?: boolean;
  isRtl?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onFilterPress,
  isDark = true,
  isRtl = false,
  style,
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;
  const { goBack } = useNavigation();

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: currentTheme.card,
        borderBottomColor: currentTheme.border,
      },
      isRtl && styles.rowReverse,
      style
    ]}>
      {showBack ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={goBack}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>
            {isRtl ? '← واپس' : '← Back'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionBtnPlaceholder} />
      )}

      <Text style={[
        styles.title,
        { color: currentTheme.text }
      ]}>
        {title}
      </Text>

      {onFilterPress ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onFilterPress}
        >
          <SlidersHorizontal size={18} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.actionBtnPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  actionBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  actionBtnPlaceholder: {
    width: 44,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
