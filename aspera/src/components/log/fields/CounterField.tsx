// Counter field — numeric value with −/+ steppers. Honors `config.step`,
// `config.min`, `config.max`, and an optional `config.unit` label. Used
// for things like "glasses of water" or "doses taken." Non-finite stored
// values reset to `min` (or 0) so the UI never renders NaN.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: number) => void;
}

function formatCount(n: number): string {
  // Keep step 0.5 readable. Anything 0.5-ish gets one decimal, integers
  // stay as integers.
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function CounterField({ field, value, onChange }: Props) {
  const step = field.config?.step ?? 1;
  const min = field.config?.min ?? 0;
  const max = field.config?.max ?? Number.POSITIVE_INFINITY;
  const unit = field.config?.unit ?? "";

  const current =
    typeof value === "number" && Number.isFinite(value) ? value : min;

  const set = (n: number) => {
    const clamped = Math.max(min, Math.min(max, n));
    // Avoid floating-point drift (e.g. 0.1 + 0.2). Snap to one decimal.
    const snapped = Math.round(clamped * 10) / 10;
    if (snapped === current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(snapped);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{field.name}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.adjBtn, current <= min && styles.adjBtnDisabled]}
          onPress={() => set(current - step)}
          disabled={current <= min}
          hitSlop={6}
        >
          <Text style={styles.adjText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>
          {formatCount(current)}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        <TouchableOpacity
          style={[styles.adjBtn, current >= max && styles.adjBtnDisabled]}
          onPress={() => set(current + step)}
          disabled={current >= max}
          hitSlop={6}
        >
          <Text style={styles.adjText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  } as object,
  stepper: {
    flexDirection: "row",
    alignItems: "center",
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
  adjBtnDisabled: {
    opacity: 0.4,
  },
  adjText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  value: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.accent,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  } as object,
  unit: {
    color: COLORS.textMuted,
    fontWeight: "500",
    fontSize: 12,
  } as object,
});
