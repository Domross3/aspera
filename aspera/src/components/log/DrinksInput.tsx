import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function DrinksInput({ value, onChange }: Props) {
  const tap = (n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(0, Math.min(12, n)));
  };

  return (
    <View>
      <Text style={styles.heading}>How many drinks last night?</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => tap(value - 1)}>
          <Ionicons name="remove" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.countWrap}>
          <Text style={styles.count}>{value}</Text>
          <Text style={styles.unit}>{value === 1 ? "drink" : "drinks"}</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => tap(value + 1)}>
          <Ionicons name="add" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Quick-select chips */}
      <View style={styles.chips}>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, value === n && styles.chipActive]}
            onPress={() => tap(n)}
          >
            <Text
              style={[styles.chipText, value === n && styles.chipTextActive]}
            >
              {n === 0 ? "None" : n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {value >= 3 && (
        <Text style={styles.warning}>
          3+ drinks significantly impacts next-day focus and REM sleep
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  } as object,
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  countWrap: { alignItems: "center", minWidth: 60 },
  count: {
    ...TYPOGRAPHY.hero,
    color: COLORS.warning,
    lineHeight: 42,
  } as object,
  unit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  chips: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  chipActive: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600",
  } as object,
  chipTextActive: {
    color: "#000",
  },
  warning: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: SPACING.sm,
  } as object,
});
