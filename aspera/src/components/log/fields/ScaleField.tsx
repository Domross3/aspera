// Scale field — integer 1–N rating with tappable dots + −/+ adjusters.
// Default range is 1–10 (matches the existing RatingSlider feel) but
// honors `field.config.min/max` when set. Renders nothing if the stored
// value isn't a number — caller is expected to seed mid-range.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: number) => void;
}

export default function ScaleField({ field, value, onChange }: Props) {
  const min = field.config?.min ?? 1;
  const max = field.config?.max ?? 10;
  const current =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Math.round((min + max) / 2);

  const set = (n: number) => {
    const clamped = Math.max(min, Math.min(max, n));
    if (clamped === current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(clamped);
  };

  const ticks = max - min + 1;
  const dots = Array.from({ length: ticks }, (_, i) => min + i);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{field.name}</Text>
        <Text style={styles.value}>
          {current}
          <Text style={styles.valueMuted}>/{max}</Text>
        </Text>
      </View>
      <View style={styles.dotsRow}>
        {dots.map((n) => {
          const active = n <= current;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.dot, active && styles.dotActive]}
              onPress={() => set(n)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>
      <View style={styles.adjRow}>
        <TouchableOpacity
          style={styles.adjBtn}
          onPress={() => set(current - 1)}
          hitSlop={6}
        >
          <Text style={styles.adjText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjBtn}
          onPress={() => set(current + 1)}
          hitSlop={6}
        >
          <Text style={styles.adjText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.xs,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  } as object,
  value: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  valueMuted: {
    color: COLORS.textMuted,
    fontWeight: "500",
  } as object,
  dotsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: SPACING.sm,
  },
  dot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
  },
  adjRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.md,
  },
  adjBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  adjText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
});
