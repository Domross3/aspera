// Duration field — minutes stored as a number, displayed as `Xh Ym`.
// Steppers honor `config.step` (default 15 min). Uses the same visual
// shape as CounterField but rephrases the value for readability.

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

function formatDuration(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function DurationField({ field, value, onChange }: Props) {
  const step = field.config?.step ?? 15;
  const min = field.config?.min ?? 0;
  const max = field.config?.max ?? Number.POSITIVE_INFINITY;
  const current =
    typeof value === "number" && Number.isFinite(value) ? value : min;

  const set = (n: number) => {
    const clamped = Math.max(min, Math.min(max, n));
    if (clamped === current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(clamped);
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
        <Text style={styles.value}>{formatDuration(current)}</Text>
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
    minWidth: 60,
    textAlign: "center",
  } as object,
});
