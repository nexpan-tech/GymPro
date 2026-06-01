import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  darkColors,
  lightColors,
  type ThemeColors,
  type ThemeMode,
} from "./colors";
import { spacing, radius, type Spacing, type Radius } from "./spacing";
import { typography, type Typography } from "./typography";
import { makeShadows, type ThemeShadows } from "./shadows";

export type ThemePreference = "dark" | "light" | "system";

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: Spacing;
  radius: Radius;
  typography: Typography;
  shadows: ThemeShadows;
}

export interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  /** Cycles dark → light → system. */
  toggleTheme: () => void;
}

const STORAGE_KEY = "gympro.theme.preference";

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    shadows: makeShadows(mode),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme(); // 'dark' | 'light' | null
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  // Restore persisted preference on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (
          active &&
          (value === "dark" || value === "light" || value === "system")
        ) {
          setPreferenceState(value);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(
      preference === "dark"
        ? "light"
        : preference === "light"
          ? "system"
          : "dark",
    );
  }, [preference, setPreference]);

  const resolvedMode: ThemeMode =
    preference === "system" ? (system === "light" ? "light" : "dark") : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: buildTheme(resolvedMode),
      preference,
      isDark: resolvedMode === "dark",
      setPreference,
      toggleTheme,
    }),
    [resolvedMode, preference, setPreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
