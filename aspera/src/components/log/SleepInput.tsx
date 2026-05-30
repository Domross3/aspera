import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function SleepInput({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.round((value + delta) * 10) / 10;
    onChange(Math.max(0, Math.min(14, next)));
  };

  const qualityLabel =
    value >= 8
      ? "Great"
      : value >= 7
        ? "Good"
        : value >= 6
          ? "Fair"
          : value > 0
            ? "Low"
            : "—";
  const qualityColor =
    value >= 8
      ? colors.success
      : value >= 7
        ? colors.accentAlt
        : value >= 6
          ? colors.warning
          : colors.danger;

  return (
    <View>
      <Text style={styles.heading}>Time in Bed</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => adjust(-0.5)}>
          <Ionicons name="remove" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.countWrap}>
          <Text style={styles.count}>{value.toFixed(1)}</Text>
          <Text style={styles.unit}>hours</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => adjust(0.5)}>
          <Ionicons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quality indicator */}
      <View style={styles.qualityRow}>
        <Text style={[styles.qualityLabel, { color: qualityColor }]}>
          {qualityLabel}
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, (value / 9) * 100)}%`,
                backgroundColor: qualityColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Quick presets */}
      <View style={styles.chips}>
        {[5, 6, 6.5, 7, 7.5, 8, 9].map((h) => (
          <TouchableOpacity
            key={h}
            style={[
              styles.chip,
              Math.abs(value - h) < 0.05 && styles.chipActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(h);
            }}
          >
            <Text
              style={[
                styles.chipText,
                Math.abs(value - h) < 0.05 && styles.chipTextActive,
              ]}
            >
              {h}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c: AsperaColors) => ({
  heading: {
    ...TYPOGRAPHY.body,
    color: c.textSecondary,
    marginBottom: SPACING.md,
  } as object,
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: SPACING.lg,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surfaceElevated,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  countWrap: { alignItems: "center" as const, minWidth: 70 },
  count: {
    ...TYPOGRAPHY.hero,
    color: c.accentAlt,
    lineHeight: 42,
  } as object,
  unit: {
    ...TYPOGRAPHY.caption,
    color: c.textMuted,
  } as object,
  qualityRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  qualityLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700" as const,
    width: 40,
  } as object,
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: c.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  barFill: {
    height: "100%" as const,
    borderRadius: 3,
  },
  chips: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    flexWrap: "wrap" as const,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceElevated,
  },
  chipActive: {
    backgroundColor: c.accentAlt,
    borderColor: c.accentAlt,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: c.textSecondary,
    fontWeight: "600" as const,
  } as object,
  chipTextActive: {
    color: c.background,
  },
});
