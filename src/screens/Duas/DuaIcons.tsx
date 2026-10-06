import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
}

export const BackArrowIcon: React.FC<IconProps> = ({ size = 14, color = '#1D3B6D' }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const NextIcon: React.FC<IconProps & { isRtl?: boolean }> = ({ size = 16, color = '#FAFEFF', isRtl = false }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 8 13"
    fill="none"
    style={isRtl ? { transform: [{ rotate: '180deg' }] } : undefined}
  >
    <Path
      d="M1.5 1.5L6.5 6.5L1.5 11.5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, color = '#1D3B6D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M20 20L16.5 16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const ClearIcon: React.FC<IconProps> = ({ size = 16, color = '#8E8E93' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.2" />
    <Path d="M15 9L9 15M9 9L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const CopyIcon: React.FC<IconProps> = ({ size = 16, color = '#1D3B6D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16, color = '#0081A0' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({ size = 16, color = '#1D3B6D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
    <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" />
  </Svg>
);

export const RepeatIcon: React.FC<IconProps> = ({ size = 14, color = '#C79A5A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 1l4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 13v2a4 4 0 0 1-4 4H3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BookIcon: React.FC<IconProps> = ({ size = 18, color = '#1D3B6D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const DuaHandsIcon: React.FC<IconProps> = ({ size = 28, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 11V5a2 2 0 0 1 4 0v6M11 6a2 2 0 0 1 4 0v5M15 8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-3a2 2 0 0 1 4 0v3"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GoldenDividerSvg: React.FC = () => (
  <Svg width="100%" height={26} viewBox="0 0 377 29" style={{ alignSelf: 'center', marginVertical: 6 }}>
    <Path
      d="M188.302 20.588C188.199 19.9813 187.928 19.328 187.49 18.628C187.051 17.9187 186.426 17.2607 185.614 16.654C184.811 16.0473 184.008 15.66 183.206 15.492V14.904C183.999 14.7173 184.76 14.372 185.488 13.868C186.225 13.3547 186.841 12.7387 187.336 12.02C187.84 11.2827 188.162 10.5547 188.302 9.836H188.89C188.974 10.3027 189.142 10.7833 189.394 11.278C189.646 11.7633 189.968 12.23 190.36 12.678C190.761 13.1167 191.209 13.5133 191.704 13.868C192.441 14.3907 193.192 14.736 193.958 14.904V15.492C193.444 15.5947 192.912 15.8047 192.362 16.122C191.82 16.4393 191.316 16.8173 190.85 17.256C190.383 17.6853 190 18.138 189.702 18.614C189.263 19.314 188.992 19.972 188.89 20.588H188.302Z"
      fill="#C79A5A"
    />
    <Defs>
      <LinearGradient id="duaLg0" x1="30" y1="14.5" x2="170.492" y2="14.5" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#C79A5A" stopOpacity="0" />
        <Stop offset="0.5" stopColor="#C79A5A" stopOpacity="0.4" />
        <Stop offset="1" stopColor="#C79A5A" stopOpacity="0" />
      </LinearGradient>
      <LinearGradient id="duaLg1" x1="348" y1="14.5" x2="207.492" y2="14.5" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#C79A5A" stopOpacity="0" />
        <Stop offset="0.5" stopColor="#C79A5A" stopOpacity="0.4" />
        <Stop offset="1" stopColor="#C79A5A" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Path d="M30 14.497H170.492" stroke="url(#duaLg0)" strokeWidth="1" />
    <Path d="M207.492 14.497H348" stroke="url(#duaLg1)" strokeWidth="1" />
  </Svg>
);
