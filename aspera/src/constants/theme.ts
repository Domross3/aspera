import { TextStyle, ViewStyle } from "react-native";

export const COLORS = {
  background: "#080808",
  surface: "#121212",
  surfaceElevated: "#1E1E1E",

  accent: "#5E5E5E",
  accentAlt: "#A3A3A3",
  accentGlow: "rgba(255,255,255,0.14)",

  text: "#F5F5F5",
  textSecondary: "#BDBDBD",
  textMuted: "#777777",

  success: "#D4D4D4",
  warning: "#AFAFAF",
  danger: "#8A8A8A",

  border: "rgba(255,255,255,0.10)",
  borderAccent: "rgba(255,255,255,0.32)",

  gradients: {
    card: ["#1E1E1E", "#121212"] as string[],
    accent: ["#686868", "#454545"] as string[],
    energy: ["#AFAFAF", "#777777"] as string[],
    focus: ["#6F6F6F", "#A3A3A3"] as string[],
    success: ["#D4D4D4", "#8A8A8A"] as string[],
    background: ["#080808", "#151515"] as string[],
  },

  intensity: [
    "#2A2A2A",
    "#3A3A3A",
    "#4A4A4A",
    "#5A5A5A",
    "#6A6A6A",
    "#7A7A7A",
    "#8A8A8A",
    "#9A9A9A",
    "#B0B0B0",
    "#D0D0D0",
  ],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const TYPOGRAPHY: Record<string, TextStyle> = {
  hero: { fontSize: 36, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "500", letterSpacing: 0.3 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
};

export const SHADOWS: Record<string, ViewStyle> = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
};
