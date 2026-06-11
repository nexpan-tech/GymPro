/**
 * Theme color tokens for GymPro mobile.
 *
 * Two complete palettes (dark / light). Every screen/component must read
 * colors from the active theme via useTheme() — never hardcode hex values.
 *
 * ── GymPro brand palette — STRICT 4-color identity (mirrors web variables.css) ──
 *   GymPro Red  #E73725  → primary actions / accents / danger
 *   Soft Gray   #E1E1E1  → borders / muted surfaces / secondary derivatives
 *   Jet Black   #010000  → text / dark surfaces
 *   Pure White  #FFFFFF  → backgrounds / cards
 *   Only derivatives (opacity / hover / shade) of these four are permitted.
 *   Positive/warning/info states are differentiated by icon + label, NOT hue.
 */

export const brandColors = {
  gymproRed: "#E73725",
  softGray: "#E1E1E1",
  jetBlack: "#010000",
  pureWhite: "#FFFFFF",
};

export interface ThemeColors {
  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  overlay: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Lines / misc
  border: string;
  borderStrong: string;
  muted: string;
  skeleton: string;

  // Brand + status
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  // Data viz
  chart: string[];

  // Gradient presets ([from, to])
  gradients: {
    primary: [string, string];
    surface: [string, string];
    success: [string, string];
    hero: [string, string];
  };
}

export const darkColors: ThemeColors = {
  // Jet-Black page + jet-black-derived charcoal surfaces.
  background: "#010000",
  surface: "#141414",
  surfaceElevated: "#242424",
  card: "#141414",
  overlay: "rgba(0,0,0,0.72)",

  textPrimary: "#FFFFFF",
  textSecondary: "#C9C9C9",
  textMuted: "#8F8F8F",
  textInverse: "#010000",

  border: "#2A2A2A",
  borderStrong: "#3A3A3A",
  muted: "#1A1A1A",
  skeleton: "#1F1F1F",

  // GymPro Red primary.
  primary: "#E73725",
  primarySoft: "rgba(231,55,37,0.18)",
  onPrimary: "#FFFFFF",
  // Positive/warning/info differentiated by icon+label, not hue → neutral gray.
  success: "#C9C9C9",
  successSoft: "rgba(225,225,225,0.12)",
  warning: "#C9C9C9",
  warningSoft: "rgba(225,225,225,0.12)",
  // Danger = GymPro Red.
  danger: "#E73725",
  dangerSoft: "rgba(231,55,37,0.18)",
  info: "#C9C9C9",
  infoSoft: "rgba(225,225,225,0.12)",

  // Charts: GymPro Red + neutral derivatives only.
  chart: [
    "#E73725",
    "rgba(231,55,37,0.7)",
    "rgba(231,55,37,0.4)",
    "#E1E1E1",
    "rgba(225,225,225,0.6)",
    "#8F8F8F",
  ],

  gradients: {
    primary: ["#E73725", "#A11F13"],
    surface: ["#141414", "#010000"],
    success: ["#3A3A3A", "#242424"],
    hero: ["#1A1A1A", "#010000"],
  },
};

export const lightColors: ThemeColors = {
  // Clean white background + surfaces.
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  card: "#FFFFFF",
  overlay: "rgba(1,0,0,0.45)",

  // Jet-Black text for high-contrast, premium reading.
  textPrimary: "#010000",
  textSecondary: "#3D3D3D",
  textMuted: "#6E6E6E",
  textInverse: "#FFFFFF",

  border: "#E1E1E1",
  borderStrong: "#CFCFCF",
  muted: "#F4F4F4",
  skeleton: "#ECECEC",

  // GymPro Red primary.
  primary: "#E73725",
  primarySoft: "rgba(231,55,37,0.10)",
  onPrimary: "#FFFFFF",
  // Positive/warning/info differentiated by icon+label, not hue → neutral gray.
  success: "#5C5C5C",
  successSoft: "rgba(225,225,225,0.45)",
  warning: "#5C5C5C",
  warningSoft: "rgba(225,225,225,0.45)",
  // Danger = GymPro Red.
  danger: "#E73725",
  dangerSoft: "rgba(231,55,37,0.10)",
  info: "#5C5C5C",
  infoSoft: "rgba(225,225,225,0.45)",

  // Charts: GymPro Red + neutral derivatives only.
  chart: [
    "#E73725",
    "rgba(231,55,37,0.7)",
    "rgba(231,55,37,0.4)",
    "#767676",
    "rgba(225,225,225,0.6)",
    "#A8A8A8",
  ],

  gradients: {
    primary: ["#E73725", "#C72A1B"],
    surface: ["#FFFFFF", "#F4F4F4"],
    success: ["#E1E1E1", "#CFCFCF"],
    hero: ["#010000", "#141414"],
  },
};

export type ThemeMode = "dark" | "light";
