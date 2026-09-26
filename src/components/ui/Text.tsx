import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';

export interface TextProps extends RNTextProps {
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  arabic?: boolean;
  urdu?: boolean;
}

const isUrduSpecificChar = (node: any): boolean => {
  if (typeof node === 'string') {
    return /[\u0679\u0688\u0691\u06BA\u06D2\u06BE\u0686\u067E\u0698\u06AF\u0626]/.test(node);
  }
  if (typeof node === 'number') return false;
  if (Array.isArray(node)) return node.some(isUrduSpecificChar);
  if (node && node.props && node.props.children) return isUrduSpecificChar(node.props.children);
  return false;
};

const hasArabicScript = (node: any): boolean => {
  if (typeof node === 'string') {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(node);
  }
  if (typeof node === 'number') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(hasArabicScript);
  }
  if (node && node.props && node.props.children) {
    return hasArabicScript(node.props.children);
  }
  return false;
};

export const Text: React.FC<TextProps> = ({
  style,
  weight,
  arabic,
  urdu,
  children,
  ...props
}) => {
  const flatStyle = StyleSheet.flatten(style) || {};

  // If style explicitly specifies a custom font outside of system generic names, respect it
  const isGenericFont = !flatStyle.fontFamily || 
    flatStyle.fontFamily === 'System' || 
    flatStyle.fontFamily === 'sans-serif' || 
    flatStyle.fontFamily === 'serif' || 
    flatStyle.fontFamily === 'Georgia' ||
    flatStyle.fontFamily === 'monospace';

  if (!isGenericFont) {
    return <RNText {...props} style={style} children={children} />;
  }

  // Determine script type (arabic, urdu, or english)
  const hasScript = hasArabicScript(children);
  const detectedUrdu = isUrduSpecificChar(children);

  let scriptType: 'arabic' | 'urdu' | 'english' = 'english';
  if (arabic) {
    scriptType = 'arabic';
  } else if (urdu) {
    scriptType = 'urdu';
  } else if (hasScript) {
    scriptType = detectedUrdu ? 'urdu' : 'arabic';
  }

  // Determine weight
  let resolvedWeight: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' = weight || 'regular';
  if (!weight && flatStyle.fontWeight) {
    const fw = flatStyle.fontWeight;
    if (fw === '300' || fw === 'light') resolvedWeight = 'light';
    else if (fw === '400' || fw === 'normal') resolvedWeight = 'regular';
    else if (fw === '500' || fw === 'medium') resolvedWeight = 'medium';
    else if (fw === '600' || fw === 'semibold') resolvedWeight = 'semibold';
    else if (fw === '700' || fw === 'bold' || fw === '800' || fw === '900') resolvedWeight = 'bold';
  }

  // Determine font family
  let fontFamily = '';
  if (scriptType === 'arabic') {
    switch (resolvedWeight) {
      case 'semibold':
      case 'bold':
        fontFamily = typography.fonts.arabic.bold;
        break;
      case 'light':
      case 'regular':
      case 'medium':
      default:
        fontFamily = typography.fonts.arabic.regular;
        break;
    }
  } else if (scriptType === 'urdu') {
    switch (resolvedWeight) {
      case 'light':
        fontFamily = typography.fonts.urdu.light;
        break;
      case 'regular':
        fontFamily = typography.fonts.urdu.regular;
        break;
      case 'medium':
        fontFamily = typography.fonts.urdu.medium;
        break;
      case 'semibold':
        fontFamily = typography.fonts.urdu.semibold;
        break;
      case 'bold':
        fontFamily = typography.fonts.urdu.bold;
        break;
      default:
        fontFamily = typography.fonts.urdu.regular;
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
    // Unset fontWeight so React Native doesn't synthesize faux bold over custom font
    fontWeight: undefined,
  };

  // Add RTL & line-height typographic optimizations for Arabic / Urdu
  if (scriptType === 'arabic' || scriptType === 'urdu') {
    finalStyle.writingDirection = 'rtl';

    if (!flatStyle.lineHeight) {
      const fontSize = flatStyle.fontSize || typography.sizes.base;
      finalStyle.lineHeight = Math.round(Number(fontSize) * (scriptType === 'urdu' ? 1.8 : 1.6));
    }
  }

  return <RNText {...props} style={finalStyle} children={children} />;
};

export default Text;

