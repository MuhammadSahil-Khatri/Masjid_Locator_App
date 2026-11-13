
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
  Text,
  Animated,
  Easing,
} from 'react-native';

import Svg, {
  Defs,
  Mask,
  Rect,
  Circle,
} from 'react-native-svg';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '../../navigation/NavigationContext';
import * as ExpoSplashScreen from 'expo-splash-screen';

const SPLASH_TRANSITION_DURATION = 600;
const NATIVE_SPLASH_DURATION = 1500;
const CUSTOM_SPLASH_DURATION = 1500;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const SplashScreen = () => {
  const { currentScreen, navigate } = useNavigation();
  const insets = useSafeAreaInsets();

  // Measure actual splash container dimensions.
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

  const { width, height } = containerSize;

  const revealProgress = useRef(new Animated.Value(0)).current;
  const nativeLogoOpacity = useRef(new Animated.Value(1)).current;

  const navigatedRef = useRef(false);

  // Calculate radius needed to reveal all screen corners.
  const maxRadius = Math.sqrt(
    Math.pow(width / 2, 2) + Math.pow(height, 2)
  );

  const animatedRadius = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxRadius],
  });

  // Measure the actual available splash area.
  const handleLayout = (event: any) => {
    const { width: measuredWidth, height: measuredHeight } =
      event.nativeEvent.layout;

    setContainerSize({
      width: measuredWidth,
      height: measuredHeight,
    });
  };

  useEffect(() => {
    if (
      currentScreen !== 'Splash' ||
      width === 0 ||
      height === 0
    ) {
      return;
    }

    let cancelled = false;

    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const startTransition = async () => {
      // Hide actual native splash.
      // React Native white overlay remains visible underneath.
      await ExpoSplashScreen.hideAsync().catch(() => { });

      if (cancelled) return;

      // Reveal custom splash from top-center.
      Animated.parallel([
        Animated.timing(revealProgress, {
          toValue: 1,
          duration: SPLASH_TRANSITION_DURATION,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),

        Animated.timing(nativeLogoOpacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (
          !finished ||
          cancelled ||
          navigatedRef.current
        ) {
          return;
        }

        // Keep custom splash visible after reveal.
        holdTimer = setTimeout(() => {
          if (!cancelled && !navigatedRef.current) {
            navigatedRef.current = true;
            navigate('Home');
          }
        }, CUSTOM_SPLASH_DURATION);
      });
    };

    // Native splash minimum display time.
    const timer = setTimeout(
      startTransition,
      NATIVE_SPLASH_DURATION
    );

    return () => {
      cancelled = true;

      clearTimeout(timer);

      if (holdTimer) {
        clearTimeout(holdTimer);
      }
    };
  }, [
    currentScreen,
    width,
    height,
    navigate,
    revealProgress,
    nativeLogoOpacity,
  ]);

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
    >
      {/* CUSTOM REACT NATIVE SPLASH */}

      <ImageBackground
        source={require('../../../assets/background_image_vertical.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" />

        <View style={styles.middleSection}>
          <View style={styles.logoCardWrapper}>
            <Image
              source={require('../../../assets/adaptive-foreground.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View>
            <Text style={styles.title}>
              Jamiyat Ahl-e-Hadith Hyd.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.bottomSection,
            {
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        />
      </ImageBackground>

      {/* NATIVE SPLASH TRANSITION OVERLAY */}

      {width > 0 && height > 0 && (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        >
          <Svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <Mask
                id="nativeSplashRevealMask"
                x="0"
                y="0"
                width={width}
                height={height}
                maskUnits="userSpaceOnUse"
              >
                {/* White keeps native overlay visible */}
                <Rect
                  x="0"
                  y="0"
                  width={width}
                  height={height}
                  fill="white"
                />

                {/* Black circle reveals custom splash */}
                <AnimatedCircle
                  cx={width / 2}
                  cy={0}
                  r={animatedRadius}
                  fill="black"
                />
              </Mask>
            </Defs>

            {/* Full-screen white overlay */}
            <Rect
              x="0"
              y="0"
              width={width}
              height={height}
              fill="#ffffff"
              mask="url(#nativeSplashRevealMask)"
            />
          </Svg>

          {/* Native splash logo */}
          <Animated.View
            style={[
              styles.nativeLogoContainer,
              {
                opacity: nativeLogoOpacity,
              },
            ]}
          >
            <Image
              source={require('../../../assets/adaptive-foreground.png')}
              style={styles.nativeLogo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },

  background: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  logoCardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  logoImage: {
    width: 350,
    height: 350,
    maxWidth: '100%',
    maxHeight: 350,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  nativeLogoContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nativeLogo: {
    width: 350,
    height: 350,
  },
});
