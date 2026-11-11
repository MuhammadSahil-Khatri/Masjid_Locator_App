import React from 'react';
import { Animated, Easing, Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

// These MUST match the expo-splash-screen plugin in app.config.js
// (backgroundColor and imageWidth) so the handoff is seamless.
export const SPLASH_BG = '#ffffff';
export const SPLASH_LOGO_SIZE = 250;

// Height of the soft fading edge that sweeps down the screen
const EDGE_HEIGHT = 220;
// Gradient start color: same as SPLASH_BG but fully transparent
const SPLASH_BG_TRANSPARENT = 'rgba(255,255,255,0)';

type Props = {
  /** true once fonts/app are ready and the JS Splash screen can render underneath */
  ready: boolean;
  /** called after the exit animation finishes; unmount the overlay here */
  onFinish: () => void;
};

export function AnimatedSplashOverlay({ ready, onFinish }: Props) {
  const [height, setHeight] = React.useState(Dimensions.get('window').height);
  const [logoLoaded, setLogoLoaded] = React.useState(false);

  const progress = React.useRef(new Animated.Value(0)).current; // 0 -> 1 wipe
  const logoOpacity = React.useRef(new Animated.Value(1)).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setHeight(h);
  };

  // Hide the native splash only after this overlay's logo has drawn.
  // The overlay looks identical, so the user sees no change.
  React.useEffect(() => {
    if (logoLoaded) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [logoLoaded]);

  // Exit: the screen fades away from the top center downward, revealing the app.
  React.useEffect(() => {
    if (!ready || !logoLoaded) return;

    const animation = Animated.sequence([
      Animated.delay(350), // brief hold so the logo is seen
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        // Logo keeps its size and position; it only fades out as the edge reaches it
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 350,
          delay: 250,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => animation.stop();
  }, [ready, logoLoaded, progress, logoOpacity, onFinish]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height + EDGE_HEIGHT],
  });

  return (
    <View pointerEvents="none" style={styles.overlay} onLayout={onLayout}>
      {/* Cover: solid background with a soft gradient edge on top.
          It slides down, so the screen dissolves from the top. */}
      <Animated.View
        style={[
          styles.cover,
          { height: height + EDGE_HEIGHT, top: -EDGE_HEIGHT, transform: [{ translateY }] },
        ]}
      >
        <LinearGradient
          colors={[SPLASH_BG_TRANSPARENT, SPLASH_BG]}
          style={{ height: EDGE_HEIGHT }}
        />
        <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />
      </Animated.View>

      {/* Logo: fixed size, centered, no scaling */}
      <View style={styles.logoWrap}>
        <Animated.Image
          source={require('../../../assets/logo.png')}
          resizeMode="contain"
          onLoadEnd={() => setLogoLoaded(true)}
          style={{
            width: SPLASH_LOGO_SIZE,
            height: SPLASH_LOGO_SIZE,
            opacity: logoOpacity,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 9999,
  },
  cover: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  logoWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});