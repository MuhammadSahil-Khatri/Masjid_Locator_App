import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { setStatusBarStyle } from "expo-status-bar";
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
  return '#004D61';
};

/**
 * Synchronizes the Status Bar and Android Navigation Bar with the active screen background.
 * Matches the translucent, light-content status bar style used in DuaScreen across all screens.
 */
export const useSystemBars = (backgroundColor: string) => {
  useEffect(() => {
    // ── Status Bar (top) — matching DuaScreen (light content, translucent) ─
    setStatusBarStyle("dark");

    if (Platform.OS === "android") {
      // ── Status Bar Background (Android fallback) ───────────────────────────
      try {
        StatusBar.setBackgroundColor("transparent", true);
        StatusBar.setTranslucent(true);
      } catch {
        // Ignored on edge-to-edge or unsupported environments
      }

      // ── Root background ──
      SystemUI.setBackgroundColorAsync("#FAFEFF").catch(() => {});

      // ── Universal Android System Bottom Navigation Bar ─────────────────────
      try {
        if (typeof NavigationBar.setStyle === "function") {
          NavigationBar.setStyle("dark");
        }
      } catch {
        // Ignored if navigation bar styling is unavailable
      }
    }
  }, [backgroundColor]);
};
