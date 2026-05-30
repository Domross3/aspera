import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  label: string;
  value: number;
  max?: number;
  onChange: (v: number) => void;
  accentColor?: string;
}

export default function RatingSlider({
  label,
  value,
  max = 5,
  onChange,
  accentColor,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const resolvedAccent = accentColor ?? colors.accent;

  const adjustValue = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(1, Math.min(max, value + delta)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: resolvedAccent }]}>
          {value}/{max}
        </Text>
      </View>

      {/* Tap-to-select dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < value;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(i + 1);
              }}
              style={[
                styles.dot,
                { backgroundColor: filled ? resolvedAccent : colors.border },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => adjustValue(-1)}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              {
                width: `${(value / max) * 100}%`,
                backgroundColor: resolvedAccent,
              },
            ]}
          />
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => adjustValue(1)}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: AsperaColors) => ({
  container: { gap: SPACING.sm },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: c.text,
  } as object,
  value: {
    ...TYPOGRAPHY.title,
    fontWeight: "700" as const,
  } as object,
  dotsRow: {
    flexDirection: "row" as const,
    gap: SPACING.xs - 2,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: RADIUS.pill,
  },
  controls: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: SPACING.sm,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  btnText: {
    fontSize: 20,
    color: c.text,
    lineHeight: 24,
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: c.border,
    overflow: "hidden" as const,
  },
  bar: {
    height: "100%" as const,
    borderRadius: RADIUS.pill,
  },
});
