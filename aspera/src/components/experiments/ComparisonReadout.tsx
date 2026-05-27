// ComparisonReadout — visualizes a ComparisonResult with the confidence
// layout we designed in the grilling session:
//   - Effect ± range (numeric, no jargon)
//   - Qualitative label (low / moderate / high / strong) as 5-dot meter
//   - "Likely positive X%"
//
// Used by both the ad-hoc Compare surface (Phase 8 sub-phase 8g) and the
// experiment readout cards (Phase 8 sub-phase 8f, when it lands).
//
// Honesty constraints baked in:
//   - Below-threshold effect sizes get a "no detectable effect" label
//     instead of reporting a tiny positive number that sounds meaningful
//   - The card never claims certainty above what the data supports — the
//     hard floor in confidence.ts is what produces the "low" label

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import type { ComparisonResult } from "../../types";

interface Props {
  result: ComparisonResult;
  treatmentLabel: string;
  outcomeLabel: string;
  // Number of control-group days, used in the "split: X vs Y" caption.
  controlSize: number;
  // Optional caveat shown below the card (e.g., warmup state copy).
  caveat?: string;
}

const NO_EFFECT_THRESHOLD = 0.15;
const CONFIDENCE_DOT_COUNT = 5;
const CONFIDENCE_LEVEL_FILL: Record<
  ComparisonResult["confidenceLabel"],
  number
> = {
  low: 1,
  moderate: 2,
  high: 3,
  strong: 5,
};

function formatEffect(effect: number): string {
  const sign = effect > 0 ? "+" : effect < 0 ? "−" : "±";
  const abs = Math.abs(effect);
  // 1 decimal place — matches existing focus/energy formatting.
  return `${sign}${abs.toFixed(1)}`;
}

function formatRangeHalf(range: { low: number; high: number }): string {
  // Symmetric ± from the midpoint feels more readable than "(low, high)".
  const half = Math.abs(range.high - range.low) / 2;
  return `± ${half.toFixed(1)}`;
}

export default function ComparisonReadout({
  result,
  treatmentLabel,
  outcomeLabel,
  controlSize,
  caveat,
}: Props) {
  const noDetectableEffect =
    Math.abs(result.effect) < NO_EFFECT_THRESHOLD &&
    result.confidenceLabel !== "high" &&
    result.confidenceLabel !== "strong";

  const dotFill = CONFIDENCE_LEVEL_FILL[result.confidenceLabel];
  const probPercent = Math.round(result.probabilityPositive * 100);

  // Treat very-near-zero effects as a "no detectable effect" reading
  // instead of reporting "+0.05" which sounds meaningful but isn't.
  if (noDetectableEffect) {
    return (
      <GradientCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {treatmentLabel}
            <Text style={styles.arrow}> → </Text>
            {outcomeLabel}
          </Text>
        </View>
        <Text style={styles.noEffect}>No detectable effect</Text>
        <Text style={styles.caption}>
          {result.sampleSize} treatment day{result.sampleSize === 1 ? "" : "s"}{" "}
          vs {controlSize} control. Sample may be too small or the effect too
          subtle for a confident call.
        </Text>
        {caveat ? <Text style={styles.caveat}>{caveat}</Text> : null}
      </GradientCard>
    );
  }

  return (
    <GradientCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {treatmentLabel}
          <Text style={styles.arrow}> → </Text>
          {outcomeLabel}
        </Text>
        <Text style={styles.sampleHint}>
          {result.sampleSize} vs {controlSize}
        </Text>
      </View>

      <View style={styles.effectRow}>
        <Text style={styles.effectValue}>{formatEffect(result.effect)}</Text>
        <Text style={styles.effectRange}>{formatRangeHalf(result.range)}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.dotsRow}>
          {Array.from({ length: CONFIDENCE_DOT_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < dotFill ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          ))}
          <Text style={styles.confidenceLabel}>{result.confidenceLabel}</Text>
        </View>
        <Text style={styles.probabilityText}>
          {probPercent}% likely {result.effect >= 0 ? "positive" : "negative"}
        </Text>
      </View>

      {caveat ? <Text style={styles.caveat}>{caveat}</Text> : null}
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
  } as object,
  arrow: {
    color: COLORS.textMuted,
    fontWeight: "400",
  } as object,
  sampleHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
  effectRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  effectValue: {
    ...TYPOGRAPHY.hero,
    color: COLORS.accent,
    fontWeight: "800",
    fontSize: 36,
    letterSpacing: -1,
  } as object,
  effectRange: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  } as object,
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFilled: {
    backgroundColor: COLORS.accent,
  },
  dotEmpty: {
    backgroundColor: COLORS.border,
  },
  confidenceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: SPACING.xs,
    textTransform: "capitalize",
  } as object,
  probabilityText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  } as object,
  noEffect: {
    ...TYPOGRAPHY.title,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    fontStyle: "italic",
  } as object,
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  } as object,
  caveat: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    lineHeight: 16,
  } as object,
});
