import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  value: number; // 1–10
  disabled?: boolean;
  onChange: (v: number) => void;
}

export default function IntensitySlider({
  value,
  disabled = false,
  onChange,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const set = (v: number) => {
    if (disabled) return;
    const clamped = Math.max(1, Math.min(10, v));
    if (clamped !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(clamped);
    }
  };

  const intensityColor = disabled
    ? colors.textMuted
    : (colors.intensity[value - 1] ?? colors.accent);

  return (
    <View style={disabled && styles.disabled}>
      {/* Tappable segments */}
      <View style={styles.segmentRow}>
        {Array.from({ length: 10 }).map((_, i) => {
          const segVal = i + 1;
          const active = segVal <= value;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: active ? colors.intensity[i] : colors.border,
                  height: 12 + i * 2.5, // graduated height
                },
              ]}
              onPress={() => set(segVal)}
              activeOpacity={0.7}
              disabled={disabled}
            />
          );
        })}
      </View>

      {/* Labels + value */}
      <View style={styles.labels}>
        <Text style={styles.labelText}>Low</Text>
        <View style={styles.valueRow}>
          <TouchableOpacity
            onPress={() => set(value - 1)}
            disabled={disabled}
            style={styles.adjBtn}
          >
            <Text style={[styles.adjText, { color: intensityColor }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.valueText, { color: intensityColor }]}>
            {disabled ? "—" : value} / 10
          </Text>
          <TouchableOpacity
            onPress={() => set(value + 1)}
            disabled={disabled}
            style={styles.adjBtn}
          >
            <Text style={[styles.adjText, { color: intensityColor }]}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.labelText}>High</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: AsperaColors) => ({
  disabled: { opacity: 0.4 } as const,
  segmentRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 3,
    paddingVertical: SPACING.sm,
  },
  segment: {
    flex: 1,
    borderRadius: RADIUS.sm,
    minHeight: 12,
  },
  labels: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: SPACING.xs,
  },
  labelText: {
    ...TYPOGRAPHY.caption,
    color: c.textMuted,
  } as object,
  valueRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: SPACING.sm,
  },
  valueText: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: "700" as const,
  } as object,
  adjBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.surfaceElevated,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  adjText: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
});
