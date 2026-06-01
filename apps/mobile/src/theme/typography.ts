import type { TextStyle } from "react-native";

/** Typographic scale (mode-independent). Colors are applied per-theme by AppText. */

export type TypographyVariant =
  | "display"
  | "title"
  | "heading"
  | "subtitle"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption"
  | "overline";

export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.3 },
  heading: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 15, fontWeight: "500", lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: "700", lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "700" },
  caption: { fontSize: 12, fontWeight: "600" },
  overline: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
};

export type Typography = typeof typography;
