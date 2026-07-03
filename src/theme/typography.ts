/**
 * Typography configurations for sizes, weights, and RTL alignments.
 */
import { TextStyle } from 'react-native';

export const typography = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    huge: 32,
  },
  weights: {
    light: '300' as TextStyle['fontWeight'],
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
  fonts: {
    english: {
      light: 'Inter-Light',
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    arabic: {
      regular: 'NotoNaskhArabic-Regular',
      medium: 'NotoNaskhArabic-Medium',
      semibold: 'NotoNaskhArabic-SemiBold',
      bold: 'NotoNaskhArabic-Bold',
    },
  },
  lineHeights: {
    tight: 16,
    normal: 20,
    relaxed: 24,
    loose: 32,
  },
  // Alignment helpers for RTL language (Urdu)
  alignRtl: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  alignLtr: {
    textAlign: 'left' as const,
    writingDirection: 'ltr' as const,
  },
};

