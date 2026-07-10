import 'dotenv/config';

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
      backgroundColor: "#020617"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sahilkhatri.masjidlocatorappy",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    android: {
      package: "com.sahilkhatri.masjidlocatorapp",

      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#020617"
      },

      jsEngine: "hermes"
    },

    web: {
      favicon: "./assets/logo.png"
    },

    plugins: [
      "expo-asset",
      "expo-font",
      "@react-native-community/datetimepicker",
      "@maplibre/maplibre-react-native",

      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          organization: "sahil-khatri",
          project: "react-native"
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "bfd6253f-9c3b-48d3-800a-e43833e77095"
      }
    }
  }
};