import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ImageBackground, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { useAuth } from '../../hooks/useAuth';

export const SplashScreen = () => {
  const { navigate } = useNavigation();
  const { user, authLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showSlowBootIndicator, setShowSlowBootIndicator] = useState(false);
  const navigatedRef = React.useRef(false);
  const insets = useSafeAreaInsets();

  const proceedToNextScreen = React.useCallback(() => {
    if (authLoading) return;
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    if (user) {
      navigate('Home');
    } else {
      navigate('Welcome');
    }
  }, [user, authLoading, navigate]);

  // Minimum branding display timer (600ms for smooth visual feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && !authLoading) {
      proceedToNextScreen();
    }
  }, [minTimeElapsed, authLoading, proceedToNextScreen]);

  useEffect(() => {
    const visualFailsafeTimer = setTimeout(() => {
      if (authLoading) {
        setShowSlowBootIndicator(true);
      }
    }, 1500);
    return () => clearTimeout(visualFailsafeTimer);
  }, [authLoading]);

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Middle Section with Logo */}
      <View style={styles.middleSection}>
        <View style={styles.logoCardWrapper}>
          <LinearGradient
            colors={['#0F6B73', '#004B5E']}
            style={styles.logoCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </LinearGradient>
        </View>
      </View>

      {/* Bottom Section (Visual loading indicator if boot takes longer than usual) */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        {showSlowBootIndicator && authLoading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="small" color="#03BECD" />
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoCard: {
    width: 130,
    height: 130,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(3, 190, 205, 0.4)',
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  spinnerContainer: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

