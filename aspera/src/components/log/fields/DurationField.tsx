// Duration field — minutes stored as a number, displayed as `Xh Ym`.
// Steppers honor `config.step` (default 15 min). Uses the same visual
// shape as CounterField but rephrases the value for readability.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";
import { useThemedStyles } from "../../../theme/useThemedStyles";
import type { AsperaColors } from "../../../theme/ThemeProvider";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: number | undefined) => void;
}

function formatDuration(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: SPACING.xs,
    },
    label: {
      ...TYPOGRAPHY.body,
      color: c.text,
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
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    adjBtnDisabled: {
      opacity: 0.4,
    },
    adjText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 20,
    },
    value: {
      ...TYPOGRAPHY.subtitle,
      color: c.accent,
      fontWeight: "700",
      minWidth: 60,
      textAlign: "center",
    } as object,
    valueMuted: {
      ...TYPOGRAPHY.subtitle,
      color: c.textMuted,
      fontWeight: "700",
      minWidth: 60,
      textAlign: "center",
    } as object,
  });

export default function DurationField({ field, value, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const step = field.config?.step ?? 15;
  const min = field.config?.min ?? 0;
  const max = field.config?.max ?? Number.POSITIVE_INFINITY;
  // Starts UNSET — no fabricated duration. "—" until the user taps +.
  const current =
    typeof value === "number" && Number.isFinite(value) ? value : null;

  const set = (n: number) => {
    const clamped = Math.max(min, Math.min(max, n));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(clamped);
  };

  const clear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(undefined);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{field.name}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[
            styles.adjBtn,
            current !== null && current <= min && styles.adjBtnDisabled,
          ]}
          onPress={() => (current === null ? clear() : set(current - step))}
          disabled={current !== null && current <= min}
          hitSlop={6}
        >
          <Text style={styles.adjText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={current === null ? 1 : 0.6}
          onPress={current === null ? undefined : clear}
        >
          {current === null ? (
            <Text style={styles.valueMuted}>—</Text>
          ) : (
            <Text style={styles.value}>{formatDuration(current)}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.adjBtn,
            current !== null && current >= max && styles.adjBtnDisabled,
          ]}
          onPress={() => set(current === null ? min + step : current + step)}
          disabled={current !== null && current >= max}
          hitSlop={6}
        >
          <Text style={styles.adjText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
