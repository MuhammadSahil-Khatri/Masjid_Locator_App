/**
 * Typography configurations for sizes, weights, and RTL alignments.
 */
import { TextStyle, Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Base width for scaling (e.g. standard phone width)
const BASE_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_WIDTH;

// Responsive sizing function
export const responsiveFontSize = (size: number) => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const typography = {
  sizes: {
    xs: responsiveFontSize(12),
    sm: responsiveFontSize(14),
    base: responsiveFontSize(16),
    md: responsiveFontSize(18),
    lg: responsiveFontSize(20),
    xl: responsiveFontSize(22),
    xxl: responsiveFontSize(26),
    huge: responsiveFontSize(34),
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

