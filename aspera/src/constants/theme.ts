import { TextStyle, ViewStyle } from "react-native";

// Warm-neutral grayscale design system (from the design handoff).
// No hue anywhere except the single reserved `critical` tone (limit states
// only); emphasis comes from lightness, weight, and space. Dark is the default;
// the warm-paper light set + a theme context land in the next phase. Keys stay
// backward-compatible with existing COLORS consumers — remapped onto the warm
// neutral palette so the whole app re-skins without churn.

export const COLORS = {
  background: "#0a0a09", // asp-bg — warm off-black
  surface: "#141311", // asp-surface — raised panels
  surfaceElevated: "#1d1b18", // asp-elevated — buttons, cards

  // "Accent" is no longer a hue — it's the lightest neutral gesture.
  accent: "#d7d2c6", // asp-glow — lightest gesture / emphasis
  accentAlt: "#b4afa5", // asp-text-2
  accentGlow: "rgba(215,210,198,0.22)", // glow at low opacity

  text: "#f2efe8", // asp-text — warm off-white
  textSecondary: "#b4afa5", // asp-text-2
  textMuted: "#76726b", // asp-muted

  // Only `critical` is non-grey. Legacy semantics map onto neutral / critical.
  success: "#b4afa5", // neutral (no green)
  warning: "#b8a489", // critical-adjacent
  danger: "#b8a489", // asp-critical — the one reserved tone

  border: "rgba(244,240,232,0.16)", // asp-line-2
  borderAccent: "rgba(244,240,232,0.16)",

  gradients: {
    card: ["#1d1b18", "#141311"] as string[],
    accent: ["#34322e", "#16150f"] as string[], // orb gradient
    energy: ["#b4afa5", "#76726b"] as string[],
    focus: ["#6c6962", "#b4afa5"] as string[],
    success: ["#b4afa5", "#76726b"] as string[],
    background: ["#0a0a09", "#141311"] as string[],
  },

  intensity: [
    "#2a2824",
    "#34322e",
    "#403d38",
    "#4b4844",
    "#5a5650",
    "#6c6962",
    "#827e76",
    "#9b968c",
    "#b4afa5",
    "#d7d2c6",
  ],

  // ── Handoff-specific warm-neutral tokens for the new design components ──
  faint: "#4b4844", // asp-faint — tertiary / de-emphasized marks
  line: "rgba(244,240,232,0.085)", // asp-line — hairline dividers
  ring: "#6c6962", // asp-ring — breath-ring stroke
  glow: "#d7d2c6", // asp-glow — lightest gesture (inhale peak)
  orbA: "#34322e", // orb gradient highlight
  orbB: "#16150f", // orb gradient shadow
  critical: "#b8a489", // reserved desaturated tone — critical / limit ONLY
  grain: 0.045, // paper-grain overlay opacity
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
  // Handoff personalities:
  soft: 26, // B — soft/organic cards & buttons
  instrument: 10, // C — instrument panels, buttons, rows
  moodSquare: 56, // the circumplex squircle pad
};

export const TYPOGRAPHY: Record<string, TextStyle> = {
  hero: {
    fontFamily: "Quicksand",
    fontSize: 36,
    fontWeight: "500",
    letterSpacing: 0,
  },
  title: {
    fontFamily: "Quicksand",
    fontSize: 22,
    fontWeight: "500",
    letterSpacing: 0,
  },
  subtitle: { fontFamily: "HankenGrotesk", fontSize: 17, fontWeight: "600" },
  body: {
    fontFamily: "HankenGrotesk",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
  },
  caption: {
    fontFamily: "HankenGrotesk",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: "GeistMono",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  aspLabel: {
    fontFamily: "GeistMono",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: COLORS.textMuted,
  },
  mono: {
    fontFamily: "GeistMono",
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.4,
  },
  wordmark: {
    fontFamily: "Quicksand",
    fontSize: 34,
    fontWeight: "500",
    letterSpacing: 1.36,
    lineHeight: 36,
  },
};

export const SHADOWS: Record<string, ViewStyle> = {
  // Depth is communicated by hairline borders + surface lightness, not drops.
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: "#d7d2c6", // warm-neutral glow (was purple)
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};
