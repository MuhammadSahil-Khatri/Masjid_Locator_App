import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ImageBackground, ActivityIndicator, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';

export const SplashScreen = () => {
  const { navigate } = useNavigation();
  const navigatedRef = React.useRef(false);
  const insets = useSafeAreaInsets();

  const proceedToNextScreen = React.useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    navigate('Home');
  }, [navigate]);

  // Minimum branding display timer (600ms for smooth visual feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      proceedToNextScreen();
    }, 600);
    return () => clearTimeout(timer);
  }, [proceedToNextScreen]);

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

          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Jamiyat Ahl-e-Hadith Hyd.</Text>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 16, 28) }]} />
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
    width: 200,
    height: 200,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(3, 190, 205, 0.4)',
  },
  logoImage: {
    width: 220,
    height: 220,
    borderRadius: 20,
  },
  textContainer: {
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffff',
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

