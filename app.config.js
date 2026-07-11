require('dotenv').config();

export default {
  expo: {
    name: "Masjid Locator App",
    slug: "masjid-locator-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",

    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#020617",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sahilkhatri.masjidlocatorapp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.sahilkhatri.masjidlocatorapp",

      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },

      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#020617",
      },

      jsEngine: "hermes",
    },

    web: {
      favicon: "./assets/logo.png",
    },

    plugins: [
      "expo-asset",
      "expo-font",
      "@react-native-community/datetimepicker",
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "react-native",
          organization: "sahil-khatri",
        },
      ],
    ],

    extra: {
      eas: {
        projectId: "bfd6253f-9c3b-48d3-800a-e43833e77095",
      },
    },
  },
};