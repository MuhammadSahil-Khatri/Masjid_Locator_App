import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';

export interface TextProps extends RNTextProps {
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  arabic?: boolean;
}

const hasArabicCharacters = (node: any): boolean => {
  if (typeof node === 'string') {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(node);
  }
  if (typeof node === 'number') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(hasArabicCharacters);
  }
  if (node && node.props && node.props.children) {
    return hasArabicCharacters(node.props.children);
  }
  return false;
};

export const Text: React.FC<TextProps> = ({
  style,
  weight,
  arabic,
  children,
  ...props
}) => {
  const flatStyle = StyleSheet.flatten(style) || {};

  // If style already defines a custom fontFamily (other than standard defaults), respect it
  if (flatStyle.fontFamily && flatStyle.fontFamily !== 'System' && flatStyle.fontFamily !== 'sans-serif') {
    return <RNText {...props} style={style} children={children} />;
  }

  // Detect if the text contains Arabic characters
  const isArabic = arabic || hasArabicCharacters(children);

  // Determine weight
  let resolvedWeight: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' = weight || 'regular';
  if (!weight && flatStyle.fontWeight) {
    const fw = flatStyle.fontWeight;
    if (fw === '300' || fw === 'light') resolvedWeight = 'light';
    else if (fw === '400' || fw === 'normal') resolvedWeight = 'regular';
    else if (fw === '500' || fw === 'medium') resolvedWeight = 'medium';
    else if (fw === '600' || fw === 'semibold') resolvedWeight = 'semibold';
    else if (fw === '700' || fw === 'bold') resolvedWeight = 'bold';
  }

  // Determine font family
  let fontFamily = '';
  if (isArabic) {
    switch (resolvedWeight) {
      case 'light':
      case 'regular':
        fontFamily = typography.fonts.arabic.regular;
        break;
      case 'medium':
        fontFamily = typography.fonts.arabic.medium;
        break;
      case 'semibold':
        fontFamily = typography.fonts.arabic.semibold;
        break;
      case 'bold':
        fontFamily = typography.fonts.arabic.bold;
        break;
      default:
        fontFamily = typography.fonts.arabic.regular;
    }
  } else {
    switch (resolvedWeight) {
      case 'light':
        fontFamily = typography.fonts.english.light;
        break;
      case 'regular':
        fontFamily = typography.fonts.english.regular;
        break;
      case 'medium':
        fontFamily = typography.fonts.english.medium;
        break;
      case 'semibold':
        fontFamily = typography.fonts.english.semibold;
        break;
      case 'bold':
        fontFamily = typography.fonts.english.bold;
        break;
      default:
        fontFamily = typography.fonts.english.regular;
    }
  }

  const finalStyle: TextStyle = {
    ...flatStyle,
    fontFamily,
    // Unset the fontWeight so that the OS does not try to bold the custom font family
    fontWeight: undefined,
  };

  // Add Arabic typographic optimizations
  if (isArabic) {
    // Enable writing direction for Arabic / RTL
    finalStyle.writingDirection = 'rtl';
    
    // Set proper line height for Arabic fonts, which are generally taller.
    // If line height is already set in flatStyle, respect it; otherwise calculate dynamically.
    if (!flatStyle.lineHeight) {
      const fontSize = flatStyle.fontSize || typography.sizes.base;
      finalStyle.lineHeight = Math.round(Number(fontSize) * 1.6);
    }
  }

  return <RNText {...props} style={finalStyle} children={children} />;
};

export default Text;
