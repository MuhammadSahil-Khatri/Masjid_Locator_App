import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ImageBackground, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  // Branding display timer for custom splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      proceedToNextScreen();
    }, 2000);
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
    width: 200,
    height: 200,
    maxWidth: '100%',
    maxHeight: 200,
  },
  textContainer: {
    marginTop: 16,
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
});

