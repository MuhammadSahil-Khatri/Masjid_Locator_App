import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';

export const WelcomeScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Islamic Arch Spacing & Bismillah */}
      <View style={[styles.topSection, { paddingTop: Math.max(insets.top + 110, 60) }]}>
        <Text style={styles.bismillahText}>
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </Text>

        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.jamiyatText}>Jamiyat Ahl-e-Hadith</Text>
        <Text style={styles.hydText}>Hyd.</Text>
      </View>

      {/* Middle Center Logo & Subtitle */}
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

        <Text style={styles.descriptionText}>
          Your peaceful companion for Quran, prayers, duas, and a deeper connection with Allah.
        </Text>
      </View>

      {/* Bottom Action Buttons & Legal */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        {/* Get Started Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            navigate('Auth', { isSignUp: true });
          }}
          style={styles.buttonShadow}
        >
          <LinearGradient
            colors={['#0088A5', '#0E5C6E', '#0B4756']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.getStartedButtonText}>
              Get Started  →
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Already have an account button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            navigate('Auth', { isSignUp: false });
          }}
          style={styles.whiteButton}
        >
          <Text style={styles.whiteButtonText}>
            I Already Have an Account
          </Text>
        </TouchableOpacity>

        {/* Footer Legal Terms */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By continuing you agree to our{' '}
            <Text style={styles.legalHighlight}>Terms</Text>
            {' & '}
            <Text style={styles.legalHighlight}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 20,
    color: '#CB9E67',
    fontFamily: typography.fonts.amiri.bold,
    textAlign: 'center',
    letterSpacing: 7,
    opacity: 0.8,
    // marginBottom: 10,
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: typography.fonts.english.bold,
    letterSpacing: 1,
  },
  jamiyatText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#03BECD',
    textAlign: 'center',
    fontFamily: typography.fonts.english.bold,
    // marginTop: 2,
    letterSpacing: 1,
  },
  hydText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#CB9E67',
    textAlign: 'center',
    fontFamily: typography.fonts.english.bold,
    // marginTop: 2,
    letterSpacing: 1,
  },
  middleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  logoCardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  logoCard: {
    width: 150,
    height: 150,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(3, 190, 205, 0.4)',
  },
  logoImage: {
    width: 140,
    height: 140,
    // borderRadius: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    fontFamily: typography.fonts.english.regular,
  },
  bottomSection: {
    width: '100%',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  gradientButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fonts.english.bold,
  },
  whiteButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  whiteButtonText: {
    color: '#0F6B73',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fonts.english.semibold,
  },
  legalContainer: {
    alignItems: 'center',
    marginTop: 18,
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontFamily: typography.fonts.english.regular,
  },
  legalHighlight: {
    color: '#CB9E67',
    textDecorationLine: 'underline',
  },
});

