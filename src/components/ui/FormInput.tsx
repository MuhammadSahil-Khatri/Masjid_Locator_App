/**
 * FormInput — A react-hook-form compatible Input wrapper.
 * Accepts Controller render props and shows inline field errors.
 */
import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { FieldError } from 'react-hook-form';
import { colors, spacing, typography } from '../../theme';

interface FormInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secureTextEntry?: boolean;
  error?: FieldError;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry = false,
  error,
  leftIcon,
  rightIcon,
  style,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable = true,
}) => {
  const theme = colors.light;
  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: hasError ? '#EF4444' : '#CBD5E1',
            backgroundColor: '#FFFFFF',
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9AAAB8"
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          editable={editable}
          style={[styles.input, { color: '#1D3B6D' }]}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {hasError && (
        <Text style={styles.errorText}>{error.message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  leftIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.sizes.base - 1,
    padding: 0,
    fontFamily: typography.fonts.english.regular,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 6,
  },
});

