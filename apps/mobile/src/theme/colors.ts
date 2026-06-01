/**
 * Theme color tokens for GymPro mobile.
 *
 * Two complete palettes (dark / light). Every screen/component must read
 * colors from the active theme via useTheme() — never hardcode hex values.
 */

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
  background: "#0B1120",
  surface: "#0F172A",
  surfaceElevated: "#1E293B",
  card: "#111A2E",
  overlay: "rgba(2,6,23,0.72)",

  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textInverse: "#0B1120",

  border: "rgba(148,163,184,0.18)",
  borderStrong: "rgba(148,163,184,0.30)",
  muted: "#1E293B",
  skeleton: "#1B273B",

  primary: "#6366F1",
  primarySoft: "rgba(99,102,241,0.16)",
  onPrimary: "#FFFFFF",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.16)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.16)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.16)",
  info: "#38BDF8",
  infoSoft: "rgba(56,189,248,0.16)",

  chart: ["#6366F1", "#34D399", "#FBBF24", "#38BDF8", "#F472B6", "#A78BFA"],

  gradients: {
    primary: ["#6366F1", "#4F46E5"],
    surface: ["#0F172A", "#0B1120"],
    success: ["#34D399", "#10B981"],
    hero: ["#312E81", "#1E1B4B"],
  },
};

export const lightColors: ThemeColors = {
  background: "#F4F6FB",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  card: "#FFFFFF",
  overlay: "rgba(15,23,42,0.45)",

  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  border: "rgba(15,23,42,0.10)",
  borderStrong: "rgba(15,23,42,0.18)",
  muted: "#EEF2F7",
  skeleton: "#E2E8F0",

  primary: "#4F46E5",
  primarySoft: "rgba(79,70,229,0.10)",
  onPrimary: "#FFFFFF",
  success: "#059669",
  successSoft: "rgba(5,150,105,0.12)",
  warning: "#D97706",
  warningSoft: "rgba(217,119,6,0.12)",
  danger: "#DC2626",
  dangerSoft: "rgba(220,38,38,0.10)",
  info: "#0284C7",
  infoSoft: "rgba(2,132,199,0.10)",

  chart: ["#4F46E5", "#059669", "#D97706", "#0284C7", "#DB2777", "#7C3AED"],

  gradients: {
    primary: ["#6366F1", "#4F46E5"],
    surface: ["#FFFFFF", "#F4F6FB"],
    success: ["#10B981", "#059669"],
    hero: ["#6366F1", "#4F46E5"],
  },
};

export type ThemeMode = "dark" | "light";
