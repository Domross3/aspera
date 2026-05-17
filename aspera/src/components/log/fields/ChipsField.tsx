// Chips field — categorical selection. `config.multi` controls whether
// multiple chips can be active at once; default is single-select. Empty
// or invalid stored value is treated as the empty selection.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../../constants/theme";
import type { FieldDef } from "../../../types";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (next: string[]) => void;
}

export default function ChipsField({ field, value, onChange }: Props) {
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

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 13,
  } as object,
  chipTextActive: {
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  emptyHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: "italic",
  } as object,
});
