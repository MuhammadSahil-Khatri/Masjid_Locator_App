export default {
  expo: {
    name: "Jamiyat Ahl-e-Hadith Hyd",
    slug: "masjid-locator-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/app_icon.png",
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
      googleServicesFile: "./google-services.json",

      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.SCHEDULE_EXACT_ALARM",
      ],
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
      favicon: "./assets/app_icon.png",
    },

    plugins: [
      "expo-asset",
      "expo-font",
      "@react-native-community/datetimepicker",
      "./plugins/withWorkManagerFix",
      [
        "expo-splash-screen",
        {
          image: "./assets/app_icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffffff",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/app_icon.png",
          color: "#1D3B6D",
          defaultChannel: "default",
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
