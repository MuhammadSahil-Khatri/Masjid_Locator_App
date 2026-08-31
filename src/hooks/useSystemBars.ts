import { useEffect } from "react";
import { Platform } from "react-native";
import {
  setStatusBarStyle,
  setStatusBarBackgroundColor,
} from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { colors } from "../theme";
import { AppScreen } from "../navigation/types";

/**
 * YIQ Relative Luminance Formula to determine if a hex color is light or dark.
 * This guarantees high contrast for status bar icons and nav bar buttons on any background.
 */
export const isColorDark = (color: string): boolean => {
  if (!color) return false;

  let hex = color.replace("#", "").trim();

  // Expand 3-digit / 4-digit shorthand hex (e.g. #fff → #ffffff)
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
};

/**
 * Resolves the expected background color for a given screen + theme state.
 */
export const getScreenBgColor = (
  screenName: AppScreen,
  isDark: boolean,
): string => {
  // Screens that respond to the dark/light theme toggle
  const dynamicScreens: AppScreen[] = [
    "Settings",
    "MosqueDetails",
    "Favorites",
  ];
  if (dynamicScreens.includes(screenName)) {
    return colors.light.background;
  }

  if (screenName === 'Hadees') {
    return '#004D61';
  }

  // Admin / panel screens use the warm off-white background
  const offWhiteScreens: AppScreen[] = [
    "Profile",
    "SuperAdminPanel",
    "ManageMosques",
    "ManageAdmins",
    "ManageSuperAdmins",
    "ManageHadith",
    "ManageAnnouncements",
    "ManageWorshipers",
    "AdminPanel",
    "AssignedMosque",
  ];
  if (offWhiteScreens.includes(screenName)) {
    return colors.white || "#faf8efff";
  }

  // Splash, Welcome, Auth, Home, Search, Qibla — always light
  return colors.light.background;
};

/**
 * Synchronizes the Status Bar and Android Navigation Bar with the active screen background.
 *
 * Android edge-to-edge (API 35 / Expo SDK 54+):
 *  - NavigationBar.setBackgroundColorAsync() is a no-op and must NOT be called.
 *  - Instead, SystemUI.setBackgroundColorAsync() sets the root background that shows
 *    through the transparent system bars.
 *  - NavigationBar.setButtonStyleAsync() still works and controls icon contrast.
 */
export const useSystemBars = (backgroundColor: string) => {
  useEffect(() => {
    const isBgDark = isColorDark(backgroundColor);

    // ── Status Bar (top) ─────────────────────────────────────────────────────
    setStatusBarStyle(isBgDark ? "light" : "dark");
    // setStatusBarBackgroundColor is respected on Android <15 and is a no-op on edge-to-edge
    setStatusBarBackgroundColor(backgroundColor, true);

    if (Platform.OS === "android") {
      // ── Root background (shows through transparent edge-to-edge system bars) ─
      SystemUI.setBackgroundColorAsync(backgroundColor).catch(() => {});

      // ── Navigation bar button contrast (still works in edge-to-edge) ────────
      NavigationBar.setButtonStyleAsync(isBgDark ? "light" : "dark").catch(
        () => {},
      );
    }
  }, [backgroundColor]);
};
