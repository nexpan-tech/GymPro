import type { ViewStyle } from "react-native";
import type { ThemeMode } from "./colors";

/** Soft elevation presets. Lighter, tighter shadows in light mode. */

export interface ThemeShadows {
  none: ViewStyle;
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
}

export function makeShadows(mode: ThemeMode): ThemeShadows {
  const opacity = mode === "dark" ? 0.35 : 0.12;
  const color = mode === "dark" ? "#000000" : "#0F172A";

  return {
    none: {},
    sm: {
      shadowColor: color,
      shadowOpacity: opacity * 0.7,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    lg: {
      shadowColor: color,
      shadowOpacity: opacity * 1.1,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  };
}
