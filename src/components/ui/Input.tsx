import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from './Text';
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
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  variant?: 'outline' | 'underline';
  hideLabel?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
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
  rightIcon,
  leftIcon,
  variant = 'outline',
  hideLabel = false,
  keyboardType = 'default',
}) => {
  const currentTheme = isDark ? colors.dark : colors.light;
  const isUnderline = variant === 'underline';

  return (
    <View style={[styles.container, style]}>
      {label && !hideLabel && (
        <Text style={[
          styles.label, 
          { color: currentTheme.textMuted },
          isRtl && typography.alignRtl
        ]}>
          {label}
        </Text>
      )}
      <View style={[
        isUnderline ? styles.inputWrapperUnderline : styles.inputWrapper,
        {
          backgroundColor: isUnderline ? 'transparent' : currentTheme.input,
          borderColor: isUnderline ? currentTheme.border : currentTheme.border,
          borderBottomColor: currentTheme.border,
        }
      ]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={currentTheme.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[
            styles.input,
            {
              color: currentTheme.text,
            },
            isRtl && typography.alignRtl,
            inputStyle,
          ]}
        />
        {rightIcon}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.lg,
  },
  inputWrapperUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderBottomWidth: 1.5,
    paddingHorizontal: 0,
  },
  leftIconContainer: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.sizes.md,
    padding: 0,
  },
});
