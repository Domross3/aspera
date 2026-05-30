// Scale field — integer 1–N rating with tappable dots + −/+ adjusters.
// Default range is 1–10 (matches the existing RatingSlider feel) but
// honors `field.config.min/max` when set.
//
// A fresh field starts UNSET (no value) rather than pre-selecting a
// midpoint — the user shouldn't have a number fabricated for them. The
// header shows "—" until they pick, and tapping the currently-selected
// dot clears the value back to unset.

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

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
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
      color: c.text,
    } as object,
    value: {
      ...TYPOGRAPHY.subtitle,
      color: c.accent,
      fontWeight: "700",
    } as object,
    valueMuted: {
      color: c.textMuted,
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
      backgroundColor: c.border,
    },
    dotActive: {
      backgroundColor: c.accent,
    },
    adjRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.md,
    },
    clearBtn: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
    },
    clearText: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 12,
    } as object,
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
    adjText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 20,
    },
  });

export default function ScaleField({ field, value, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const min = field.config?.min ?? 1;
  const max = field.config?.max ?? 10;
  const current =
    typeof value === "number" && Number.isFinite(value) ? value : null;

  const set = (n: number | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (n === undefined) {
      onChange(undefined);
      return;
    }
    onChange(Math.max(min, Math.min(max, n)));
  };

  const ticks = max - min + 1;
  const dots = Array.from({ length: ticks }, (_, i) => min + i);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{field.name}</Text>
        {current === null ? (
          <Text style={styles.valueMuted}>—</Text>
        ) : (
          <Text style={styles.value}>
            {current}
            <Text style={styles.valueMuted}>/{max}</Text>
          </Text>
        )}
      </View>
      <View style={styles.dotsRow}>
        {dots.map((n) => {
          const active = current !== null && n <= current;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.dot, active && styles.dotActive]}
              // Tapping the current top value clears it back to unset.
              onPress={() => set(n === current ? undefined : n)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>
      <View style={styles.adjRow}>
        <TouchableOpacity
          style={styles.adjBtn}
          onPress={() => set(current === null ? min : current - 1)}
          hitSlop={6}
        >
          <Text style={styles.adjText}>−</Text>
        </TouchableOpacity>
        {current !== null ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => set(undefined)}
            hitSlop={6}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.adjBtn}
          onPress={() => set(current === null ? min : current + 1)}
          hitSlop={6}
        >
          <Text style={styles.adjText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
