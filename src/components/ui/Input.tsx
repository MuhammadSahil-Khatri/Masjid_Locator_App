import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  isDark?: boolean;
  isRtl?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  style,
  inputStyle,
  isDark = true,
  isRtl = false,
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[
          styles.label, 
          { color: currentTheme.textMuted },
          isRtl && typography.alignRtl
        ]}>
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={currentTheme.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          {
            backgroundColor: currentTheme.input,
            borderColor: currentTheme.border,
            color: currentTheme.text,
          },
          isRtl && typography.alignRtl,
          inputStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.sm - 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  input: {
    height: spacing.touchTargetMin,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
  },
});
