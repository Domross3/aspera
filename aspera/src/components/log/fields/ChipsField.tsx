// Chips field — categorical selection. `config.multi` controls whether
// multiple chips can be active at once; default is single-select. Empty
// or invalid stored value is treated as the empty selection.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";
import { useTheme } from "../../../theme/ThemeProvider";
import { useThemedStyles } from "../../../theme/useThemedStyles";
import type { AsperaColors } from "../../../theme/ThemeProvider";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: string[]) => void;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    wrap: {
      paddingVertical: SPACING.xs,
    },
    label: {
      ...TYPOGRAPHY.body,
      color: c.text,
      marginBottom: SPACING.sm,
    } as object,
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      borderColor: c.accent,
      backgroundColor: c.accentGlow,
    },
    chipText: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      fontSize: 13,
    } as object,
    chipTextActive: {
      color: c.text,
      fontWeight: "600",
    } as object,
    emptyHint: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontStyle: "italic",
    } as object,
  });

export default function ChipsField({ field, value, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const options = field.config?.options ?? [];
  const multi = field.config?.multi ?? false;
  const selected: string[] = Array.isArray(value)
    ? (value.filter((v) => typeof v === "string") as string[])
    : [];

  const toggle = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (multi) {
      const next = selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option];
      onChange(next);
    } else {
      // Single-select: tapping the active chip clears selection so the
      // user can express "none" without an explicit clear button.
      onChange(selected.includes(option) ? [] : [option]);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{field.name}</Text>
      <View style={styles.chipsRow}>
        {options.length === 0 ? (
          <Text style={styles.emptyHint}>
            No options configured. Edit this metric to add chip choices.
          </Text>
        ) : (
          options.map((option) => {
            const active = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() => toggle(option)}
                activeOpacity={0.7}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}
