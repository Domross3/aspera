import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function DaylightInput({ value, onChange }: Props) {
  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(0, Math.min(300, value + delta)));
  };

  const levelLabel =
    value >= 60
      ? "Great"
      : value >= 30
        ? "Good"
        : value >= 15
          ? "Low"
          : value > 0
            ? "Minimal"
            : "—";
  const levelColor =
    value >= 60 ? COLORS.success : value >= 30 ? COLORS.warning : COLORS.danger;

  return (
    <View>
      <Text style={styles.heading}>Time in Daylight</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => adjust(-10)}>
          <Ionicons name="remove" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.countWrap}>
          <Text style={styles.count}>{value}</Text>
          <Text style={styles.unit}>minutes</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => adjust(10)}>
          <Ionicons name="add" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Quality indicator */}
      <View style={styles.qualityRow}>
        <Text style={[styles.qualityLabel, { color: levelColor }]}>
          {levelLabel}
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, (value / 90) * 100)}%`,
                backgroundColor: levelColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Quick presets */}
      <View style={styles.chips}>
        {[0, 15, 30, 45, 60, 90].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, value === m && styles.chipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(m);
            }}
          >
            <Text
              style={[styles.chipText, value === m && styles.chipTextActive]}
            >
              {m === 0 ? "None" : `${m}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {value < 15 && value >= 0 && (
        <Text style={styles.tip}>
          30+ min of natural light improves circadian rhythm and next-day sleep
          quality
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
  countWrap: { alignItems: "center", minWidth: 70 },
  count: {
    ...TYPOGRAPHY.hero,
    color: COLORS.warning,
    lineHeight: 42,
  } as object,
  unit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  qualityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  qualityLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    width: 52,
  } as object,
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  chips: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
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
  tip: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: SPACING.sm,
  } as object,
});
