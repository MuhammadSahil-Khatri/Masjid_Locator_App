export default {
  expo: {
    name: "Jamiyat Ahl-e-Hadith Hyd",
    slug: "masjid-locator-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",

    androidStatusBar: {
      barStyle: "light-content",
      backgroundColor: "#020617",
      translucent: false,
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.khubaibkhatri.jah",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.khubaibkhatri.jah",
      softwareKeyboardLayoutMode: "resize",
      blockedPermissions: [
        "android.permission.ACTIVITY_RECOGNITION",
      ],

      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },

      adaptiveIcon: {
        foregroundImage: "./assets/app_icon.png",
        backgroundColor: "#ffffffff",
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
      "./plugins/withWorkManagerFix",
      [
        "expo-splash-screen",
        {
          image: "./assets/logo.png",
          imageWidth: 250,
          resizeMode: "contain",
          backgroundColor: "#ffffffff",
        },
      ],
      [
        "expo-notifications",
        {
          color: "#1D3B6D",
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
